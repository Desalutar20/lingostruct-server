from dataclasses import dataclass

from app.core.config import ApplicationConfig
from app.modules.auth.services import AuthCache
from app.modules.auth.services.auth_cache import TokenType
from app.modules.shared.cqrs import ICommand, ICommandHandler
from app.modules.shared.domain import Email, NonEmptyString
from app.modules.shared.outbox.outbox import Outbox
from app.modules.shared.outbox.outbox_repository import OutboxRepository
from app.modules.shared.outbox.outbox_type import OutboxType
from app.modules.shared.services import RandomTokenGenerator
from app.modules.shared.services.email import EmailMessageBuilder
from app.modules.user.data import UserRepository


@dataclass
class ProcessForgotPasswordCommand(ICommand):
    email: Email


@dataclass
class ProcessForgotPasswordCommandHandler(
    ICommandHandler[ProcessForgotPasswordCommand, None]
):
    user_repository: UserRepository
    outbox_repository: OutboxRepository
    auth_cache: AuthCache
    config: ApplicationConfig

    async def handle(self, command: ProcessForgotPasswordCommand):
        user = await self.user_repository.get_by_email(command.email)
        if user is None or not user.is_valid:
            return

        token = RandomTokenGenerator.generate()
        email = EmailMessageBuilder.build_reset_password_email(
            self.config, command.email, token
        )

        outbox = Outbox(OutboxType.EMAIL, NonEmptyString(email.serialize()))

        await self.outbox_repository.create(outbox)

        await self.auth_cache.store_user_id(TokenType.RESET_PASSWORD, user.id, token)
