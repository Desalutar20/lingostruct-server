from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import APIRouter
from redis.asyncio import Redis

from app.core.config import Config
from app.modules.auth.usecases.process_forgot_password import (
    ProcessForgotPasswordCommandHandler,
)
from app.modules.shared.outbox.outbox_repository import OutboxRepository
from app.modules.shared.services import RedisKeyGenerator
from app.modules.user.data import UserRepository

from .background_tasks import BackgroundJobs
from .routes import *
from .services import *
from .usecases import *


class Module:
    def __init__(
        self,
        redis_key_generator: RedisKeyGenerator,
        pool,
        user_repository: UserRepository,
        outbox_repository: OutboxRepository,
        redis: Redis,
        scheduler: AsyncIOScheduler,
        config: Config,
    ):
        self.router: APIRouter = APIRouter(prefix="/auth", tags=["Authentication"])

        auth_cache = AuthCache(redis, config.application, redis_key_generator)
        session_store = SessionStore(redis, redis_key_generator, config)

        sign_up_command_handler = SignUpCommandHandler(
            pool,
            auth_cache,
            config.application,
        )
        sign_in_command_handler = SignInCommandHandler(
            user_repository, session_store, config.application
        )
        verify_account_command_handler = VerifyAccountCommandHandler(
            user_repository, auth_cache
        )
        forgot_password_command_handler = ForgotPasswordCommandHandler(
            outbox_repository
        )
        process_forgot_password_command_handler = ProcessForgotPasswordCommandHandler(
            user_repository, outbox_repository, auth_cache, config.application
        )
        reset_password_command_handler = ResetPasswordCommandHandler(
            user_repository, auth_cache, session_store
        )
        BackgroundJobs.init(scheduler, pool, process_forgot_password_command_handler)

        self.router.include_router(make_sign_up_router(sign_up_command_handler))
        self.router.include_router(
            make_sign_in_router(sign_in_command_handler, config.application)
        )
        self.router.include_router(
            make_verify_account_router(verify_account_command_handler)
        )
        self.router.include_router(
            make_forgot_password_router(forgot_password_command_handler)
        )
        self.router.include_router(
            make_reset_password_router(reset_password_command_handler)
        )
