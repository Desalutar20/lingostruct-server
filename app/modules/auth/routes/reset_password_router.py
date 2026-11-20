from http import HTTPStatus

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

from app.modules.auth.usecases.reset_password import ResetPasswordCommand
from app.modules.shared.cqrs import ICommandHandler
from app.modules.shared.domain import Email, NonEmptyString
from app.modules.shared.schemas import EmailField, PasswordField, SuccessResponse
from app.modules.shared.schemas.fields import NonEmptyField
from app.modules.user.domain import Password


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(str_min_length=1, str_strip_whitespace=True)

    email: EmailField
    token: NonEmptyField
    new_password: PasswordField

    def to_command(self):
        return ResetPasswordCommand(
            Email(self.email, True),
            NonEmptyString(self.token, field="token", label="Token"),
            Password(self.new_password.get_secret_value(), True),
        )


def make_reset_password_router(
    command_handler: ICommandHandler[ResetPasswordCommand, None],
):
    router = APIRouter()

    @router.post(
        "/reset-password",
        response_model=SuccessResponse[str],
        status_code=HTTPStatus.OK,
        summary="Resets a user's password using a valid token.",
        description="Allows a user to set a new password if they provide a valid reset token and their email.",
    )
    async def reset_password(data: ResetPasswordRequest):
        command = data.to_command()

        await command_handler.handle(command)

        return SuccessResponse(data="Your password has been reset successfully.")

    return router
