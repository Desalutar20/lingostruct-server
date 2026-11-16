from email.message import EmailMessage as MimeMessage
from email.utils import parseaddr
from ssl import create_default_context

import aiosmtplib

from app.core.config import SmtpConfig
from app.modules.shared.domain import InternalError
from app.modules.shared.services.email.email_message import EmailMessage


class EmailService:
    def __init__(self, config: SmtpConfig) -> None:
        self._config = config
        self._smtp_client: aiosmtplib.SMTP | None = None

    async def close(self) -> None:
        if self._smtp_client is not None:
            if self._smtp_client.is_connected:
                await self._smtp_client.quit()

            self._smtp_client = None

    async def send(self, message: EmailMessage) -> None:
        mime_message = self._build_mime_message(message)

        await self._connect()

        if self._smtp_client is not None:
            await self._smtp_client.send_message(mime_message)

    def _build_mime_message(self, message: EmailMessage) -> MimeMessage:
        _, address = parseaddr(message.to.value)

        if not address or address != message.to.value:
            raise InternalError(f"Invalid email address: {message.to.value}")

        mime_message = MimeMessage()
        mime_message["Subject"] = message.subject.value
        mime_message["From"] = self._config.from_email
        mime_message["To"] = address

        mime_message.set_content(message.plain_text.value)

        if message.html_text is not None:
            mime_message.add_alternative(
                message.html_text.value,
                subtype="html",
            )

        return mime_message

    async def _connect(self) -> None:
        if self._smtp_client is not None and self._smtp_client.is_connected:
            try:
                await self._smtp_client.noop()
                return
            except aiosmtplib.SMTPException:
                self._smtp_client = None

        self._smtp_client = aiosmtplib.SMTP(
            hostname=self._config.host,
            port=self._config.port,
            timeout=10,
            start_tls=self._config.tls,
            tls_context=create_default_context(),
        )

        await self._smtp_client.connect()
        await self._smtp_client.login(
            self._config.user,
            self._config.password,
        )

    
