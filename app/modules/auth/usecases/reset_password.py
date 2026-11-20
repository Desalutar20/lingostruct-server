import asyncio
from dataclasses import dataclass

from app.modules.auth.services import AuthCache, SessionStore
from app.modules.auth.services.auth_cache import TokenType
from app.modules.shared.cqrs import ICommand, ICommandHandler
from app.modules.shared.domain import Email, FailureError, NonEmptyString
from app.modules.shared.services import PasswordHasher
from app.modules.user.data import UserRepository
from app.modules.user.domain import Password


@dataclass
class ResetPasswordCommand(ICommand):
    email: Email
    token: NonEmptyString
    new_password: Password


@dataclass
class ResetPasswordCommandHandler(ICommandHandler[ResetPasswordCommand, None]):
    user_repository: UserRepository
    auth_cache: AuthCache
    session_store: SessionStore

    async def handle(self, command: ResetPasswordCommand):
        user_id = await self.auth_cache.get_and_delete_user_id(
            TokenType.RESET_PASSWORD, command.token
        )
        if user_id is None:
            raise FailureError("Invalid or expired token")

        user = await self.user_repository.get_by_id(user_id)
        if user is None or not user.is_valid:
            raise FailureError("Invalid or expired token")

        hashed_password = PasswordHasher.hash(command.new_password)
        user.update_password(hashed_password)

        await asyncio.gather(
            self.user_repository.update(user),
            self.session_store.remove_all(user.id),
        )
