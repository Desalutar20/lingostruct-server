import json

import pytest
from fastapi import status

from app.modules.auth.routes.forgot_password_router import ForgotPasswordRequest
from app.modules.shared.domain import Email
from app.modules.shared.outbox.outbox_type import OutboxType
from tests.integration.fakedata import FakeData
from tests.integration.testapp import TestApp


class TestForgotPassword:
    @pytest.mark.anyio
    async def test_should_return_ok_when_request_is_valid(self, test_app: TestApp):
        sign_up_request = FakeData.sign_up_request()
        await test_app.create_and_verify(sign_up_request)

        request = ForgotPasswordRequest(email=sign_up_request.email)
        response = await test_app.forgot_password(request)

        TestApp.assert_valid_status(response, status.HTTP_200_OK)

        outboxes = await test_app.get_outboxes_by_type(OutboxType.FORGOT_PASSWORD)

        assert len(outboxes) == 1
        data = json.loads(outboxes[0]["data"])
        assert data["email"] == sign_up_request.email

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
        ],
    )
    async def test_should_return_bad_request_when_data_is_invalid(
        self,
        test_app: TestApp,
        field: str,
        value: str,
    ):
        request = ForgotPasswordRequest(email=FakeData.Email())
        setattr(request, field, value)

        response = await test_app.forgot_password(request)

        TestApp.assert_valid_status(response, status.HTTP_400_BAD_REQUEST)
        TestApp.assert_validation_error(response, field)
