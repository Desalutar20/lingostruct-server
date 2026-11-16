import pytest

from app.modules.shared.domain import ValidationError
from app.modules.user.domain import FirstName


class TestFirstName:
    @pytest.mark.parametrize(
        ("value", "expected"),
        [
            pytest.param("John", "John", id="simple name"),
            pytest.param("John Smith", "John Smith", id="name with space"),
            pytest.param(" Jean-Luc ", "Jean-Luc", id="strip whitespace"),
        ],
    )
    def test_should_create_first_name(self, value: str, expected: str):
        first_name = FirstName(value)

        assert first_name.value == expected
        assert str(first_name) == expected

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty name"),
            pytest.param("   ", id="whitespace name"),
        ],
    )
    def test_should_raise_validation_error_when_name_is_empty(
        self,
        value: str,
    ):
        with pytest.raises(ValidationError):
            FirstName(value)

    def test_should_raise_validation_error_when_name_exceeds_max_length(self):
        value = "a" * (FirstName.MAX_LENGTH + 1)

        with pytest.raises(ValidationError):
            FirstName(value)

    def test_should_accept_name_at_max_length(self):
        value = "a" * FirstName.MAX_LENGTH

        first_name = FirstName(value)

        assert len(first_name.value) == FirstName.MAX_LENGTH

    def test_should_skip_validation_when_pass_validation_is_true(self):
        first_name = FirstName("", pass_validation=True)

        assert first_name.value == ""

    def test_should_be_immutable(self):
        first_name = FirstName("John")

        with pytest.raises(AttributeError):
            setattr(first_name, "value", "James")

        with pytest.raises(AttributeError):
            setattr(first_name, "_NonEmptyString__value", "James")

    def test_should_be_equal_to_another_instance_with_same_value(self):
        first = FirstName("John")
        second = FirstName("John")

        assert first == second

    def test_should_not_be_equal_to_first_name_with_different_value(self):
        first = FirstName("John")
        second = FirstName("James")

        assert first != second

    def test_should_not_be_equal_to_string(self):
        first_name = FirstName("John")

        assert first_name != "John"

    def test_should_have_same_hash_for_equal_instances(self):
        first = FirstName("John")
        second = FirstName("John")

        assert hash(first) == hash(second)
        assert len({first, second}) == 1
