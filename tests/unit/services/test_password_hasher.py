from app.modules.shared.services import PasswordHasher
from app.modules.user.domain import Password, PasswordHash


class TestPasswordHasher:
    def test_should_hash_password(self):
        password = Password("my-secure-password")

        password_hash = PasswordHasher.hash(password)

        assert isinstance(password_hash, PasswordHash)
        assert password_hash.value != password.value
        assert len(password_hash.salt) == PasswordHasher.SALT_SIZE

    def test_should_generate_different_salts_for_same_password(self):
        password = Password("my-secure-password")

        first = PasswordHasher.hash(password)
        second = PasswordHasher.hash(password)

        assert first.salt != second.salt

    def test_should_generate_different_hashes_for_same_password(self):
        password = Password("my-secure-password")

        first = PasswordHasher.hash(password)
        second = PasswordHasher.hash(password)

        assert first.value != second.value

    def test_should_verify_password(self):
        password = Password("my-secure-password")
        password_hash = PasswordHasher.hash(password)

        assert PasswordHasher.verify(password_hash, password) is True

    def test_should_not_verify_incorrect_password(self):
        password_hash = PasswordHasher.hash(Password("my-secure-password"))

        assert (
            PasswordHasher.verify(
                password_hash,
                Password("another-password"),
            )
            is False
        )
