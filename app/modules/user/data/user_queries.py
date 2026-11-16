from datetime import UTC, datetime

from sqlalchemy import ColumnElement, delete, select
from sqlalchemy import update as ud
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.shared.domain import Email
from app.modules.user.data import User
from app.modules.user.domain import User as DomainUser
from app.modules.user.domain import UserID


async def get_user_by_id(session: AsyncSession, id: UserID) -> DomainUser | None:
    user = await _get(session, User.id == id)

    return None if user is None else user.to_domain()


async def get_user_by_email(session: AsyncSession, email: Email) -> DomainUser | None:
    user = await _get(session, User.email == email.value)
    return None if user is None else user.to_domain()


def create_user(session: AsyncSession, user: DomainUser) -> None:
    model = User.from_domain(user)

    session.add(model)


async def update_user(session: AsyncSession, user: DomainUser):
    model = User.from_domain(user)
    model.updated_at = datetime.now(UTC)

    statement = ud(User).where(User.id == user.id).values(model.to_dict())

    await session.execute(statement)


async def remove_user(session: AsyncSession, user: DomainUser):
    statement = delete(User).where(User.id == user.id)

    await session.execute(statement)


async def _get(session: AsyncSession, clause: ColumnElement[bool]) -> User | None:
    statement = select(User).where(clause)
    user = await session.scalar(statement)

    return user
