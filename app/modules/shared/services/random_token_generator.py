import secrets

from app.modules.shared.domain import NonEmptyString


class RandomTokenGenerator:
    @staticmethod
    def generate(size: int = 32) -> NonEmptyString:
        return NonEmptyString(secrets.token_urlsafe(size))
