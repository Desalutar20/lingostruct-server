from abc import ABC
from typing import Protocol


class ICommand(ABC):
    pass


class ICommandHandler[TCommand: ICommand, TResponse](Protocol):
    async def handle(
        self,
        command: TCommand,
    ) -> TResponse: ...
