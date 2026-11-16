import re
from re import Pattern
from typing import ClassVar

from app.modules.shared.domain import ValidationError

from .nonemptystring import NonEmptyString


class Email(NonEmptyString):
    MAX_LENGTH: ClassVar[int] = 200
    __EMAIL_REGEX: ClassVar[Pattern[str]] = re.compile(r"[^@]+@[^@]+\.[^@]+")

    def __init__(self, value: str, pass_validation: bool = False):
        super().__init__(
            value,
            field="email",
            label="Email",
            max_length=Email.MAX_LENGTH,
            additional_check=Email.validate,
            pass_validation=pass_validation,
        )

    @classmethod
    def validate(cls, value: str):
        if not Email.__EMAIL_REGEX.fullmatch(value):
            raise ValidationError("email", ["Invalid email address"])
