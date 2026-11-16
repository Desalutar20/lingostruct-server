from uuid import uuid4

import asyncpg
import httpx
from asgi_lifespan import LifespanManager
from redis.asyncio import Redis

from app.core.config import Config
from app.core.database import Database
from app.setup import build_app


class TestApp:
    __test__ = False

    from ._assertions import assert_valid_status, assert_validation_error
    from ._auth_requests import sign_up
    from ._db_requests import get_user_by_email

    assert_valid_status = staticmethod(assert_valid_status)
    assert_validation_error = staticmethod(assert_validation_error)

    def __init__(self):
        config = Config()

        self.redis_key_prefix = uuid4().hex
        self.config = config.model_copy(
            update={
                "database": config.database.model_copy(
                    update={"name": f"test_{uuid4().hex}"},
                ),
                "redis": config.redis.model_copy(
                    update={"key_prefix": self.redis_key_prefix},
                ),
            }
        )

        self.admin_connection: asyncpg.Connection | None = None

        self.database: Database
        self.redis: Redis

        self.client: httpx.AsyncClient
        self._lifespan: LifespanManager | None = None

    async def __aenter__(self):
        try:
            self.admin_connection = await asyncpg.connect(
                host=self.config.database.host,
                port=self.config.database.port,
                user=self.config.database.user,
                password=self.config.database.password.get_secret_value(),
                database="postgres",
                ssl="require" if self.config.database.ssl else None,
            )

            await self.admin_connection.execute(
                f'CREATE DATABASE "{self.config.database.name}"'
            )

            self.database = Database(self.config.database)

            self.redis = Redis(
                host=self.config.redis.host,
                port=self.config.redis.port,
                decode_responses=True,
            )

            app = build_app(self.config)

            self._lifespan = LifespanManager(app)
            manager = await self._lifespan.__aenter__()

            self.client = httpx.AsyncClient(
                transport=httpx.ASGITransport(app=manager.app),
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
            self._lifespan = None

        if self.redis is not None:
            async for key in self.redis.scan_iter(
                match=f"{self.redis_key_prefix}*",
            ):
                await self.redis.unlink(key)

            await self.redis.aclose()

        if self.database is not None:
            await self.database.dispose()

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
            self.admin_connection = None
