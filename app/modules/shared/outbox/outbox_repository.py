from datetime import UTC, datetime

import asyncpg

from app.modules.shared.data.base_repository import BaseRepository
from app.modules.shared.domain import NonEmptyString

from .outbox import Outbox
from .outbox_id import OutboxID
from .outbox_type import OutboxType


class OutboxRepository(BaseRepository):
    def __init__(self, pool, conn: asyncpg.Connection | None = None):
        super().__init__(pool, conn)

    async def create(self, outbox: Outbox) -> None:
        async with self.connection() as conn:
            await conn.execute(
                """
                           INSERT INTO outbox (
                              id,
                              created_at,
                              updated_at,
                              type,
                              data,
                              processed_at
                           )
                           VALUES ($1, $2, $3, $4, $5, $6)
                           """,
                outbox.id,
                outbox.created_at,
                outbox.updated_at,
                outbox.type.value,
                outbox.data.value,
                outbox.processed_at,
            )

    async def get_unprocessed(self, type: OutboxType, limit: int) -> list[Outbox]:
        async with self.connection() as conn:
            records = await conn.fetch(
                """
                              SELECT id,
                                     created_at,
                                     updated_at,
                                     type,
                                     data,
                                     processed_at
                              FROM outbox
                              WHERE type = $1 AND processed_at IS NULL
                              ORDER BY created_at ASC
                              LIMIT $2
                              FOR UPDATE SKIP LOCKED
                                  """,
                type.value,
                limit,
            )

        return [OutboxRepository.__to_domain(record) for record in records]

    async def mark_as_processed_bulk(self, ids: list[OutboxID]) -> None:
        if not ids:
            return

        async with self.connection() as conn:
            await conn.execute(
                """UPDATE outbox
                   SET updated_at = $1,
                       processed_at = $1
                   WHERE id ANY($2)""",
                datetime.now(UTC),
                ids,
            )

    @staticmethod
    def __to_domain(record: asyncpg.Record) -> Outbox:
        return Outbox.from_persistence(
            OutboxID(record["id"]),
            record["created_at"],
            record["updated_at"],
            OutboxType(record["type"]),
            NonEmptyString(record["data"]),
            record["processed_at"],
        )
