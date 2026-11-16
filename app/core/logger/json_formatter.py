import json
import logging
from datetime import UTC, datetime


class JsonFormatter(logging.Formatter):
    def __init__(self, add_source: bool = False) -> None:
        super().__init__()
        self.add_source = add_source

    def format(self, record: logging.LogRecord) -> str:
        log = {
            "timestamp": datetime.fromtimestamp(
                record.created,
                tz=UTC,
            ).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if self.add_source:
            log["source"] = {
                "file": record.pathname,
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
            }

        if record.exc_info:
            log["exception"] = self.formatException(record.exc_info)

        if record.stack_info:
            log["stack_info"] = self.formatStack(record.stack_info)

        return json.dumps(log, ensure_ascii=False)
