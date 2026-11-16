from sqlalchemy import select

from app.modules.user.data import User


async def get_user_by_email(self, email: str) -> User | None:
    async with self.database.session_factory() as session:
        return await session.scalar(select(User).where(User.email == email))
