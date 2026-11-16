from typing import ClassVar
from urllib.parse import urlparse

from app.modules.shared.domain import ValidationError

from .nonemptystring import NonEmptyString


class Url(NonEmptyString):
    MAX_LENGTH: ClassVar[int] = 2000

    def __init__(self, value: str, field: str = "url", pass_validation: bool = False):
        super().__init__(
            value,
            field=field,
            label="URL",
            max_length=Url.MAX_LENGTH,
            additional_check=lambda v: self.validate(v, field),
            pass_validation=pass_validation,
        )

    @classmethod
    def validate(cls, value: str, field: str):
        result = urlparse(value)
        if result.scheme not in ("http", "https") or not result.hostname:
            raise ValidationError(field, ["Invalid URL"])
