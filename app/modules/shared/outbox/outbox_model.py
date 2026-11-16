from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Model
from app.modules.shared.domain import NonEmptyString
from app.modules.shared.outbox import OutboxID

from .outbox import Outbox as DomainOutbox
from .outbox_type import OutboxType

_types = ", ".join(f"'{type}'" for type in OutboxType._VALID_TYPES)


class Outbox(Model):
    __tablename__ = "outbox"

    __table_args__ = (
        CheckConstraint(
            f"type IN ({_types})",
            name="ck_outbox_type",
        ),
    )

    type: Mapped[str] = mapped_column(nullable=False)
    data: Mapped[str] = mapped_column(JSONB, nullable=False)
    processed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def to_domain(self) -> DomainOutbox:
        return DomainOutbox.from_persistence(
            OutboxID(self.id),
            self.created_at,
            self.updated_at,
            OutboxType(self.type),
            NonEmptyString(self.data),
            self.processed_at,
        )

    @staticmethod
    def from_domain(outbox: DomainOutbox) -> "Outbox":
        return Outbox(
            id=outbox.id,
            created_at=outbox.created_at,
            updated_at=outbox.updated_at,
            type=outbox.type.value,
            data=outbox.data.value,
            processed_at=outbox.processed_at,
        )
