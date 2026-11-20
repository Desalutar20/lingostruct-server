import asyncio
from dataclasses import dataclass
from typing import Any

from app.core.config import ApplicationConfig
from app.modules.auth.services import AuthCache
from app.modules.auth.services.auth_cache import TokenType
from app.modules.shared.cqrs import ICommand, ICommandHandler
from app.modules.shared.data.unit_of_work import UnitOfWork
from app.modules.shared.domain import Email, NonEmptyString
from app.modules.shared.outbox.outbox import Outbox
from app.modules.shared.outbox.outbox_type import OutboxType
from app.modules.shared.services import PasswordHasher, RandomTokenGenerator
from app.modules.shared.services.email import (
    EmailMessageBuilder,
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
    pool: Any
    auth_cache: AuthCache
    config: ApplicationConfig

    async def handle(self, command: SignUpCommand) -> None:
        async with UnitOfWork(self.pool) as uow:
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

            outbox = Outbox(OutboxType.EMAIL, NonEmptyString(email_message.serialize()))

            await uow.users.create(new_user)
            await uow.outbox.create(outbox)

            await asyncio.gather(
                uow.commit(),
                self.auth_cache.store_user_id(
                    TokenType.ACCOUNT_VERIFICATION, new_user.id, token
                ),
            )
