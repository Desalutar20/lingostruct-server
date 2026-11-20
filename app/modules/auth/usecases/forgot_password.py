import json
from dataclasses import dataclass

from app.modules.shared.cqrs import ICommand, ICommandHandler
from app.modules.shared.domain import Email, NonEmptyString
from app.modules.shared.outbox.outbox import Outbox
from app.modules.shared.outbox.outbox_repository import OutboxRepository
from app.modules.shared.outbox.outbox_type import OutboxType


@dataclass
class ForgotPasswordCommand(ICommand):
    email: Email


@dataclass
class ForgotPasswordCommandHandler(ICommandHandler[ForgotPasswordCommand, None]):
    outbox_repository: OutboxRepository

    async def handle(self, command: ForgotPasswordCommand):

        data = NonEmptyString(json.dumps({"email": command.email.value}))

        outbox = Outbox(OutboxType.FORGOT_PASSWORD, data)

        await self.outbox_repository.create(outbox)
