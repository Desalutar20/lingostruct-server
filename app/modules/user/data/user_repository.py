from datetime import UTC, datetime

from sqlalchemy import ColumnElement, delete, select
from sqlalchemy import update as ud
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.shared.domain import Email
from app.modules.user.data import User
from app.modules.user.domain import User as DomainUser
from app.modules.user.domain import UserID


class UserRepository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, id: UserID) -> DomainUser | None:
        user = await self.__get(User.id == id)

        return None if user is None else user.to_domain()

    async def get_by_email(self, email: Email) -> DomainUser | None:

        user = await self.__get(User.email == email.value)
        return None if user is None else user.to_domain()

    def create(self, user: DomainUser) -> None:
        model = User.from_domain(user)

        self._session.add(model)

    async def update(self, user: DomainUser):
        model = User.from_domain(user)
        model.updated_at = datetime.now(UTC)

        statement = ud(User).where(User.id == user.id).values(model.to_dict())

        await self._session.execute(statement)

    async def remove(self, user: DomainUser):
        statement = delete(User).where(User.id == user.id)

        await self._session.execute(statement)

    async def __get(self, clause: ColumnElement[bool]) -> User | None:
        statement = select(User).where(clause)
        user = await self._session.scalar(statement)

        return user
