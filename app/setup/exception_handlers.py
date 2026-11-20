from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError as VE

from app.core.logger import LOGGER
from app.modules.shared.domain import DomainError, ErrorCode, ValidationError
from app.modules.shared.schemas import ErrorResponse


def add_exception_handlers(app: FastAPI):
    custom_messages = {
        "string_too_short": "{field} should have at least {min_length} characters",
    }

    status_codes_by_code = {
        ErrorCode.FAILURE: HTTPStatus.BAD_REQUEST,
        ErrorCode.VALIDATION: HTTPStatus.BAD_REQUEST,
        ErrorCode.UNAUTHORIZED: HTTPStatus.UNAUTHORIZED,
        ErrorCode.ACCESS_DENIED: HTTPStatus.FORBIDDEN,
        ErrorCode.INTERNAL: HTTPStatus.INTERNAL_SERVER_ERROR,
    }

    def set_validation_errors(
        errors: dict[str, list[str]], ex: VE | RequestValidationError
    ):
        for error in ex.errors():
            field = str(error["loc"][-1])
            error_type = error["type"]
            ctx = error.get("ctx", {})

            message = custom_messages.get(error_type, error["msg"])

            message = message.format(
                field=field.replace("_", " ").capitalize(),
                **ctx,
            )

            errors.setdefault(field, []).append(message)

    @app.exception_handler(RequestValidationError)
    def handle_pydantic_validation_error(_request: Request, ex: RequestValidationError):
        errors: dict[str, list[str]] = {}
        set_validation_errors(errors, ex)

        response = ErrorResponse(
            error="Validation error",
            code=ErrorCode.VALIDATION,
            errors=errors,
        )

        return JSONResponse(
            status_code=HTTPStatus.BAD_REQUEST,
            content=response.model_dump(mode="json"),
        )

    @app.exception_handler(Exception)
    def handle_error(_request: Request, ex: Exception):

        if isinstance(ex, (ValidationError, RequestValidationError, VE)):
            errors = {}
            response = ErrorResponse(
                error="Validation error",
                code=ErrorCode.VALIDATION,
            )

            if isinstance(ex, ValidationError):
                errors[ex.errors[0]] = ex.errors[1]
            else:
                set_validation_errors(errors, ex)

            response.errors = errors

            return JSONResponse(
                status_code=HTTPStatus.BAD_REQUEST,
                content=response.model_dump(mode="json"),
            )

        status_code = HTTPStatus.INTERNAL_SERVER_ERROR
        code = ErrorCode.INTERNAL
        error = "Something went wrong"
        log_message = ""

        if isinstance(ex, DomainError):
            if ex.code == ErrorCode.INTERNAL:
                log_message = f"Internal server error: {ex.message}"
            else:
                status_code = status_codes_by_code[ex.code]
                code = ex.code
                error = ex.message
        else:
            log_message = f"Unhandled error occurred {ex!r}"

        if status_code == HTTPStatus.INTERNAL_SERVER_ERROR:
            LOGGER.error(log_message)

        response = ErrorResponse(error=error, code=code)
        return JSONResponse(
            status_code=status_code,
            content=response.model_dump(mode="json"),
        )
