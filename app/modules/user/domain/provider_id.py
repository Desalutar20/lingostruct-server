from typing import ClassVar

from app.modules.shared.domain import NonEmptyString


class ProviderID(NonEmptyString):
    MAX_LENGTH: ClassVar[int] = 40

    def __init__(self, value: str):
        super().__init__(
            value,
            field="providerId",
            label="OAauth provider id",
            max_length=ProviderID.MAX_LENGTH,
        )
