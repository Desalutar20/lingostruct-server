from enum import IntEnum
from uuid import UUID

from redis.asyncio import Redis

from app.core.config import ApplicationConfig
from app.modules.shared.domain import InternalError, NonEmptyString
from app.modules.shared.services import RedisKeyGenerator
from app.modules.user.domain import UserID


class TokenType(IntEnum):
    ACCOUNT_VERIFICATION = 0
    RESET_PASSWORD = 1


class AuthCache:
    def __init__(
        self,
        redis: Redis,
        app_config: ApplicationConfig,
        key_generator: RedisKeyGenerator,
    ) -> None:
        self._redis = redis
        self._app_config = app_config
        self._key_generator = key_generator

    async def store_user_id_by_verification_token(
        self,
        user_id: UserID,
        token: NonEmptyString,
    ) -> None:
        await self._store_user_id(TokenType.ACCOUNT_VERIFICATION, user_id, token)

    async def store_user_id_by_reset_password_token(
        self,
        user_id: UserID,
        token: NonEmptyString,
    ) -> None:
        await self._store_user_id(TokenType.RESET_PASSWORD, user_id, token)

    async def get_and_delete_user_id_by_verification_token(
        self,
        token: NonEmptyString,
    ) -> UserID | None:
        return await self._get_user_id(TokenType.ACCOUNT_VERIFICATION, token)

    async def get_and_delete_user_id_by_reset_password_token(
        self,
        token: NonEmptyString,
    ) -> UserID | None:
        return await self._get_user_id(TokenType.RESET_PASSWORD, token)

    async def _store_user_id(
        self,
        token_type: TokenType,
        user_id: UserID,
        token: NonEmptyString,
    ) -> None:
        key = self._get_key(token_type, token)

        await self._redis.set(
            key,
            str(user_id),
            ex=self._app_config.reset_password_ttl_minutes * 60,
        )

    async def _get_user_id(
        self,
        token_type: TokenType,
        token: NonEmptyString,
    ) -> UserID | None:
        key = self._get_key(token_type, token)

        value = await self._redis.getdel(key)

        if value is None:
            return None

        try:
            parsed = UUID(str(value))
        except ValueError as exc:
            raise InternalError("Invalid user id stored in Redis") from exc

        return UserID(parsed)

    def _get_key(self, token_type: TokenType, token: NonEmptyString) -> str:
        match token_type:
            case TokenType.ACCOUNT_VERIFICATION:
                return self._key_generator.account_verification_key(token)
            case TokenType.RESET_PASSWORD:
                return self._key_generator.password_reset_key(token)
