import json
from dataclasses import dataclass
from typing import Any

from app.modules.shared.domain import Email, NonEmptyString


@dataclass(frozen=True, slots=True)
class EmailMessage:
    subject: NonEmptyString
    to: Email
    plain_text: NonEmptyString
    html_text: NonEmptyString | None = None

    def serialize(self) -> str:
        data = {
            "subject": self.subject.value,
            "to": self.to.value,
            "plain_text": self.plain_text.value,
            "html_text": (None if self.html_text is None else self.html_text.value),
        }

        return json.dumps(data)

    @staticmethod
    def deserialize(value: str) -> "EmailMessage":
        data: dict[str, Any] = json.loads(value)

        html_text = data.get("html_text")
        return EmailMessage(
            subject=NonEmptyString(data["subject"]),
            to=Email(data["to"]),
            plain_text=NonEmptyString(data["plain_text"]),
            html_text=(None if html_text is None else NonEmptyString(html_text)),
        )
