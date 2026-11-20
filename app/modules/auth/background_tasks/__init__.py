from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.modules.auth.background_tasks.forgot_password_outbox_handler import (
    ForgotPasswordOutboxHandler,
)
from app.modules.auth.usecases.process_forgot_password import (
    ProcessForgotPasswordCommand,
)
from app.modules.shared.cqrs import ICommandHandler


class BackgroundJobs:
    @staticmethod
    def init(
        scheduler: AsyncIOScheduler,
        pool,
        process_forgot_password_command_handler: ICommandHandler[
            ProcessForgotPasswordCommand, None
        ],
    ):
        pass
        # ForgotPasswordOutboxHandler(
        #     scheduler,
        #     pool,
        #     process_forgot_password_command_handler,
        # )


__all__ = ["BackgroundJobs"]
