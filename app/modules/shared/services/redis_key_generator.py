from uuid import UUID

from app.core.config import RedisConfig
from app.modules.shared.domain import NonEmptyString
from app.modules.user.domain import UserID


class RedisKeyGenerator:
    def __init__(self, config: RedisConfig) -> None:
        self._key_prefix = config.key_prefix

    @staticmethod
    def account_verification_prefix():
        return "account-verification:"

    @staticmethod
    def password_reset_prefix():
        return "password-reset:"

    @staticmethod
    def session_prefix():
        return "session:"

    @staticmethod
    def sessions_prefix():
        return "sessions:"

    def account_verification_key(self, token: NonEmptyString) -> str:
        return self._key_prefix + self.account_verification_prefix() + token.value

    def password_reset_key(self, token: NonEmptyString) -> str:
        return self._key_prefix + self.password_reset_prefix() + token.value

    def session_key(self, session_id: UUID) -> str:
        return self._key_prefix + self.session_prefix() + str(session_id)

    def sessions_key(self, user_id: UserID) -> str:
        return self._key_prefix + self.sessions_prefix() + str(user_id)
