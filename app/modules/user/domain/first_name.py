from typing import ClassVar

from app.modules.shared.domain import NonEmptyString


class FirstName(NonEmptyString):
    MAX_LENGTH: ClassVar[int] = 40

    def __init__(self, value: str, pass_validation: bool = False):
        super().__init__(
            value,
            field="firstName",
            label="First name",
            max_length=FirstName.MAX_LENGTH,
            pass_validation=pass_validation,
        )
