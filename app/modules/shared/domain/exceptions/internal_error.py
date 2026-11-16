from .domain_error import DomainError
from .error_code import ErrorCode


class InternalError(DomainError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCode.INTERNAL)
