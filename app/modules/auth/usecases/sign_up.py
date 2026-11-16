import asyncio
from dataclasses import dataclass

from app.core.config import ApplicationConfig
from app.modules.auth.services.auth_cache import AuthCache
from app.modules.shared.cqrs import ICommand, ICommandHandler
from app.modules.shared.data import UnitOfWork
from app.modules.shared.domain import Email, NonEmptyString
from app.modules.shared.outbox import Outbox, OutboxType
from app.modules.shared.services import PasswordHasher, RandomTokenGenerator
from app.modules.shared.services.email import (
    EmailMessageBuilder,
    EmailMessageConverter,
    EmailService,
)
from app.modules.user.domain import FirstName, LastName, Password, User


@dataclass
class SignUpCommand(ICommand):
    email: Email
    password: Password
    first_name: FirstName
    last_name: LastName


@dataclass
class SignUpCommandHandler(ICommandHandler[SignUpCommand, None]):
    email_service: EmailService
    uow: UnitOfWork
    auth_cache: AuthCache
    config: ApplicationConfig

    async def handle(self, command: SignUpCommand) -> None:
        async with self.uow as uow:
            user = await uow.users.get_by_email(command.email)
            if user:
                await asyncio.sleep(2)
                return

            password_hash = PasswordHasher.hash(command.password)
            new_user = User(
                command.email, password_hash, command.first_name, command.last_name
            )

            token = RandomTokenGenerator.generate()
            email_message = EmailMessageBuilder.build_account_verification_email(
                self.config, command.email, token
            )

            serialized = EmailMessageConverter.serialize(email_message)
            outbox = Outbox(OutboxType.EMAIL, NonEmptyString(serialized))

            uow.users.create(new_user)
            uow.outbox.create(outbox)

            await asyncio.gather(
                uow.commit(),
                self.auth_cache.store_user_id_by_verification_token(new_user.id, token),
            )
