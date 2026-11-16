import httpx


def assert_valid_status(
    response: httpx.Response,
    status_code: int,
) -> None:
    assert response.status_code == status_code, (
        f"expected status {status_code}, got {response.status_code}"
    )


def assert_validation_error(
    response: httpx.Response,
    field: str,
) -> None:
    data = response.json()

    errors = data.get("errors")

    assert errors is not None, "expected validation errors"
    assert field in errors, (
        f"expected validation error for field {field!r}, got {errors}"
    )
