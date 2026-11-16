from typing import ClassVar

from faker import Faker

from app.modules.auth.routes.sign_up_router import SignUpRequest
from app.modules.user.domain import FirstName, LastName, Password


class FakeData:
    fake: ClassVar[Faker] = Faker()

    @staticmethod
    def sign_up_request() -> SignUpRequest:
        return SignUpRequest(
            email=FakeData.fake.email(),
            password=FakeData.fake.password(length=Password.MIN_LENGTH),
            first_name=FakeData.fake.pystr(max_chars=FirstName.MAX_LENGTH),
            last_name=FakeData.fake.pystr(max_chars=LastName.MAX_LENGTH),
        )
