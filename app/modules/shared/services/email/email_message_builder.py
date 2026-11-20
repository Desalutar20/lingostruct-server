from typing import ClassVar
from urllib.parse import urlencode

from app.core.config import ApplicationConfig
from app.modules.shared.domain import Email, NonEmptyString

from .email_message import EmailMessage


class EmailMessageBuilder:
    _ACCOUNT_VERIFICATION_SUBJECT: ClassVar[NonEmptyString] = NonEmptyString(
        "Account verification"
    )
    _PASSWORD_CHANGED_SUBJECT: ClassVar[NonEmptyString] = NonEmptyString(
        "Your password has been changed"
    )
    _RESET_PASSWORD_SUBJECT: ClassVar[NonEmptyString] = NonEmptyString(
        "Reset your password"
    )

    @staticmethod
    def _build_url(
        client_url: str,
        path: str,
        token: NonEmptyString,
        email: Email,
    ) -> str:
        from urllib.parse import urlsplit, urlunsplit

        parts = urlsplit(client_url)

        return urlunsplit(
            (
                parts.scheme,
                parts.netloc,
                path,
                urlencode({"token": token.value, "email": email.value}),
                "",
            )
        )

    @staticmethod
    def build_account_verification_email(
        config: ApplicationConfig,
        to: Email,
        token: NonEmptyString,
    ) -> EmailMessage:
        url = EmailMessageBuilder._build_url(
            str(config.client_url),
            config.account_verification_path,
            token,
            to,
        )

        text = NonEmptyString(
            f"""\
Hello,

Please verify your account by clicking the link below:

{url}

Thank you"""
        )

        html = NonEmptyString(
            f"""\
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #2E86C1;">Hello!</h2>
    <p>Please verify your account by clicking the button below:</p>
    <a href="{url}"
       target="_blank"
       style="
           display: inline-block;
           padding: 10px 20px;
           background-color: #2E86C1;
           color: white;
           text-decoration: none;
           border-radius: 5px;
           font-weight: bold;
       ">
       Verify Account
    </a>
    <p style="margin-top: 20px;">
        If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p>{url}</p>
    <p>Thank you</p>
</body>
</html>"""
        )

        return EmailMessage(
            EmailMessageBuilder._ACCOUNT_VERIFICATION_SUBJECT,
            to,
            text,
            html,
        )

    @staticmethod
    def build_reset_password_email(
        config: ApplicationConfig,
        to: Email,
        token: NonEmptyString,
    ) -> EmailMessage:
        reset_url = EmailMessageBuilder._build_url(
            str(config.client_url),
            config.reset_password_path,
            token,
            to,
        )

        text = NonEmptyString(
            f"""\
Hello,

You requested a password reset.

Open the link below to set a new password:

{reset_url}

If you did not request this, you can safely ignore this email.

Thanks"""
        )

        html = NonEmptyString(
            f"""\
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Password reset</h2>
    <p>You requested a password reset.</p>
    <a href="{reset_url}"
       target="_blank"
       style="
           display: inline-block;
           padding: 12px 24px;
           background-color: #2E86C1;
           color: #ffffff;
           text-decoration: none;
           border-radius: 6px;
           font-weight: bold;
       ">
       Reset password
    </a>
    <p style="margin-top: 20px;">
        If the button doesn't work, copy and paste this link into your browser:
    </p>
    <p>{reset_url}</p>
    <p>If you did not request a password reset, just ignore this email.</p>
    <p>Thanks</p>
</body>
</html>"""
        )

        return EmailMessage(
            EmailMessageBuilder._RESET_PASSWORD_SUBJECT,
            to,
            text,
            html,
        )

    @staticmethod
    def build_password_changed_email(to: Email) -> EmailMessage:
        text = NonEmptyString(
            """\
Hello,

Your password has been successfully changed.

If you did not perform this action, please contact support immediately.

Thanks"""
        )

        html = NonEmptyString(
            """\
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Password changed</h2>
    <p>Your password has been successfully changed.</p>
    <p>If you did not perform this action, contact support immediately.</p>
    <p>Thanks</p>
</body>
</html>"""
        )

        return EmailMessage(
            EmailMessageBuilder._PASSWORD_CHANGED_SUBJECT,
            to,
            text,
            html,
        )
