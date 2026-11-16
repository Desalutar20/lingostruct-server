from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.database import Database
from app.modules.shared.background_tasks import BackgroundJobs

from .services import Services


def setup_background_jobs(services: Services, database: Database):
    scheduler = AsyncIOScheduler()

    BackgroundJobs.init(scheduler, database, services.email_service)

    return scheduler
