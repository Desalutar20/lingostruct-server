from http import HTTPStatus

from fastapi.routing import APIRouter
from pydantic import BaseModel, ConfigDict

from app.modules.auth.usecases.forgot_password import ForgotPasswordCommand
from app.modules.shared.cqrs import ICommandHandler
from app.modules.shared.domain import Email
from app.modules.shared.schemas import EmailField
from app.modules.shared.schemas.response_schema import SuccessResponse


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(str_min_length=1, str_strip_whitespace=True)

    email: EmailField

    def to_command(self):
        return ForgotPasswordCommand(Email(self.email, True))


def make_forgot_password_router(
    command_handler: ICommandHandler[ForgotPasswordCommand, None],
):
    router = APIRouter()

    @router.post(
        "/forgot-password",
        response_model=SuccessResponse[str],
        status_code=HTTPStatus.OK,
        summary="Sends a password reset email to the user.",
        description="Triggers the password reset workflow using the provided email.",
    )
    async def forgot_password(data: ForgotPasswordRequest):
        command = data.to_command()
        await command_handler.handle(command)

        return SuccessResponse[str](
            data="If the email is registered, password reset instructions have been sent"
        )

    return router
