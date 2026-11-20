import pytest
from fastapi import status
from pydantic import SecretStr

from app.modules.auth.routes.sign_in_router import SignInRequest
from app.modules.shared.domain import Email
from app.modules.user.domain import Password
from tests.integration.fakedata import FakeData
from tests.integration.testapp import TestApp


class TestSignIn:
    @pytest.mark.anyio
    async def test_should_return_ok_when_request_is_valid(self, test_app: TestApp):
        sign_up_request = FakeData.sign_up_request()
        await test_app.create_and_verify(sign_up_request)

        request = SignInRequest(
            email=sign_up_request.email, password=sign_up_request.password
        )

        sign_in_response = await test_app.sign_in(request)
        TestApp.assert_valid_status(sign_in_response, status.HTTP_200_OK)

        session_cookie = sign_in_response.cookies.get(
            test_app.config.application.session_cookie_name
        )
        assert session_cookie is not None

    @pytest.mark.anyio
    async def test_should_return_ok_when_user_does_not_exist(self, test_app: TestApp):
        request = SignInRequest(email=FakeData.Email(), password=FakeData.Password())

        sign_in_response = await test_app.sign_in(request)
        TestApp.assert_valid_status(sign_in_response, status.HTTP_400_BAD_REQUEST)

    @pytest.mark.anyio
    async def test_should_return_ok_when_user_is_not_verified(self, test_app: TestApp):
        sign_up_request = FakeData.sign_up_request()

        sign_up_response = await test_app.sign_up(sign_up_request)
        TestApp.assert_valid_status(sign_up_response, status.HTTP_201_CREATED)

        request = SignInRequest(
            email=sign_up_request.email, password=sign_up_request.password
        )

        sign_in_response = await test_app.sign_in(request)
        TestApp.assert_valid_status(sign_in_response, status.HTTP_400_BAD_REQUEST)

    @pytest.mark.anyio
    async def test_should_return_ok_when_user_is_banned(self, test_app: TestApp):
        sign_up_request = FakeData.sign_up_request()

        sign_up_response = await test_app.sign_up(sign_up_request)
        TestApp.assert_valid_status(sign_up_response, status.HTTP_201_CREATED)

        await test_app.ban_user_by_email(sign_up_request.email)

        request = SignInRequest(
            email=sign_up_request.email, password=sign_up_request.password
        )

        sign_in_response = await test_app.sign_in(request)
        TestApp.assert_valid_status(sign_in_response, status.HTTP_400_BAD_REQUEST)

    @pytest.mark.anyio
    @pytest.mark.parametrize(
        ("field", "value"),
        [
            pytest.param("email", "", id="empty email"),
            pytest.param("email", "   ", id="whitespace email"),
            pytest.param("email", "invalid", id="invalid email"),
            pytest.param(
                "email",
                f"{'t' * Email.MAX_LENGTH}@gmail.com",
                id="email exceeds maximum length",
            ),
            pytest.param("password", SecretStr(""), id="empty password"),
            pytest.param("password", SecretStr("   "), id="whitespace password"),
            pytest.param(
                "password",
                SecretStr("t" * (Password.MIN_LENGTH - 1)),
                id="password too short",
            ),
            pytest.param(
                "password",
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
        request = SignInRequest(email=FakeData.Email(), password=FakeData.Password())
        setattr(request, field, value)

        response = await test_app.sign_in(request)

        TestApp.assert_valid_status(response, status.HTTP_400_BAD_REQUEST)
        TestApp.assert_validation_error(response, field)
