from dataclasses import dataclass
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


@dataclass
class AuthCache:
    redis: Redis
    app_config: ApplicationConfig
    key_generator: RedisKeyGenerator

    async def store_user_id(
        self,
        type: TokenType,
        user_id: UserID,
        token: NonEmptyString,
    ) -> None:
        await self.__store(type, user_id, token)

    async def get_and_delete_user_id(
        self,
        type: TokenType,
        token: NonEmptyString,
    ) -> UserID | None:
        return await self.__get(type, token)

    async def __store(
        self,
        token_type: TokenType,
        user_id: UserID,
        token: NonEmptyString,
    ) -> None:
        key = self._get_key(token_type, token)

        await self.redis.set(
            key,
            str(user_id),
            ex=self.app_config.reset_password_ttl_minutes * 60,
        )

    async def __get(
        self,
        token_type: TokenType,
        token: NonEmptyString,
    ) -> UserID | None:
        key = self._get_key(token_type, token)

        value = await self.redis.getdel(key)

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
                return self.key_generator.account_verification_key(token)
            case TokenType.RESET_PASSWORD:
                return self.key_generator.password_reset_key(token)
