import asyncio
import json
from typing import ClassVar
from uuid import UUID

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.logger import LOGGER
from app.modules.auth.usecases.process_forgot_password import (
    ProcessForgotPasswordCommand,
)
from app.modules.shared.background_tasks.background import BackgroundJob
from app.modules.shared.cqrs import ICommandHandler
from app.modules.shared.data.unit_of_work import UnitOfWork
from app.modules.shared.domain import Email
from app.modules.shared.outbox.outbox import Outbox
from app.modules.shared.outbox.outbox_id import OutboxID
from app.modules.shared.outbox.outbox_type import OutboxType


class ForgotPasswordOutboxHandler(BackgroundJob):
    __BATCH_SIZE: ClassVar[int] = 100

    def __init__(
        self,
        scheduler: AsyncIOScheduler,
        pool,
        handler: ICommandHandler[ProcessForgotPasswordCommand, None],
    ):
        self._pool = pool
        self._handler = handler

        super().__init__(
            scheduler,
            job_id="forgot_password_outbox_handler",
            trigger="interval",
            trigger_args={"minutes": 1},
        )

    async def execute(self) -> None:
        try:
            async with UnitOfWork(self._pool) as uow:
                outboxes = await uow.outbox.get_unprocessed(
                    OutboxType.FORGOT_PASSWORD,
                    self.__BATCH_SIZE,
                )

            if not outboxes:
                return

            results = await asyncio.gather(
                *(self.handle(outbox) for outbox in outboxes),
                return_exceptions=True,
            )

            ids: list[OutboxID] = [
                result for result in results if isinstance(result, UUID)
            ]

            if ids:
                await uow.outbox.mark_as_processed_bulk(ids)
                await uow.commit()

        except Exception:
            LOGGER.exception("Failed to process forgot password outboxes")

    async def handle(self, outbox: Outbox) -> OutboxID | None:
        data = json.loads(outbox.data.value)
        email = Email(data["email"])

        await self._handler.handle(ProcessForgotPasswordCommand(email))

        return outbox.id
