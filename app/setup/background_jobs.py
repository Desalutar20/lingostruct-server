from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.modules.shared.background_tasks import BackgroundJobs
from app.modules.shared.data import UnitOfWork

from .services import Services


def setup_background_jobs(services: Services, uow: UnitOfWork):
    scheduler = AsyncIOScheduler()

    BackgroundJobs.init(scheduler, uow, services.email_service)

    return scheduler
