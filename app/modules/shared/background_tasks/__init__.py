from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.modules.shared.data import UnitOfWork
from app.modules.shared.services.email import EmailService

from .outbox_email_sender import OutboxEmailSender


class BackgroundJobs:
    @staticmethod
    def init(scheduler: AsyncIOScheduler, uow: UnitOfWork, email_service: EmailService):
        outbox_email_sender = OutboxEmailSender(scheduler, uow, email_service)

        # await scheduler


__all__ = ["BackgroundJobs"]
