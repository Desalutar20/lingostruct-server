from datetime import UTC, datetime
from uuid import uuid4

from app.modules.shared.domain import Entity, NonEmptyString
from app.modules.shared.outbox.outbox_id import OutboxID
from app.modules.shared.outbox.outbox_type import OutboxType


class Outbox(Entity[OutboxID]):
    def __init__(self, type: OutboxType, data: NonEmptyString):
        now = datetime.now(UTC)

        super().__init__(OutboxID(uuid4()), now, now)

        self.__type = type
        self.__data = data
        self.__processed_at: datetime | None = None

    @property
    def type(self):
        return self.__type

    @property
    def data(self):
        return self.__data

    @property
    def processed_at(self):
        return self.__processed_at

    def mark_as_processed(self):
        if self.__processed_at:
            return

        now = datetime.now(UTC)
        self._updated_at = now
        self.__processed_at = now

    @classmethod
    def from_persistence(
        cls,
        id: OutboxID,
        created_at: datetime,
        updated_at: datetime,
        type: OutboxType,
        data: NonEmptyString,
        processed_at: datetime | None,
    ) -> "Outbox":
        outbox = cls.__new__(cls)
        Entity.__init__(outbox, id, created_at, updated_at)

        outbox.__type = type
        outbox.__data = data
        outbox.__processed_at = processed_at

        return outbox
