import hashlib
import hmac
import os
from typing import ClassVar

from app.modules.user.domain import Password, PasswordHash


class PasswordHasher:
    ITERATIONS: ClassVar[int] = 600_000
    SALT_SIZE: ClassVar[int] = 16
    HASH_NAME: ClassVar[str] = "sha256"

    @staticmethod
    def hash(password: Password) -> PasswordHash:
        salt = os.urandom(PasswordHasher.SALT_SIZE)

        pw_hash = hashlib.pbkdf2_hmac(
            PasswordHasher.HASH_NAME,
            password.value.encode("utf-8"),
            salt,
            PasswordHasher.ITERATIONS,
        )

        return PasswordHash(pw_hash.hex(), salt)

    @staticmethod
    def verify(
        pw_hash: PasswordHash,
        password: Password,
    ) -> bool:
        expected_hash = hashlib.pbkdf2_hmac(
            PasswordHasher.HASH_NAME,
            password.value.encode("utf-8"),
            pw_hash.salt,
            PasswordHasher.ITERATIONS,
        )

        return hmac.compare_digest(pw_hash.value, expected_hash.hex())
