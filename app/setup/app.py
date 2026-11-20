from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI
from redis.asyncio import Redis

from app.core.config import Config

from .background_jobs import setup_background_jobs
from .exception_handlers import add_exception_handlers
from .modules import setup_modules
from .routes import add_middlewares, add_routes
from .services import setup_services


def build_app(config: Config):
    redis = Redis(
        host=config.redis.host,
        port=config.redis.port,
        decode_responses=True,
        max_connections=10,
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        pool = await asyncpg.create_pool(dsn=config.database.connection_string())

        services = setup_services(config)
        scheduler = setup_background_jobs(services, pool)
        modules = setup_modules(services, pool, redis, scheduler, config)

        add_routes(app, modules)

        scheduler.start()
        yield

        scheduler.shutdown()
        await redis.aclose()
        await pool.close()
        await services.email_service.close()

    app = FastAPI(lifespan=lifespan)

    add_middlewares(app, config.application)
    add_exception_handlers(app)

    return app
