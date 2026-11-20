import pytest
from fastapi import status
from pydantic import SecretStr

from app.modules.auth.routes.reset_password_router import ResetPasswordRequest
from app.modules.shared.domain import Email
from app.modules.user.domain import Password
from tests.integration.fakedata import FakeData
from tests.integration.testapp import TestApp
from tests.integration.testapp._redis_requests import RedisTokenType


class TestResetPassword:
    @pytest.mark.anyio
    async def test_should_return_ok_when_request_is_valid(self, test_app: TestApp):
        sign_up_request = FakeData.sign_up_request()
        await test_app.create_and_verify(sign_up_request)

        user = await test_app.get_user_by_email(sign_up_request.email)
        assert user

        token = await test_app.set_redis_value(
            RedisTokenType.RESET_PASSWORD, str(user["id"])
        )
        new_password = FakeData.Password()

        request = ResetPasswordRequest(
            email=sign_up_request.email, token=token, new_password=new_password
        )

        response = await test_app.reset_password(request)
        TestApp.assert_valid_status(response, status.HTTP_200_OK)

    @pytest.mark.anyio
    async def test_should_return_ok_when_user_does_not_exist(self, test_app: TestApp):
        request = ResetPasswordRequest(
            email=FakeData.Email(), token="token", new_password=FakeData.Password()
        )

        reset_password_response = await test_app.reset_password(request)
        TestApp.assert_valid_status(
            reset_password_response, status.HTTP_400_BAD_REQUEST
        )

    @pytest.mark.anyio
    async def test_should_return_ok_when_user_is_not_verified(self, test_app: TestApp):
        sign_up_request = FakeData.sign_up_request()

        sign_up_response = await test_app.sign_up(sign_up_request)
        TestApp.assert_valid_status(sign_up_response, status.HTTP_201_CREATED)

        user = await test_app.get_user_by_email(sign_up_request.email)
        assert user

        token = await test_app.set_redis_value(
            RedisTokenType.RESET_PASSWORD, str(user["id"])
        )

        request = ResetPasswordRequest(
            email=sign_up_request.email,
            token=token,
            new_password=FakeData.Password(),
        )

        reset_password_response = await test_app.reset_password(request)
        TestApp.assert_valid_status(
            reset_password_response, status.HTTP_400_BAD_REQUEST
        )

    @pytest.mark.anyio
    async def test_should_return_ok_when_user_is_banned(self, test_app: TestApp):
        sign_up_request = FakeData.sign_up_request()

        sign_up_response = await test_app.sign_up(sign_up_request)
        TestApp.assert_valid_status(sign_up_response, status.HTTP_201_CREATED)

        user = await test_app.get_user_by_email(sign_up_request.email)
        assert user

        token = await test_app.set_redis_value(
            RedisTokenType.RESET_PASSWORD, str(user["id"])
        )
        await test_app.ban_user_by_email(sign_up_request.email)

        request = ResetPasswordRequest(
            email=sign_up_request.email, token=token, new_password=FakeData.Password()
        )

        reset_password_response = await test_app.reset_password(request)
        TestApp.assert_valid_status(
            reset_password_response, status.HTTP_400_BAD_REQUEST
        )

    @pytest.mark.anyio
    @pytest.mark.parametrize(
        ("field", "value"),
        [
            pytest.param("token", "", id="empty token"),
            pytest.param("token", "   ", id="whitespace token"),
            pytest.param("email", "", id="empty email"),
            pytest.param("email", "   ", id="whitespace email"),
            pytest.param("email", "invalid", id="invalid email"),
            pytest.param(
                "email",
                f"{'t' * Email.MAX_LENGTH}@gmail.com",
                id="email exceeds maximum length",
            ),
            pytest.param("new_password", SecretStr(""), id="empty password"),
            pytest.param("new_password", SecretStr("   "), id="whitespace password"),
            pytest.param(
                "new_password",
                SecretStr("t" * (Password.MIN_LENGTH - 1)),
                id="password too short",
            ),
            pytest.param(
                "new_password",
                SecretStr("t" * (Password.MAX_LENGTH + 1)),
                id="password too long",
            ),
        ],
    )
    async def test_should_return_bad_request_when_data_is_invalid(
        self,
        test_app: TestApp,
        field: str,
        value: str,
    ):
        request = ResetPasswordRequest(
            email=FakeData.Email(), token="token", new_password=FakeData.Password()
        )
        setattr(request, field, value)

        response = await test_app.reset_password(request)

        TestApp.assert_valid_status(response, status.HTTP_400_BAD_REQUEST)
        TestApp.assert_validation_error(response, field)
