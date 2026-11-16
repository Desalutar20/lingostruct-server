from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.database import Database
from app.modules.shared.data import UnitOfWork
from app.modules.shared.services.email import EmailService

from .outbox_email_sender import OutboxEmailSender


class BackgroundJobs:
    @staticmethod
    def init(
        scheduler: AsyncIOScheduler, database: Database, email_service: EmailService
    ):
        OutboxEmailSender(scheduler, database, email_service)


__all__ = ["BackgroundJobs"]
