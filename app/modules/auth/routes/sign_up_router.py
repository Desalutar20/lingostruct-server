from http import HTTPStatus
from typing import Annotated

from fastapi.routing import APIRouter
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.auth.usecases.sign_up import SignUpCommand
from app.modules.shared.cqrs import ICommandHandler
from app.modules.shared.domain import Email
from app.modules.shared.schemas.response_schema import SuccessResponse
from app.modules.user.domain import FirstName, LastName, Password


class SignUpRequest(BaseModel):
    model_config = ConfigDict(str_min_length=1, str_strip_whitespace=True)

    email: EmailStr
    password: Annotated[
        str,
        Field(
            min_length=Password.MIN_LENGTH,
            max_length=Password.MAX_LENGTH,
        ),
    ]
    first_name: Annotated[str, Field(max_length=FirstName.MAX_LENGTH)]
    last_name: Annotated[str, Field(max_length=LastName.MAX_LENGTH)]

    def to_command(self):
        return SignUpCommand(
            Email(self.email, True),
            Password(self.password, True),
            FirstName(self.first_name, True),
            LastName(self.last_name, True),
        )


def make_sign_up_router(command_handler: ICommandHandler[SignUpCommand, None]):
    router = APIRouter()

    @router.post(
        "/sign-up",
        response_model=SuccessResponse[str],
        status_code=HTTPStatus.CREATED,
        summary="Register a new user",
        description="Creates a user with email, password, first name and last name.",
        response_description="Registration confirmation message",
    )
    async def sign_up(data: SignUpRequest):
        command = data.to_command()
        await command_handler.handle(command)

        return SuccessResponse(
            data="If the email is registered, instructions have been sent"
        )

    return router
