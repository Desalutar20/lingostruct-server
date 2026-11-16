from typing import ClassVar

from app.modules.shared.domain import InternalError, NonEmptyString


class OutboxType(NonEmptyString):
    EMAIL: ClassVar["OutboxType"]
    _VALID_TYPES: ClassVar[frozenset[str]] = frozenset({"email"})

    def __init__(self, value: str):
        super().__init__(
            value,
            field="type",
            label="Outbox type",
            additional_check=OutboxType.validate,
        )

    @classmethod
    def validate(cls, value: str):
        if value not in OutboxType._VALID_TYPES:
            raise InternalError(
                f"Invalid outbox type: {value}",
            )


OutboxType.EMAIL = OutboxType("email")
