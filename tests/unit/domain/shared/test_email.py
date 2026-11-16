import pytest

from app.modules.shared.domain import Email, ValidationError


class TestEmail:
    @pytest.mark.parametrize(
        ("value", "expected"),
        [
            pytest.param("test@gmail.com", "test@gmail.com", id="valid email"),
            pytest.param(
                " test@gmail.com ",
                "test@gmail.com",
                id="strip whitespace",
            ),
            pytest.param(
                "user.name@example.co.uk",
                "user.name@example.co.uk",
                id="email with subdomain",
            ),
            pytest.param(
                "user+tag@example.com",
                "user+tag@example.com",
                id="email with plus sign",
            ),
        ],
    )
    def test_should_create_email(self, value: str, expected: str):
        email = Email(value)

        assert email.value == expected
        assert str(email) == expected

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty email"),
            pytest.param("   ", id="whitespace email"),
            pytest.param("invalid", id="missing at sign and domain"),
            pytest.param("testgmail.com", id="missing at sign"),
            pytest.param("@gmail.com", id="missing local part"),
            pytest.param("test@", id="missing domain"),
            pytest.param("test@gmail", id="missing domain suffix"),
            pytest.param("test@gmail.", id="empty domain suffix"),
            pytest.param("test@@gmail.com", id="multiple at signs"),
        ],
    )
    def test_should_raise_validation_error_when_email_is_invalid(
        self,
        value: str,
    ):
        with pytest.raises(ValidationError):
            Email(value)

    def test_should_raise_validation_error_when_email_exceeds_max_length(self):
        value = f"{'a' * (Email.MAX_LENGTH - len('@gmail.com') + 1)}@gmail.com"

        with pytest.raises(ValidationError):
            Email(value)

    def test_should_accept_email_at_max_length(self):
        suffix = "@gmail.com"
        value = f"{'a' * (Email.MAX_LENGTH - len(suffix))}{suffix}"

        email = Email(value)

        assert len(email.value) == Email.MAX_LENGTH

    def test_should_skip_validation_when_pass_validation_is_true(self):
        email = Email("", pass_validation=True)

        assert email.value == ""

    def test_should_be_immutable(self):
        email = Email("test@gmail.com")

        with pytest.raises(AttributeError):
            setattr(email, "value", "other@gmail.com")

        with pytest.raises(AttributeError):
            setattr(email, "_NonEmptyString__value", "other@gmail.com")

    def test_should_be_equal_to_another_instance_with_same_value(self):
        first = Email("test@gmail.com")
        second = Email("test@gmail.com")

        assert first == second

    def test_should_not_be_equal_to_email_with_different_value(self):
        first = Email("test@gmail.com")
        second = Email("other@gmail.com")

        assert first != second

    def test_should_not_be_equal_to_string(self):
        email = Email("test@gmail.com")

        assert email != "test@gmail.com"

    def test_should_have_same_hash_for_equal_instances(self):
        first = Email("test@gmail.com")
        second = Email("test@gmail.com")

        assert hash(first) == hash(second)
        assert len({first, second}) == 1
