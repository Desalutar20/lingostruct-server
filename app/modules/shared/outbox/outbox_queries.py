from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.shared.outbox import OutboxID

from .outbox import Outbox as DomainOutbox
from .outbox_model import Outbox


async def get_unprocessed_outboxes(
    session: AsyncSession, limit: int
) -> list[DomainOutbox]:
    result = await session.execute(
        select(Outbox)
        .where(Outbox.processed_at.is_(None))
        .limit(limit)
        .order_by(
            Outbox.created_at.asc(),
        )
        .with_for_update(skip_locked=True)
    )

    return [outbox.to_domain() for outbox in result.scalars().all()]


async def mark_outboxes_as_processed_bulk(
    session: AsyncSession, ids: list[OutboxID]
) -> None:
    if not ids:
        return

    now = datetime.now(UTC)

    await session.execute(
        update(Outbox)
        .where(Outbox.id.in_(ids) & Outbox.processed_at.is_(None))
        .values({"updated_at": now, "processed_at": now})
    )


def create_outbox(session: AsyncSession, outbox: DomainOutbox) -> None:
    model = Outbox.from_domain(outbox)

    session.add(model)
