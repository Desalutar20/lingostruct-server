import uvicorn

from app.core.config import Config
from app.core.logger import configure_logging
from app.setup import build_app

config = Config()
configure_logging(config.logger)
app = build_app(config)


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=config.application.host,
        port=config.application.port,
        reload=True,
    )
