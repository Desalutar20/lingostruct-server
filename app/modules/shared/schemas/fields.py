from typing import Annotated

from pydantic import AfterValidator, EmailStr, Field, SecretStr

from app.modules.shared.domain import Email

from .validators import validate_password

EmailField = Annotated[EmailStr, Field(max_length=Email.MAX_LENGTH)]
NonEmptyField = Annotated[str, Field(min_length=1)]
PasswordField = Annotated[
    SecretStr,
    AfterValidator(validate_password),
]
