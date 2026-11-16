import logging
import time

from app.core.config.logger_config import LoggerConfig

from .json_formatter import JsonFormatter

__LOG_LEVELS = {
    "trace": 5,
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warn": logging.WARNING,
    "error": logging.ERROR,
    "fatal": logging.CRITICAL,
}


def configure_logging(config: LoggerConfig) -> None:
    logging.addLevelName(5, "TRACE")

    handler = logging.StreamHandler()

    if config.structured:
        formatter = JsonFormatter(
            add_source=config.add_source,
        )
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        formatter.converter = time.gmtime

    handler.setFormatter(formatter)

    logging.basicConfig(
        level=__LOG_LEVELS[config.level],
        handlers=[handler],
        force=True,
    )


LOGGER = logging.getLogger()
