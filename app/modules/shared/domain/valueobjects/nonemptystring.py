from collections.abc import Callable

from app.modules.shared.domain import ValidationError


class NonEmptyString:
    __slots__ = ("__value",)

    def __init__(
        self,
        value: str,
        *,
        field: str = "field",
        label: str = "Value",
        min_length: int | None = 1,
        max_length: int | None = None,
        additional_check: Callable[[str], None] | None = None,
        pass_validation: bool = False,
    ):
        if pass_validation:
            self.__value = value
            return

        if min_length is not None and min_length < 1:
            raise ValidationError(field, ["min_length must be at least 1"])

        if max_length is not None and max_length < 1:
            raise ValidationError(field, ["max_length must be at least 1"])

        if not value or value.isspace():
            raise ValidationError(field, [f"{label} cannot be empty"])

        value = value.strip()

        if max_length is not None and len(value) > max_length:
            raise ValidationError(field, [f"{label} is too long"])

        if min_length is not None and len(value) < min_length:
            raise ValidationError(field, [f"{label} is too short"])

        if additional_check is not None:
            additional_check(value)

        self.__value = value

    @property
    def value(self):
        return self.__value

    def __setattr__(self, name: str, value: object) -> None:
        if hasattr(self, name):
            raise AttributeError(f"{name} is immutable")

        object.__setattr__(self, name, value)

    def __delattr__(self, name: str) -> None:
        raise AttributeError(f"{name} is immutable")

    def __str__(self) -> str:
        return self.__value

    def __eq__(self, other: object) -> bool:
        if type(self) is not type(other):
            return False

        return self.__value == other.__value

    def __ne__(self, other: object) -> bool:
        return not (self == other)

    def __hash__(self) -> int:
        return hash((type(self), self.__value))
