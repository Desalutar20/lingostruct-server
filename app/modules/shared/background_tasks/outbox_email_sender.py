import asyncio
from typing import ClassVar

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.logger import LOGGER
from app.modules.shared.data import UnitOfWork
from app.modules.shared.outbox import Outbox, OutboxID
from app.modules.shared.services.email import (
    EmailMessageConverter,
    EmailService,
)

from .background import BackgroundJob


class OutboxEmailSender(BackgroundJob):
    __BATCH_SIZE: ClassVar[int] = 100
    __CHUNK_SIZE: ClassVar[int] = 10
    __MAX_RETRIES: ClassVar[int] = 3

    def __init__(
        self, scheduler: AsyncIOScheduler, uow: UnitOfWork, email_service: EmailService
    ):

        self._uow = uow
        self._email_service = email_service
        self.job_id = "outbox_email_sender"

        super().__init__(
            scheduler,
            job_id=self.job_id,
            trigger="interval",
            trigger_args={"minutes": 1},
        )

    async def execute(self):
        async with self._uow as uow:
            outboxes = await uow.outbox.get_unprocessed(self.__BATCH_SIZE)
            if not outboxes:
                return

            start = 0
            ids: list[OutboxID] = []

            while start < len(outboxes):
                chunk = outboxes[start : start + self.__CHUNK_SIZE]
                if not chunk:
                    break

                results = await asyncio.gather(
                    *[self.send_email(outbox) for outbox in chunk],
                )

                ids.extend(result for result in results if result is not None)
                start += self.__CHUNK_SIZE

            if ids:
                await uow.outbox.mark_as_processed_bulk(ids)
                await uow.commit()

    async def send_email(self, outbox: Outbox) -> OutboxID | None:
        for attempt in range(1, self.__MAX_RETRIES + 1):
            try:
                deserialized = EmailMessageConverter.deserialize(outbox.data.value)
                await self._email_service.send(deserialized)

                return outbox.id
            except Exception:
                LOGGER.exception(
                    "Failed to send outbox email %s (attempt %s/%s)",
                    outbox.id,
                    attempt,
                    self.__MAX_RETRIES,
                )

        return None
