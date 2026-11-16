from typing import Annotated

from fastapi.routing import APIRouter
from pydantic import BaseModel, EmailStr, Field

from app.modules.shared.schemas.response_schema import SuccessResponse
from app.modules.user.domain import Password


class SignInRequest(BaseModel):
    email: EmailStr
    password: Annotated[
        str,
        Field(
            min_length=Password.MIN_LENGTH,
            max_length=Password.MAX_LENGTH,
        ),
    ]


def make_sign_in_router():
    router = APIRouter()

    @router.post("/sign-in", response_model=SuccessResponse[str])
    async def sign_in(data: SignInRequest):
        return SuccessResponse[str](data="success")

    return router
