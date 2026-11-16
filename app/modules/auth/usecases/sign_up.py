import asyncio
from dataclasses import dataclass

from app.core.config import ApplicationConfig
from app.core.database import Database
from app.modules.auth.services.auth_cache import AuthCache
from app.modules.shared.cqrs import ICommand, ICommandHandler
from app.modules.shared.data import UnitOfWork
from app.modules.shared.domain import Email, NonEmptyString
from app.modules.shared.outbox import Outbox, OutboxType, create_outbox
from app.modules.shared.services import PasswordHasher, RandomTokenGenerator
from app.modules.shared.services.email import (
    EmailMessageBuilder,
    EmailMessageConverter,
)
from app.modules.user.data import get_user_by_email, create_user
from app.modules.user.domain import FirstName, LastName, Password, User


@dataclass
class SignUpCommand(ICommand):
    email: Email
    password: Password
    first_name: FirstName
    last_name: LastName


@dataclass
class SignUpCommandHandler(ICommandHandler[SignUpCommand, None]):
    database: Database
    auth_cache: AuthCache
    config: ApplicationConfig

    async def handle(self, command: SignUpCommand) -> None:
        async with UnitOfWork(self.database.session_factory) as uow:
            user = await get_user_by_email(uow.session, command.email)
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

            create_user(uow.session,new_user)
            create_outbox(uow.session, outbox)

            await asyncio.gather(
                uow.commit(),
                self.auth_cache.store_user_id_by_verification_token(new_user.id, token),
            )
