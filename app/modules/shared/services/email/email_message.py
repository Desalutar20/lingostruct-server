from dataclasses import dataclass

from app.modules.shared.domain import Email, NonEmptyString


@dataclass(frozen=True, slots=True)
class EmailMessage:
    subject: NonEmptyString
    to: Email
    plain_text: NonEmptyString
    html_text: NonEmptyString | None = None
