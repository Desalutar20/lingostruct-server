from typing import ClassVar

from app.modules.shared.domain import NonEmptyString, ValidationError


class OAuthProvider(NonEmptyString):
    GOOGLE: ClassVar["OAuthProvider"]
    GITHUB: ClassVar["OAuthProvider"]

    __VALID_PROVIDERS: ClassVar[frozenset[str]] = frozenset({"google", "github"})

    def __init__(self, value: str, pass_validation: bool = False):

        super().__init__(
            value,
            field="provider",
            label="OAuth provider",
            additional_check=OAuthProvider.validate,
            pass_validation=pass_validation,
        )

    @classmethod
    def validate(cls, value: str):
        if value not in OAuthProvider.__VALID_PROVIDERS:
            raise ValidationError(
                "role",
                [f"Invalid oauth provider: {value}"],
            )


OAuthProvider.GOOGLE = OAuthProvider("google")
OAuthProvider.GITHUB = OAuthProvider("github")
