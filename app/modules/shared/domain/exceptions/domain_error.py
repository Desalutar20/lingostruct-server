from abc import ABC

from .error_code import ErrorCode


class DomainError(Exception, ABC):
    def __init__(self, message: str, code: ErrorCode):
        self.message = message
        self.code = code
        super().__init__(message)
