from enum import IntEnum
from uuid import uuid4

from app.modules.shared.services import RedisKeyGenerator


class RedisTokenType(IntEnum):
    ACCOUNT_VERIFICATION = 0
    RESET_PASSWORD = 1


_prefixes = {
    RedisTokenType.ACCOUNT_VERIFICATION: RedisKeyGenerator.account_verification_prefix(),
    RedisTokenType.RESET_PASSWORD: RedisKeyGenerator.password_reset_prefix(),
}


async def set_redis_value(self, type: RedisTokenType, value: str) -> str:
    prefix = _prefixes[type]

    token = str(uuid4())
    key = f"{self.config.redis.key_prefix}{prefix}{token}"
    await self.redis.set(key, value)

    return token


async def get_redis_token(self, type: RedisTokenType) -> str | None:
    prefix = _prefixes[type]

    pattern = f"{self.config.redis.key_prefix}{prefix}*"
    keys = await self.redis.keys(pattern)

    if not keys:
        return None

    return str(keys[-1]).removeprefix(pattern[:-1])
