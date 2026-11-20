from dataclasses import dataclass
from datetime import timedelta
from uuid import UUID

from app.core.config import ApplicationConfig
from app.modules.auth.services import SessionStore
from app.modules.auth.types import Session
from app.modules.shared.cqrs import ICommand, ICommandHandler
from app.modules.shared.domain import Email, FailureError
from app.modules.shared.services import PasswordHasher
from app.modules.user.data import UserRepository
from app.modules.user.domain import Password
from app.modules.user.schemas.user_schema import UserSchema


@dataclass
class SignInCommand(ICommand):
    email: Email
    password: Password


@dataclass
class SignInCommandHandler(ICommandHandler[SignInCommand, tuple[UserSchema, UUID]]):
    user_repository: UserRepository
    session_store: SessionStore
    config: ApplicationConfig

    async def handle(self, command: SignInCommand) -> tuple[UserSchema, UUID]:
        user = await self.user_repository.get_by_email(command.email)
        if (
            user is None
            or not user.password_hash
            or not PasswordHasher.verify(user.password_hash, command.password)
            or not user.is_valid
        ):
            raise FailureError("Invalid credentials")

        sessions = await self.session_store.get_session_ids(user.id)
        if len(sessions) >= self.config.max_sessions:
            await self.session_store.remove(user.id, sessions[0])

        session = Session(
            user.id,
            user.email,
            user.first_name,
            user.last_name,
            user.role,
            user.avatar_url,
        )

        session_id = await self.session_store.save(
            session,
            timedelta(minutes=self.config.session_ttl_minutes),
        )

        return session.to_user_schema(), session_id
