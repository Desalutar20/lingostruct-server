import httpx
from fastapi import status

from app.modules.auth.routes.forgot_password_router import ForgotPasswordRequest
from app.modules.auth.routes.reset_password_router import ResetPasswordRequest
from app.modules.auth.routes.sign_in_router import SignInRequest
from app.modules.auth.routes.sign_up_router import SignUpRequest
from app.modules.auth.routes.verify_account_router import VerifyAccountRequest
from tests.integration.testapp._redis_requests import RedisTokenType


async def sign_up(self, request: SignUpRequest) -> httpx.Response:
    payload = request.model_dump(mode="json")
    payload["password"] = request.password.get_secret_value()

    return await self.client.post("/api/v1/auth/sign-up", json=payload)


async def sign_in(self, request: SignInRequest) -> httpx.Response:
    payload = request.model_dump(mode="json")
    payload["password"] = request.password.get_secret_value()

    return await self.client.post("/api/v1/auth/sign-in", json=payload)


async def verify_account(self, request: VerifyAccountRequest) -> httpx.Response:
    return await self.client.post(
        "/api/v1/auth/verify-account",
        json=request.model_dump(mode="json"),
    )


async def create_and_verify(self, request: SignUpRequest):
    sign_up_response = await self.sign_up(request)
    assert sign_up_response.status_code == status.HTTP_201_CREATED

    token = await self.get_redis_token(RedisTokenType.ACCOUNT_VERIFICATION)
    assert token is not None

    response = await self.verify_account(
        VerifyAccountRequest(email=request.email, token=token)
    )
    assert response.status_code == status.HTTP_200_OK


async def forgot_password(self, request: ForgotPasswordRequest) -> httpx.Response:
    return await self.client.post(
        "/api/v1/auth/forgot-password",
        json=request.model_dump(mode="json"),
    )


async def reset_password(self, request: ResetPasswordRequest) -> httpx.Response:
    payload = request.model_dump(mode="json")
    payload["new_password"] = request.new_password.get_secret_value()

    return await self.client.post("/api/v1/auth/reset-password", json=payload)
