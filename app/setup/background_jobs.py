from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.modules.shared.background_tasks import BackgroundJobs

from .services import Services


def setup_background_jobs(services: Services, pool):
    scheduler = AsyncIOScheduler()

    BackgroundJobs.init(scheduler, pool, services.email_service)

    return scheduler
