from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from app.modules.auth.usecases.verify_account import VerifyAccountCommand
from app.modules.shared.cqrs import ICommandHandler
from app.modules.shared.domain import Email, NonEmptyString
from app.modules.shared.schemas import EmailField, SuccessResponse


class VerifyAccountRequest(BaseModel):
    model_config = ConfigDict(str_min_length=1, str_strip_whitespace=True)

    email: EmailField
    token: Annotated[str, Field(min_length=1)]

    def to_command(self):
        return VerifyAccountCommand(
            Email(self.email, True),
            NonEmptyString(self.token, field="token", label="Token"),
        )


def make_verify_account_router(
    command_handler: ICommandHandler[VerifyAccountCommand, None],
):
    router = APIRouter()

    @router.post(
        "/verify-account",
        response_model=SuccessResponse[str],
        status_code=HTTPStatus.OK,
        summary="Verifies a user's account",
        description="Marks a user account as verified using the provided token and email.",
    )
    async def verify_account(data: VerifyAccountRequest):
        command = data.to_command()
        await command_handler.handle(command)

        return SuccessResponse(
            data="Your account has been successfully verified. You can now log in.j"
        )

    return router
