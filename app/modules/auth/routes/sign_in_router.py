from http import HTTPStatus
from typing import Annotated
from uuid import UUID

from fastapi import Response
from fastapi.routing import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import ApplicationConfig
from app.modules.auth.usecases import SignInCommand
from app.modules.shared.cqrs import ICommandHandler
from app.modules.shared.domain import Email
from app.modules.shared.schemas import EmailField, PasswordField
from app.modules.shared.schemas.response_schema import SuccessResponse
from app.modules.user.domain import Password
from app.modules.user.schemas.user_schema import UserSchema


class SignInRequest(BaseModel):
    model_config = ConfigDict(str_min_length=1, str_strip_whitespace=True)

    email: EmailField
    password: PasswordField

    def to_command(self):
        return SignInCommand(
            Email(self.email, True), Password(self.password.get_secret_value(), True)
        )


def make_sign_in_router(
    command_handler: ICommandHandler[SignInCommand, tuple[UserSchema, UUID]],
    config: ApplicationConfig,
):
    router = APIRouter()

    @router.post(
        "/sign-in",
        response_model=SuccessResponse[UserSchema],
        status_code=HTTPStatus.OK,
        summary="Authenticates a user",
        description="Logs in a user using email and password and returns authentication info",
    )
    async def sign_in(data: SignInRequest, response: Response):
        command = data.to_command()
        user, session_id = await command_handler.handle(command)

        response.set_cookie(
            config.session_cookie_name,
            str(session_id),
            max_age=config.session_ttl_minutes * 60,
            path="/",
            secure=config.cookie_secure,
        )

        return SuccessResponse[UserSchema](data=user)

    return router
