import asyncpg

from app.modules.shared.outbox.outbox_type import OutboxType


async def get_user_by_email(self, email: str) -> asyncpg.Record | None:
    async with self.pool.acquire() as conn:
        return await conn.fetchrow(
            """
              SELECT
                  id,
                  created_at,
                  updated_at,
                  email,
                  password_hash,
                  password_salt,
                  first_name,
                  last_name,
                  role,
                  is_banned,
                  is_verified,
                  avatar_url,
                  github_id,
                  google_id
              FROM users
              WHERE email = $1;""",
            email,
        )


async def ban_user_by_email(self, email: str) -> None:
    async with self.pool.acquire() as conn:
        return await conn.execute(
            """UPDATE users SET is_banned = true WHERE email = $1;""", email
        )


async def get_outboxes_by_type(self, type: OutboxType) -> list[asyncpg.Record]:
    async with self.pool.acquire() as conn:
        return await conn.fetch(
            """
                                  SELECT
                                     id,
                                     created_at,
                                     updated_at,
                                     type,
                                     data,
                                     processed_at
                                  FROM outbox
                                  WHERE type = $1;
                                  """,
            type.value,
        )
