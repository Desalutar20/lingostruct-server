from .domain_error import DomainError
from .error_code import ErrorCode


class ValidationError(DomainError):
    def __init__(self, field: str, errors: list[str]):
        super().__init__("Validation error", ErrorCode.VALIDATION)
        self.errors = (field, errors)
