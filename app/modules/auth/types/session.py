import json
from dataclasses import dataclass
from typing import Any

from app.modules.shared.domain import Email, Url
from app.modules.user.domain import FirstName, LastName, UserID, UserRole
from app.modules.user.schemas.user_schema import UserSchema


@dataclass
class Session:
    user_id: UserID
    email: Email
    first_name: FirstName | None
    last_name: LastName | None
    role: UserRole
    avatar_url: Url | None

    def serialize(self) -> str:
        data = {
            "user_id": str(self.user_id),
            "email": self.email.value,
            "first_name": None if self.first_name is None else self.first_name.value,
            "last_name": None if self.last_name is None else self.last_name.value,
            "role": self.role.value,
            "avatar_url": None if self.avatar_url is None else self.avatar_url.value,
        }

        return json.dumps(data)

    @staticmethod
    def deserialize(value: str) -> "Session":
        data: dict[str, Any] = json.loads(value)

        first_name = data.get("first_name")
        last_name = data.get("last_name")
        avatar_url = data.get("avatar_url")

        return Session(
            user_id=UserID(data["user_id"]),
            email=Email(data["email"]),
            first_name=None if first_name is None else FirstName(first_name),
            last_name=None if last_name is None else LastName(last_name),
            role=UserRole(data["role"]),
            avatar_url=None if avatar_url is None else Url(avatar_url),
        )

    def to_user_schema(self) -> UserSchema:
        return UserSchema(
            id=self.user_id,
            email=self.email.value,
            first_name=self.first_name.value if self.first_name is not None else None,
            last_name=self.last_name.value if self.last_name is not None else None,
            role=self.role.value,
            avatar_url=self.avatar_url.value if self.avatar_url is not None else None,
        )
