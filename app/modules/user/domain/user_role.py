from typing import ClassVar

from app.modules.shared.domain import NonEmptyString, ValidationError


class UserRole(NonEmptyString):
    REGULAR: ClassVar["UserRole"]
    ADMIN: ClassVar["UserRole"]
    _VALID_ROLES: ClassVar[frozenset[str]] = frozenset({"regular", "admin"})

    def __init__(self, value: str):
        super().__init__(
            value, field="role", label="Role", additional_check=UserRole.validate
        )

    @classmethod
    def validate(cls, value: str):
        if value not in UserRole._VALID_ROLES:
            raise ValidationError(
                "role",
                [f"Invalid user role: {value}"],
            )


UserRole.REGULAR = UserRole("regular")
UserRole.ADMIN = UserRole("admin")
