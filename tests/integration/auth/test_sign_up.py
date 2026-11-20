import pytest
from fastapi import status
from pydantic import SecretStr

from app.modules.shared.domain import Email
from app.modules.user.domain import FirstName, LastName, Password
from tests.integration.fakedata import FakeData
from tests.integration.testapp import TestApp


class TestSignUp:
    @pytest.mark.anyio
    async def test_should_return_created_when_request_is_valid(
        self,
        test_app: TestApp,
    ):
        request = FakeData.sign_up_request()
        response = await test_app.sign_up(request)

        TestApp.assert_valid_status(response, status.HTTP_201_CREATED)

        user = await test_app.get_user_by_email(request.email)

        assert user is not None
        assert user["password_hash"] != request.password.get_secret_value()

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
            pytest.param("first_name", "", id="empty first name"),
            pytest.param("first_name", "   ", id="whitespace first name"),
            pytest.param(
                "first_name",
                "t" * (FirstName.MAX_LENGTH + 1),
                id="first name too long",
            ),
            pytest.param("last_name", "", id="empty last name"),
            pytest.param("last_name", "   ", id="whitespace last name"),
            pytest.param(
                "last_name",
                "t" * (LastName.MAX_LENGTH + 1),
                id="last name too long",
            ),
        ],
    )
    async def test_should_return_bad_request_when_data_is_invalid(
        self,
        test_app: TestApp,
        field: str,
        value: str,
    ):
        request = FakeData.sign_up_request()
        setattr(request, field, value)

        response = await test_app.sign_up(request)

        TestApp.assert_valid_status(response, status.HTTP_400_BAD_REQUEST)
        TestApp.assert_validation_error(response, field)
