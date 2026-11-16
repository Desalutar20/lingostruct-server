from fastapi import APIRouter
from redis.asyncio import Redis

from app.core.config import ApplicationConfig
from app.modules.auth.services.auth_cache import AuthCache
from app.modules.auth.usecases.sign_up import SignUpCommandHandler
from app.modules.shared.data import UnitOfWork
from app.modules.shared.services import RedisKeyGenerator
from app.modules.shared.services.email.email_service import EmailService

from .routes import *


class Module:
    def __init__(
        self,
        email_service: EmailService,
        redis_key_generator: RedisKeyGenerator,
        uow: UnitOfWork,
        redis: Redis,
        config: ApplicationConfig,
    ):
        self.router: APIRouter = APIRouter(prefix="/auth", tags=["Authentication"])

        auth_cache = AuthCache(redis, config, redis_key_generator)
        sign_up_command_handler = SignUpCommandHandler(
            email_service,
            uow,
            auth_cache,
            config,
        )

        self.router.include_router(make_sign_in_router())
        self.router.include_router(make_sign_up_router(sign_up_command_handler))
