from typing import ClassVar

from app.modules.shared.domain import NonEmptyString


class Password(NonEmptyString):
    MIN_LENGTH: ClassVar[int] = 8
    MAX_LENGTH: ClassVar[int] = 40

    def __init__(self, value: str, pass_validation: bool = False):
        super().__init__(
            value,
            field="password",
            label="Password",
            min_length=Password.MIN_LENGTH,
            max_length=Password.MAX_LENGTH,
            pass_validation=pass_validation,
        )
