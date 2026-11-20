import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from redis.asyncio import Redis

from app.core.config import Config
from app.modules.auth.types import Session
from app.modules.shared.services import RedisKeyGenerator
from app.modules.user.domain import UserID


@dataclass
class SessionStore:
    redis: Redis
    redis_key_generator: RedisKeyGenerator
    config: Config

    async def save(self, session: Session, ttl: timedelta) -> UUID:
        session_id = uuid4()

        sessions_key = self.redis_key_generator.sessions_key(session.user_id)
        session_key = self.redis_key_generator.session_key(session_id)

        score = (datetime.now(UTC) + ttl).timestamp() * 1000
        serialized = session.serialize()

        await asyncio.gather(
            self.redis.set(session_key, serialized, ex=ttl),
            self.redis.zadd(
                sessions_key,
                {str(session_id): score},
            ),
        )

        return session_id

    async def get(self, session_id: UUID) -> Session | None:
        session_key = self.redis_key_generator.session_key(session_id)

        value = await self.redis.get(session_key)
        if value is None:
            return None

        return Session.deserialize(str(value))

    async def get_session_ids(self, user_id: UserID) -> list[UUID]:
        sessions_key = self.redis_key_generator.sessions_key(user_id)

        now = datetime.now(UTC).timestamp() * 1000

        values = await self.redis.zrangebyscore(sessions_key, now, "+inf")

        return [UUID(str(id)) for id in values]

    async def remove(self, user_id: UserID, session_id: UUID):
        sessions_key = self.redis_key_generator.sessions_key(user_id)
        session_key = self.redis_key_generator.session_key(session_id)

        await asyncio.gather(
            self.redis.delete(session_key),
            self.redis.zrem(sessions_key, str(session_id)),
        )

    async def remove_all(self, user_id: UserID):
        session_ids = await self.get_session_ids(user_id)

        await asyncio.gather(
            *(
                self.redis.delete(self.redis_key_generator.session_key(session_id))
                for session_id in session_ids
            )
        )
        await self.redis.delete(self.redis_key_generator.sessions_key(user_id))

    async def remove_expired(self) -> None:
        now = datetime.now(UTC).timestamp() * 1000

        async for key in self.redis.scan_iter(
            match=self.redis_key_generator.sessions_pattern(),
            count=100,
        ):
            expired_sessions = await self.redis.zrangebyscore(
                key,
                "-inf",
                now,
            )

            if not expired_sessions:
                continue

            session_ids = [UUID(str(session_id)) for session_id in expired_sessions]

            session_keys = [
                self.redis_key_generator.session_key(session_id)
                for session_id in session_ids
            ]

            async with self.redis.pipeline(transaction=True) as pipe:
                pipe.delete(*session_keys)
                pipe.zrem(
                    key,
                    *(str(session_id) for session_id in expired_sessions),
                )
                await pipe.execute()

            if await self.redis.zcard(key) == 0:
                await self.redis.delete(key)
