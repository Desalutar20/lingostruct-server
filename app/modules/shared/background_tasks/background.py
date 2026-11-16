from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler


class BackgroundJob(ABC):
    def __init__(
        self,
        scheduler: AsyncIOScheduler,
        *,
        job_id: str,
        trigger: str,
        trigger_args: dict[str, Any],
        next_run_time: datetime | None = None,
        max_instances: int = 1,
        coalesce: bool = True,
    ) -> None:
        scheduler.add_job(
            self.execute,
            trigger=trigger,
            id=job_id,
            replace_existing=True,
            max_instances=max_instances,
            coalesce=coalesce,
            next_run_time=datetime.now() if next_run_time is None else next_run_time,
            **trigger_args,
        )

    @abstractmethod
    async def execute(self) -> None: ...
