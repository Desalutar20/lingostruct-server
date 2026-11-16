from app.modules.shared.domain import NonEmptyString
from app.modules.shared.services import RandomTokenGenerator


class TestRandomTokenGenerator:
    def test_should_generate_non_empty_string(self):
        token = RandomTokenGenerator.generate()

        assert isinstance(token, NonEmptyString)
        assert token.value

    def test_should_generate_token_with_default_size(self):
        token = RandomTokenGenerator.generate()

        assert len(token.value) == len(RandomTokenGenerator.generate(32).value)

    def test_should_generate_different_tokens(self):
        first = RandomTokenGenerator.generate()
        second = RandomTokenGenerator.generate()

        assert first != second

    def test_should_generate_token_with_custom_size(self):
        size = 64

        token = RandomTokenGenerator.generate(size)

        assert len(token.value) == len(__import__("secrets").token_urlsafe(size))
