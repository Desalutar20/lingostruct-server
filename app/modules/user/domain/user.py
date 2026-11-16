from datetime import UTC, datetime
from uuid import uuid4

from app.modules.shared.domain import Email, Entity, Url

from .first_name import FirstName
from .last_name import LastName
from .password_hash import PasswordHash
from .provider_id import ProviderID
from .user_id import UserID
from .user_role import UserRole


class User(Entity[UserID]):
    def __init__(
        self,
        email: Email,
        password_hash: PasswordHash | None,
        first_name: FirstName | None,
        last_name: LastName | None,
    ):
        now = datetime.now(UTC)
        super().__init__(UserID(uuid4()), now, now)

        self.__email = email
        self.__password_hash = password_hash
        self.__first_name = first_name
        self.__last_name = last_name
        self.__role = UserRole.REGULAR
        self.__is_banned = False
        self.__is_verified = False
        self.__avatar_url: Url | None = None
        self.__google_id: ProviderID | None = None
        self.__github_id: ProviderID | None = None

    @property
    def email(self):
        return self.__email

    @property
    def password_hash(self):
        return self.__password_hash

    @property
    def first_name(self):
        return self.__first_name

    @property
    def last_name(self):
        return self.__last_name

    @property
    def role(self):
        return self.__role

    @property
    def is_banned(self):
        return self.__is_banned

    @property
    def is_verified(self):
        return self.__is_verified

    @property
    def avatar_url(self):
        return self.__avatar_url

    @property
    def github_id(self):
        return self.__github_id

    @property
    def google_id(self):
        return self.__google_id

    @classmethod
    def from_persistence(
        cls,
        id: UserID,
        created_at: datetime,
        updated_at: datetime,
        email: Email,
        password_hash: PasswordHash | None,
        first_name: FirstName | None,
        last_name: LastName | None,
        role: UserRole,
        is_banned: bool,
        is_verified: bool,
        avatar_url: Url | None,
        google_id: ProviderID | None,
        github_id: ProviderID | None,
    ) -> "User":
        user = cls.__new__(cls)
        Entity.__init__(user, id, created_at, updated_at)

        user.__email = email
        user.__password_hash = password_hash
        user.__first_name = first_name
        user.__last_name = last_name
        user.__role = role
        user.__is_banned = is_banned
        user.__is_verified = is_verified
        user.__avatar_url = avatar_url
        user.__google_id = google_id
        user.__github_id = github_id

        return user
