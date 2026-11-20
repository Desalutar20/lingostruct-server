from pydantic import SecretStr
from pydantic_core import PydanticCustomError

from app.modules.user.domain import Password


def validate_password(value: SecretStr) -> SecretStr:
    password = value.get_secret_value().strip()
    length = len(password)

    if length < Password.MIN_LENGTH or length > Password.MAX_LENGTH:
        raise PydanticCustomError(
            "password_length",
            "Password length must be between {min_length} and {max_length}",
            {
                "min_length": Password.MIN_LENGTH,
                "max_length": Password.MAX_LENGTH,
            },
        )

    return SecretStr(password)
