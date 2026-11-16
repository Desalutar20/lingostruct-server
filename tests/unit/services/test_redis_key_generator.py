from uuid import uuid4

import pytest

from app.core.config import RedisConfig
from app.modules.shared.domain import NonEmptyString
from app.modules.shared.services import RedisKeyGenerator
from app.modules.user.domain import UserID


class TestRedisKeyGenerator:
    @pytest.fixture
    def config(self) -> RedisConfig:
        return RedisConfig(
            host="localhost",
            port=6379,
            password="password",
            database=0,
            key_prefix="lingostruct:",
        )

    @pytest.fixture
    def generator(self, config: RedisConfig) -> RedisKeyGenerator:
        return RedisKeyGenerator(config)

    def test_should_return_account_verification_prefix(self):
        assert RedisKeyGenerator.account_verification_prefix() == (
            "account-verification:"
        )

    def test_should_return_password_reset_prefix(self):
        assert RedisKeyGenerator.password_reset_prefix() == "password-reset:"

    def test_should_return_session_prefix(self):
        assert RedisKeyGenerator.session_prefix() == "session:"

    def test_should_return_sessions_prefix(self):
        assert RedisKeyGenerator.sessions_prefix() == "sessions:"

    def test_should_generate_account_verification_key(
        self,
        generator: RedisKeyGenerator,
    ):
        token = NonEmptyString("verification-token")

        key = generator.account_verification_key(token)

        assert key == "lingostruct:account-verification:verification-token"

    def test_should_generate_password_reset_key(
        self,
        generator: RedisKeyGenerator,
    ):
        token = NonEmptyString("reset-token")

        key = generator.password_reset_key(token)

        assert key == "lingostruct:password-reset:reset-token"

    def test_should_generate_session_key(
        self,
        generator: RedisKeyGenerator,
    ):
        session_id = uuid4()

        key = generator.session_key(session_id)

        assert key == f"lingostruct:session:{session_id}"

    def test_should_generate_sessions_key(
        self,
        generator: RedisKeyGenerator,
    ):
        user_id = UserID(uuid4())

        key = generator.sessions_key(user_id)

        assert key == f"lingostruct:sessions:{user_id}"

    def test_should_use_configured_key_prefix(self):
        config = RedisConfig(
            host="localhost",
            port=6379,
            password="password",
            database=0,
            key_prefix="test:",
        )
        generator = RedisKeyGenerator(config)

        key = generator.session_key(uuid4())

        assert key.startswith("test:session:")
