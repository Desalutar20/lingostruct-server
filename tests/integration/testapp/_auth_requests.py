import httpx

from app.modules.auth.routes.sign_up_router import SignUpRequest


async def sign_up(self, request: SignUpRequest) -> httpx.Response:
    return await self.client.post(
        "/api/v1/auth/sign-up",
        json=request.model_dump(mode="json"),
    )
