from typing import ClassVar

from app.modules.shared.domain import NonEmptyString


class LastName(NonEmptyString):
    MAX_LENGTH: ClassVar[int] = 40

    def __init__(self, value: str, pass_validation: bool = False):
        super().__init__(
            value,
            field="lastName",
            label="Last name",
            max_length=LastName.MAX_LENGTH,
            pass_validation=pass_validation,
        )
