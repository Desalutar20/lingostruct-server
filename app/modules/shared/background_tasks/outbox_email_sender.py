import asyncio
from typing import ClassVar
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.logger import LOGGER
from app.modules.shared.data.unit_of_work import UnitOfWork
from app.modules.shared.outbox.outbox import Outbox
from app.modules.shared.outbox.outbox_id import OutboxID
from app.modules.shared.outbox.outbox_type import OutboxType
from app.modules.shared.services.email import (
    EmailMessage,
    EmailService,
)

from .background import BackgroundJob


class OutboxEmailSender(BackgroundJob):
    __BATCH_SIZE: ClassVar[int] = 100
    __CHUNK_SIZE: ClassVar[int] = 10
    __MAX_RETRIES: ClassVar[int] = 3

    def __init__(
        self,
        scheduler: AsyncIOScheduler,
        pool,
        email_service: EmailService,
    ):

        self._pool = pool
        self._email_service = email_service

        super().__init__(
            scheduler,
            job_id="outbox_email_sender",
            trigger="interval",
            trigger_args={"minutes": 1},
        )

    async def execute(self) -> None:
        try:
            async with UnitOfWork(self._pool) as uow:
                outboxes = await uow.outbox.get_unprocessed(
                    OutboxType.EMAIL,
                    self.__BATCH_SIZE,
                )

                if not outboxes:
                    return

                ids: list[OutboxID] = []

                for start in range(0, len(outboxes), self.__CHUNK_SIZE):
                    chunk = outboxes[start : start + self.__CHUNK_SIZE]

                    results = await asyncio.gather(
                        *(self.send_email(outbox) for outbox in chunk),
                        return_exceptions=True,
                    )

                    ids.extend(result for result in results if isinstance(result, UUID))

                if ids:
                    await uow.outbox.mark_as_processed_bulk(ids)
                    await uow.commit()

        except Exception:
            LOGGER.exception("Failed to execute outbox email sender")

    async def send_email(self, outbox: Outbox) -> OutboxID | None:
        for attempt in range(1, self.__MAX_RETRIES + 1):
            try:
                deserialized = EmailMessage.deserialize(outbox.data.value)
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
