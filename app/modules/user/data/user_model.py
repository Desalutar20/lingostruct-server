from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import text

from app.core.database import Model
from app.modules.shared.domain import Email, Url
from app.modules.user.domain import (
    FirstName,
    LastName,
    PasswordHash,
    ProviderID,
    UserID,
    UserRole,
)
from app.modules.user.domain import User as DomainUser

_roles = ", ".join(f"'{role}'" for role in UserRole._VALID_ROLES)


class User(Model):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            f"role IN ({_roles})",
            name="ck_users_role",
        ),
    )

    email: Mapped[str] = mapped_column(
        String(Email.MAX_LENGTH), unique=True, nullable=False
    )
    password_hash: Mapped[str | None] = mapped_column(
        String(PasswordHash.MAX_LENGTH), nullable=True
    )
    password_salt: Mapped[bytes | None] = mapped_column(nullable=True)
    first_name: Mapped[str | None] = mapped_column(
        String(FirstName.MAX_LENGTH), nullable=True
    )
    last_name: Mapped[str | None] = mapped_column(
        String(LastName.MAX_LENGTH), nullable=True
    )
    role: Mapped[str] = mapped_column(server_default="regular", nullable=False)
    is_banned: Mapped[bool] = mapped_column(
        server_default=text("false"), nullable=False
    )
    is_verified: Mapped[bool] = mapped_column(
        server_default=text("false"), nullable=False
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(Url.MAX_LENGTH), nullable=True
    )
    github_id: Mapped[str | None] = mapped_column(
        String(ProviderID.MAX_LENGTH), nullable=True
    )
    google_id: Mapped[str | None] = mapped_column(
        String(ProviderID.MAX_LENGTH), nullable=True
    )

    def to_domain(self) -> DomainUser:
        return DomainUser.from_persistence(
            id=UserID(self.id),
            created_at=self.created_at,
            updated_at=self.updated_at,
            email=Email(self.email),
            password_hash=(
                None
                if self.password_hash is None or self.password_salt is None
                else PasswordHash(self.password_hash, self.password_salt)
            ),
            first_name=(
                None if self.first_name is None else FirstName(self.first_name)
            ),
            last_name=(None if self.last_name is None else LastName(self.last_name)),
            role=UserRole(self.role),
            is_banned=self.is_banned,
            is_verified=self.is_verified,
            avatar_url=None if self.avatar_url is None else Url(self.avatar_url),
            google_id=(None if self.google_id is None else ProviderID(self.google_id)),
            github_id=(None if self.github_id is None else ProviderID(self.github_id)),
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "email": self.email,
            "password_hash": self.password_hash,
            "password_salt": self.password_salt,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "is_banned": self.is_banned,
            "is_verified": self.is_verified,
            "avatar_url": self.avatar_url,
            "google_id": self.google_id,
            "github_id": self.github_id,
        }

    @staticmethod
    def from_domain(user: DomainUser) -> "User":
        return User(
            id=user.id,
            created_at=user.created_at,
            updated_at=user.updated_at,
            email=user.email.value,
            password_hash=(
                None if user.password_hash is None else user.password_hash.value
            ),
            password_salt=(
                None if user.password_hash is None else user.password_hash.salt
            ),
            first_name=(None if user.first_name is None else user.first_name.value),
            last_name=(None if user.last_name is None else user.last_name.value),
            role=user.role.value,
            is_banned=user.is_banned,
            is_verified=user.is_verified,
            avatar_url=(None if user.avatar_url is None else user.avatar_url.value),
            google_id=(None if user.google_id is None else user.google_id.value),
            github_id=(None if user.github_id is None else user.github_id.value),
        )
