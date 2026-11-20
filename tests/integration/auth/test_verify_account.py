import pytest
from fastapi import status

from app.modules.auth.routes.verify_account_router import VerifyAccountRequest
from tests.integration.fakedata import FakeData
from tests.integration.testapp import TestApp
from tests.integration.testapp._redis_requests import RedisTokenType


class TestVerifyAccount:
    @pytest.mark.anyio
    async def test_should_return_ok_when_request_is_valid(self, test_app: TestApp):
        sign_up_request = FakeData.sign_up_request()

        sign_up_response = await test_app.sign_up(sign_up_request)
        TestApp.assert_valid_status(sign_up_response, status.HTTP_201_CREATED)

        verify_account_token = await test_app.get_redis_token(
            RedisTokenType.ACCOUNT_VERIFICATION
        )
        assert verify_account_token is not None

        request = VerifyAccountRequest(
            email=sign_up_request.email, token=verify_account_token
        )

        response = await test_app.verify_account(request)
        TestApp.assert_valid_status(response, status.HTTP_200_OK)

        user = await test_app.get_user_by_email(sign_up_request.email)
        assert user is not None
        assert user["is_verified"]

    @pytest.mark.anyio
    @pytest.mark.parametrize(
        ("field", "value"),
        [
            pytest.param("token", "", id="empty token"),
            pytest.param("token", "   ", id="whitespace token"),
            pytest.param("email", "", id="empty email"),
            pytest.param("email", "   ", id="whitespace email"),
            pytest.param("email", "invalid", id="invalid email"),
        ],
    )
    async def test_should_return_bad_request_when_request_is_invalid(
        self,
        test_app: TestApp,
        field: str,
        value: str,
    ):
        request = VerifyAccountRequest(email=FakeData.Email(), token="token")
        setattr(request, field, value)

        response = await test_app.verify_account(request)

        TestApp.assert_valid_status(response, status.HTTP_400_BAD_REQUEST)
        TestApp.assert_validation_error(response, field)
