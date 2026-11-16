from typing import ClassVar

from app.modules.shared.domain import InternalError, NonEmptyString, ValidationError


class PasswordHash(NonEmptyString):
    MIN_LENGTH: ClassVar[int] = 40
    MAX_LENGTH: ClassVar[int] = 200

    def __init__(self, value: str, salt: bytes):
        try:
            super().__init__(
                value,
                min_length=PasswordHash.MIN_LENGTH,
                max_length=PasswordHash.MAX_LENGTH,
            )

            self.__salt = salt

        except ValidationError:
            raise InternalError("Invalid hashed password")

    @property
    def salt(self):
        return self.__salt
