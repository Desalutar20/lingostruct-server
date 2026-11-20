import asyncio
import os
import subprocess
from uuid import uuid4

import asyncpg
import httpx
from asgi_lifespan import LifespanManager
from redis.asyncio import Redis

from app.core.config import Config
from app.setup import build_app


class TestApp:
    __test__ = False

    from ._assertions import assert_valid_status, assert_validation_error
    from ._auth_requests import (
        create_and_verify,
        forgot_password,
        reset_password,
        sign_in,
        sign_up,
        verify_account,
    )
    from ._db_requests import ban_user_by_email, get_outboxes_by_type, get_user_by_email
    from ._redis_requests import get_redis_token, set_redis_value

    assert_valid_status = staticmethod(assert_valid_status)
    assert_validation_error = staticmethod(assert_validation_error)

    def __init__(self):
        config = Config()

        self.config = config.model_copy(
            update={
                "database": config.database.model_copy(
                    update={"name": f"test_{uuid4().hex}"},
                ),
                "redis": config.redis.model_copy(
                    update={"key_prefix": uuid4().hex},
                ),
            }
        )

        self.admin_connection: asyncpg.Connection

        self.redis: Redis

        self.client: httpx.AsyncClient
        self._lifespan: LifespanManager

    async def __aenter__(self):
        try:
            self.admin_connection = await asyncpg.connect(
                dsn=self.config.database.connection_string_without_database()
            )

            await self.admin_connection.execute(
                f'CREATE DATABASE "{self.config.database.name}"'
            )

            envs = os.environ
            envs["GOOSE_DBSTRING"] = (
                f"user={self.config.database.user} password={self.config.database.password.get_secret_value()} host={self.config.database.host} port={self.config.database.port} dbname={self.config.database.name} sslmode=disable"
            )
            proc = await asyncio.create_subprocess_exec(
                "goose",
                "up",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=envs,
            )

            stdout, stderr = await proc.communicate()

            if proc.returncode != 0:
                raise RuntimeError(
                    f"Goose migrations failed:\n{stdout.decode()}\n{stderr.decode()}"
                )

            self.pool = await asyncpg.create_pool(
                dsn=self.config.database.connection_string(), min_size=1, max_size=5
            )

            self.redis = Redis(
                host=self.config.redis.host,
                port=self.config.redis.port,
                decode_responses=True,
            )

            app = build_app(self.config)

            self._lifespan = LifespanManager(app)
            manager = await self._lifespan.__aenter__()

            self.client = httpx.AsyncClient(
                transport=httpx.ASGITransport(
                    app=manager.app, raise_app_exceptions=False
                ),
                base_url="http://test",
            )

            return self

        except BaseException:
            await self._cleanup()
            raise

    async def __aexit__(self, exc_type, exc, tb):
        await self._cleanup(exc_type, exc, tb)

    async def _cleanup(self, exc_type=None, exc=None, tb=None):
        if self.client is not None:
            await self.client.aclose()

        if self._lifespan is not None:
            await self._lifespan.__aexit__(exc_type, exc, tb)

        if self.redis is not None:
            async for key in self.redis.scan_iter(
                match=f"{self.config.redis.key_prefix}*",
            ):
                await self.redis.unlink(key)

            await self.redis.aclose()

        if self.pool is not None:
            await self.pool.close()

        if self.admin_connection is not None:
            await self.admin_connection.execute(
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = $1
                  AND pid <> pg_backend_pid()
                """,
                self.config.database.name,
            )

            await self.admin_connection.execute(
                f'DROP DATABASE IF EXISTS "{self.config.database.name}"'
            )

            await self.admin_connection.close()
