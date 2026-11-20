from uuid import UUID

from pydantic import BaseModel, HttpUrl

from app.modules.shared.schemas import EmailField


class UserSchema(BaseModel):
    id: UUID
    email: EmailField
    first_name: str | None
    last_name: str | None
    role: str
    avatar_url: HttpUrl | None
