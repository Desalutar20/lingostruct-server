from sqlalchemy.ext.asyncio import (
    async_sessionmaker,
    create_async_engine,
)

from app.core.config.database_config import DatabaseConfig


class Database:
    def __init__(self, config: DatabaseConfig):
        self.engine = create_async_engine(
            url=config.connection_string(),
        )

        self.session_factory = async_sessionmaker(
            bind=self.engine, autoflush=False, autocommit=False, expire_on_commit=False
        )

    async def dispose(self) -> None:
        await self.engine.dispose()
