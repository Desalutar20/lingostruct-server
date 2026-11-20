from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import ClassVar

import asyncpg

from app.modules.shared.data.base_repository import BaseRepository
from app.modules.shared.domain import Email, Url
from app.modules.user.domain import (
    FirstName,
    LastName,
    PasswordHash,
    ProviderID,
    User,
    UserID,
    UserRole,
)


class UserRepository(BaseRepository):
    __BASE_SELECT: ClassVar[str] = """
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
                  google_id,
                  github_id
              FROM users"""

    def __init__(self, pool, conn: asyncpg.Connection | None = None):
        super().__init__(pool, conn)

    async def get_by_id(self, id: UserID) -> User | None:
        async with self.connection() as conn:
            record = await conn.fetchrow(
                f"{self.__BASE_SELECT} WHERE id = $1",
                id,
            )

            return UserRepository.__to_domain(record)

    async def get_by_email(self, email: Email) -> User | None:
        async with self.connection() as conn:
            record = await conn.fetchrow(
                f"{self.__BASE_SELECT} WHERE email = $1",
                email.value,
            )

            return UserRepository.__to_domain(record)

    async def create(self, user: User) -> None:
        async with self.connection() as conn:
            await conn.execute(
                """
                            INSERT INTO users (
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
                                google_id,
                                github_id
                              )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
                               """,
                user.id,
                user.created_at,
                user.updated_at,
                user.email.value,
                None if user.password_hash is None else user.password_hash.value,
                None if user.password_hash is None else user.password_hash.salt,
                None if user.first_name is None else user.first_name.value,
                None if user.last_name is None else user.last_name.value,
                user.role.value,
                user.is_banned,
                user.is_verified,
                None if user.avatar_url is None else user.avatar_url.value,
                None if user.google_id is None else user.google_id.value,
                None if user.github_id is None else user.github_id.value,
            )

    async def update(self, user: User) -> None:
        async with self.connection() as conn:
            await conn.execute(
                """
                            UPDATE users SET
                                updated_at = $1,
                                email = $2,
                                password_hash = $3,
                                password_salt = $4,
                                first_name = $5,
                                last_name = $6,
                                role = $7,
                                is_banned = $8,
                                is_verified = $9,
                                avatar_url = $10,
                                google_id = $11,
                                github_id = $12
                              WHERE id = $13
                               """,
                datetime.now(UTC),
                user.email.value,
                None if user.password_hash is None else user.password_hash.value,
                None if user.password_hash is None else user.password_hash.salt,
                None if user.first_name is None else user.first_name.value,
                None if user.last_name is None else user.last_name.value,
                user.role.value,
                user.is_banned,
                user.is_verified,
                None if user.avatar_url is None else user.avatar_url.value,
                None if user.google_id is None else user.google_id.value,
                None if user.github_id is None else user.github_id.value,
                user.id,
            )

    async def remove(self, user: User) -> None:
        async with self.connection() as conn:
            await conn.execute("DELETE FROM users WHERE id = $1", user.id)

    @staticmethod
    def __to_domain(record: asyncpg.Record | None) -> User | None:
        if record is None:
            return None

        return User.from_persistence(
            id=UserID(record["id"]),
            created_at=record["created_at"],
            updated_at=record["updated_at"],
            email=Email(record["email"]),
            password_hash=(
                None
                if record["password_hash"] is None or record["password_salt"] is None
                else PasswordHash(record["password_hash"], record["password_salt"])
            ),
            first_name=(
                None
                if record["first_name"] is None
                else FirstName(record["first_name"])
            ),
            last_name=(
                None if record["last_name"] is None else LastName(record["last_name"])
            ),
            role=UserRole(record["role"]),
            is_banned=record["is_banned"],
            is_verified=record["is_verified"],
            avatar_url=None
            if record["avatar_url"] is None
            else Url(record["avatar_url"]),
            google_id=(
                None if record["google_id"] is None else ProviderID(record["google_id"])
            ),
            github_id=(
                None if record["github_id"] is None else ProviderID(record["github_id"])
            ),
        )

    @asynccontextmanager
    async def connection(self):
        if self._conn is not None:
            yield self._conn
        else:
            async with self._pool.acquire() as conn:
                yield conn
