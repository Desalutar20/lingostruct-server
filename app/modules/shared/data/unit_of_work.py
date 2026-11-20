from types import TracebackType
from typing import Self

from asyncpg.transaction import TransactionState

from app.modules.shared.outbox.outbox_repository import OutboxRepository
from app.modules.user.data import UserRepository


class UnitOfWork:
    def __init__(self, pool):
        self._pool = pool

    async def __aenter__(self) -> Self:
        self._con = await self._pool.acquire()
        self._tr = self._con.transaction()
        await self._tr.start()

        self.users = UserRepository(self._pool, self._con)
        self.outbox = OutboxRepository(self._pool, self._con)

        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        _exc_val: BaseException | None,
        _exc_tb: TracebackType | None,
    ) -> None:

        try:
            if self._tr._state == TransactionState.STARTED:
                print("ROLLBACK TRANSACTION")

                await self._tr.rollback()
        finally:
            await self._pool.release(self._con)

    async def commit(self) -> None:
        await self._tr.commit()

    async def rollback(self) -> None:
        await self._tr.rollback()
