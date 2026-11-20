from abc import ABC
from contextlib import asynccontextmanager

import asyncpg


class BaseRepository(ABC):
    def __init__(self, pool, conn: asyncpg.Connection | None):
        self._pool = pool
        self._conn = conn

    @asynccontextmanager
    async def connection(self):
        if self._conn is not None:
            yield self._conn
        else:
            async with self._pool.acquire() as conn:
                yield conn
