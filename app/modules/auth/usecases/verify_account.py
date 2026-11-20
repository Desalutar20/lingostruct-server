from dataclasses import dataclass

from app.modules.auth.services import AuthCache
from app.modules.auth.services.auth_cache import TokenType
from app.modules.shared.cqrs import ICommand, ICommandHandler
from app.modules.shared.domain import Email, FailureError, NonEmptyString
from app.modules.user.data import UserRepository


@dataclass
class VerifyAccountCommand(ICommand):
    email: Email
    token: NonEmptyString


@dataclass
class VerifyAccountCommandHandler(ICommandHandler[VerifyAccountCommand, None]):
    user_repository: UserRepository
    auth_cache: AuthCache

    async def handle(self, command: VerifyAccountCommand):
        user_id = await self.auth_cache.get_and_delete_user_id(
            TokenType.ACCOUNT_VERIFICATION, command.token
        )
        if not user_id:
            raise FailureError("Invalid or expired token")

        user = await self.user_repository.get_by_id(user_id)
        if user is None or user.email != command.email:
            raise FailureError("Invalid or expired token")

        user.verify()
        await self.user_repository.update(user)
