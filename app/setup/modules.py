from dataclasses import dataclass

from redis.asyncio import Redis

from app.core.config import ApplicationConfig
from app.core.database import Database
from app.modules.auth import Module as AuthModule
from app.modules.user import Module as UserModule

from .services import Services


@dataclass
class Modules:
    auth_module: AuthModule
    user_module: UserModule


def setup_modules(
    services: Services,
    database: Database,
    redis: Redis,
    config: ApplicationConfig,
):

    auth_module = AuthModule(
        services.redis_key_generator,
        database,
        redis,
        config,
    )
    user_module = UserModule(database)

    return Modules(auth_module, user_module)
