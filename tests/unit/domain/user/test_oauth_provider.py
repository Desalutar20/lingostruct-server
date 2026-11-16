import pytest

from app.modules.shared.domain import ValidationError
from app.modules.user.domain.oauth_provider import OAuthProvider


class TestOAuthProvider:
    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("google", id="google provider"),
            pytest.param("github", id="github provider"),
        ],
    )
    def test_should_create_oauth_provider(self, value: str):
        provider = OAuthProvider(value)

        assert provider.value == value
        assert str(provider) == value

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty provider"),
            pytest.param("   ", id="whitespace provider"),
            pytest.param("facebook", id="unsupported provider"),
            pytest.param("Google", id="uppercase provider"),
            pytest.param("GITHUB", id="uppercase github"),
        ],
    )
    def test_should_raise_validation_error_when_provider_is_invalid(
        self,
        value: str,
    ):
        with pytest.raises(ValidationError):
            OAuthProvider(value)

    def test_should_skip_validation_when_pass_validation_is_true(self):
        provider = OAuthProvider("facebook", pass_validation=True)

        assert provider.value == "facebook"

    def test_should_be_immutable(self):
        provider = OAuthProvider("google")

        with pytest.raises(AttributeError):
            setattr(provider, "value", "github")

        with pytest.raises(AttributeError):
            setattr(provider, "_NonEmptyString__value", "github")

    def test_should_be_equal_to_another_instance_with_same_value(self):
        first = OAuthProvider("google")
        second = OAuthProvider("google")

        assert first == second

    def test_should_not_be_equal_to_provider_with_different_value(self):
        first = OAuthProvider("google")
        second = OAuthProvider("github")

        assert first != second

    def test_should_not_be_equal_to_string(self):
        provider = OAuthProvider("google")

        assert provider != "google"

    def test_should_have_same_hash_for_equal_instances(self):
        first = OAuthProvider("google")
        second = OAuthProvider("google")

        assert hash(first) == hash(second)
        assert len({first, second}) == 1

    def test_should_have_google_constant(self):
        assert OAuthProvider.GOOGLE == OAuthProvider("google")

    def test_should_have_github_constant(self):
        assert OAuthProvider.GITHUB == OAuthProvider("github")
