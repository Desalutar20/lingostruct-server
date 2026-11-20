from dataclasses import dataclass

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from redis.asyncio import Redis

from app.core.config import Config
from app.modules.auth import Module as AuthModule
from app.modules.shared.outbox.outbox_repository import OutboxRepository
from app.modules.user import Module as UserModule

from .services import Services


@dataclass
class Modules:
    auth_module: AuthModule
    user_module: UserModule


def setup_modules(
    services: Services,
    pool,
    redis: Redis,
    scheduler: AsyncIOScheduler,
    config: Config,
):
    outbox_repository = OutboxRepository(pool)

    user_module = UserModule(pool)
    auth_module = AuthModule(
        services.redis_key_generator,
        pool,
        user_module.repository,
        outbox_repository,
        redis,
        scheduler,
        config,
    )

    return Modules(auth_module, user_module)
