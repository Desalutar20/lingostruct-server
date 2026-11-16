from typing import Protocol


class IQueryHandler[TQuery, TResponse](Protocol):
    async def handle(
        self,
        query: TQuery,
    ) -> TResponse: ...
