from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.modules.shared.services.email import EmailService

from .outbox_email_sender import OutboxEmailSender


class BackgroundJobs:
    @staticmethod
    def init(scheduler: AsyncIOScheduler, pool, email_service: EmailService):
        OutboxEmailSender(scheduler, pool, email_service)


__all__ = ["BackgroundJobs"]
