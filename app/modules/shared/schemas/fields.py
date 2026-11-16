from typing import Annotated

from pydantic import EmailStr, Field

from app.modules.shared.domain import Email
from app.modules.user.domain import Password

EmailField = Annotated[EmailStr, Field(max_length=Email.MAX_LENGTH)]
PasswordField = Annotated[
    str,
    Field(
        min_length=Password.MIN_LENGTH,
        max_length=Password.MAX_LENGTH,
    ),
]
