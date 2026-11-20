from typing import ClassVar

from faker import Faker
from pydantic import SecretStr

from app.modules.auth.routes.sign_up_router import SignUpRequest
from app.modules.user.domain import FirstName, LastName, Password


class FakeData:
    fake: ClassVar[Faker] = Faker()

    @staticmethod
    def sign_up_request() -> SignUpRequest:
        return SignUpRequest(
            email=FakeData.Email(),
            password=FakeData.Password(),
            first_name=FakeData.String(max_length=FirstName.MAX_LENGTH),
            last_name=FakeData.String(max_length=LastName.MAX_LENGTH),
        )

    @staticmethod
    def Email():
        return FakeData.fake.email()

    @staticmethod
    def Password(length: int = Password.MIN_LENGTH):
        return SecretStr(FakeData.fake.password(length))

    @staticmethod
    def String(*, min_length: int | None = None, max_length: int = 30):
        return FakeData.fake.pystr(min_chars=min_length, max_chars=max_length)
