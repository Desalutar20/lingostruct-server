from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.shared.outbox import OutboxID

from .outbox import Outbox as DomainOutbox
from .outbox_model import Outbox


class OutboxRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_unprocessed(self, limit: int) -> list[DomainOutbox]:
        result = await self._session.execute(
            select(Outbox)
            .where(Outbox.processed_at.is_(None))
            .limit(limit)
            .order_by(
                Outbox.created_at.asc(),
            )
            .with_for_update(skip_locked=True)
        )

        return [outbox.to_domain() for outbox in result.scalars().all()]

    async def mark_as_processed_bulk(self, ids: list[OutboxID]) -> None:
        if not ids:
            return

        now = datetime.now(UTC)

        await self._session.execute(
            update(Outbox)
            .where(Outbox.id.in_(ids) & Outbox.processed_at.is_(None))
            .values({"updated_at": now, "processed_at": now})
        )

    def create(self, outbox: DomainOutbox) -> None:
        model = Outbox.from_domain(outbox)

        self._session.add(model)
