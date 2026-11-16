import pytest

from app.modules.shared.domain import ValidationError
from app.modules.user.domain import Password


class TestPassword:
    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("password", id="minimum length"),
            pytest.param("a" * Password.MAX_LENGTH, id="maximum length"),
            pytest.param("my-secure-password", id="valid password"),
            pytest.param(" password ", id="strip whitespace"),
        ],
    )
    def test_should_create_password(self, value: str):
        password = Password(value)

        assert password.value == value.strip()
        assert str(password) == value.strip()

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty password"),
            pytest.param("   ", id="whitespace password"),
            pytest.param(
                "a" * (Password.MIN_LENGTH - 1),
                id="password too short",
            ),
            pytest.param(
                "a" * (Password.MAX_LENGTH + 1),
                id="password too long",
            ),
        ],
    )
    def test_should_raise_validation_error_when_password_is_invalid(
        self,
        value: str,
    ):
        with pytest.raises(ValidationError):
            Password(value)

    def test_should_accept_password_at_minimum_length(self):
        password = Password("a" * Password.MIN_LENGTH)

        assert len(password.value) == Password.MIN_LENGTH

    def test_should_accept_password_at_maximum_length(self):
        password = Password("a" * Password.MAX_LENGTH)

        assert len(password.value) == Password.MAX_LENGTH

    def test_should_skip_validation_when_pass_validation_is_true(self):
        password = Password("", pass_validation=True)

        assert password.value == ""

    def test_should_be_immutable(self):
        password = Password("password123")

        with pytest.raises(AttributeError):
            setattr(password, "value", "another-password")

        with pytest.raises(AttributeError):
            setattr(password, "_NonEmptyString__value", "another-password")

    def test_should_be_equal_to_another_instance_with_same_value(self):
        first = Password("password123")
        second = Password("password123")

        assert first == second

    def test_should_not_be_equal_to_password_with_different_value(self):
        first = Password("password123")
        second = Password("password456")

        assert first != second

    def test_should_not_be_equal_to_string(self):
        password = Password("password123")

        assert password != "password123"

    def test_should_have_same_hash_for_equal_instances(self):
        first = Password("password123")
        second = Password("password123")

        assert hash(first) == hash(second)
        assert len({first, second}) == 1
