import json
from typing import Any

from app.modules.shared.domain import Email, NonEmptyString

from .email_message import EmailMessage


class EmailMessageConverter:
    @staticmethod
    def serialize(message: EmailMessage) -> str:
        data = {
            "subject": message.subject.value,
            "to": message.to.value,
            "plain_text": message.plain_text.value,
            "html_text": (
                None if message.html_text is None else message.html_text.value
            ),
        }

        return json.dumps(data)

    @staticmethod
    def deserialize(value: str) -> EmailMessage:
        data: dict[str, Any] = json.loads(value)

        html_text = data.get("html_text")
        return EmailMessage(
            subject=NonEmptyString(data["subject"]),
            to=Email(data["to"]),
            plain_text=NonEmptyString(data["plain_text"]),
            html_text=(None if html_text is None else NonEmptyString(html_text)),
        )
