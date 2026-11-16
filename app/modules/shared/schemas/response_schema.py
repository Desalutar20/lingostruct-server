from pydantic.main import BaseModel

from app.modules.shared.domain.exceptions.error_code import ErrorCode


class SuccessResponse[T](BaseModel):
    data: T


class ErrorResponse(BaseModel):
    error: str
    code: ErrorCode
    errors: dict[str, list[str]] | None = None
