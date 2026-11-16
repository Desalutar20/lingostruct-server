from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import Redis

from app.core.config import Config
from app.core.database import Database, Model

from .background_jobs import setup_background_jobs
from .exception_handlers import add_exception_handlers
from .modules import setup_modules
from .routes import add_routes
from .services import setup_services


def build_app(config: Config):
    database = Database(config.database)
    redis = Redis(
        host=config.redis.host,
        port=config.redis.port,
        decode_responses=True,
        max_connections=10,
    )

    services = setup_services(config)
    modules = setup_modules(services, database, redis, config.application)
    scheduler = setup_background_jobs(services, database)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        async with database.engine.begin() as connection:
            await connection.run_sync(Model.metadata.create_all)

        scheduler.start()
        yield
        scheduler.shutdown()
        await redis.aclose()
        await database.dispose()
        await services.email_service.close()

    app = FastAPI(lifespan=lifespan)

    add_exception_handlers(app)
    add_routes(app, config.application, modules)

    return app
