import pytest

from app.modules.shared.domain import InternalError
from app.modules.user.domain import PasswordHash


class TestPasswordHash:
    @pytest.fixture
    def salt(self) -> bytes:
        return b"test-salt"

    @pytest.fixture
    def valid_hash(self) -> str:
        return "a" * PasswordHash.MIN_LENGTH

    def test_should_create_password_hash(self, valid_hash: str, salt: bytes):
        password_hash = PasswordHash(valid_hash, salt)

        assert password_hash.value == valid_hash
        assert str(password_hash) == valid_hash

    def test_should_preserve_salt(self, valid_hash: str, salt: bytes):
        password_hash = PasswordHash(valid_hash, salt)

        assert password_hash.salt == salt

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty hash"),
            pytest.param(
                "a" * (PasswordHash.MIN_LENGTH - 1),
                id="hash too short",
            ),
            pytest.param(
                "a" * (PasswordHash.MAX_LENGTH + 1),
                id="hash too long",
            ),
        ],
    )
    def test_should_raise_internal_error_when_hash_is_invalid(self, value: str):
        with pytest.raises(InternalError):
            PasswordHash(value, b"test-salt")

    def test_should_accept_hash_at_minimum_length(self, salt: bytes):
        value = "a" * PasswordHash.MIN_LENGTH

        password_hash = PasswordHash(value, salt)

        assert len(password_hash.value) == PasswordHash.MIN_LENGTH

    def test_should_accept_hash_at_maximum_length(self, salt: bytes):
        value = "a" * PasswordHash.MAX_LENGTH

        password_hash = PasswordHash(value, salt)

        assert len(password_hash.value) == PasswordHash.MAX_LENGTH

    def test_should_be_immutable(self, valid_hash: str, salt: bytes):
        password_hash = PasswordHash(valid_hash, salt)

        with pytest.raises(AttributeError):
            setattr(password_hash, "value", "b" * PasswordHash.MIN_LENGTH)

        with pytest.raises(AttributeError):
            setattr(password_hash, "salt", b"another-salt")

        with pytest.raises(AttributeError):
            setattr(
                password_hash,
                "_NonEmptyString__value",
                "b" * PasswordHash.MIN_LENGTH,
            )

        with pytest.raises(AttributeError):
            setattr(password_hash, "_PasswordHash__salt", b"another-salt")
