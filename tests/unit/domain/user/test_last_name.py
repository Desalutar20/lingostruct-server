import pytest

from app.modules.shared.domain import ValidationError
from app.modules.user.domain import LastName


class TestLastName:
    @pytest.mark.parametrize(
        ("value", "expected"),
        [
            pytest.param("Smith", "Smith", id="simple surname"),
            pytest.param("Van der Berg", "Van der Berg", id="surname with spaces"),
            pytest.param("O'Connor", "O'Connor", id="surname with apostrophe"),
            pytest.param(" García ", "García", id="strip whitespace"),
        ],
    )
    def test_should_create_last_name(self, value: str, expected: str):
        last_name = LastName(value)

        assert last_name.value == expected
        assert str(last_name) == expected

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty surname"),
            pytest.param("   ", id="whitespace surname"),
        ],
    )
    def test_should_raise_validation_error_when_name_is_empty(
        self,
        value: str,
    ):
        with pytest.raises(ValidationError):
            LastName(value)

    def test_should_raise_validation_error_when_name_exceeds_max_length(self):
        value = "a" * (LastName.MAX_LENGTH + 1)

        with pytest.raises(ValidationError):
            LastName(value)

    def test_should_accept_name_at_max_length(self):
        value = "a" * LastName.MAX_LENGTH

        last_name = LastName(value)

        assert len(last_name.value) == LastName.MAX_LENGTH

    def test_should_skip_validation_when_pass_validation_is_true(self):
        last_name = LastName("", pass_validation=True)

        assert last_name.value == ""

    def test_should_be_immutable(self):
        last_name = LastName("Smith")

        with pytest.raises(AttributeError):
            setattr(last_name, "value", "Johnson")

        with pytest.raises(AttributeError):
            setattr(last_name, "_NonEmptyString__value", "Johnson")

    def test_should_be_equal_to_another_instance_with_same_value(self):
        first = LastName("Smith")
        second = LastName("Smith")

        assert first == second

    def test_should_not_be_equal_to_last_name_with_different_value(self):
        first = LastName("Smith")
        second = LastName("Johnson")

        assert first != second

    def test_should_not_be_equal_to_string(self):
        last_name = LastName("Smith")

        assert last_name != "Smith"

    def test_should_have_same_hash_for_equal_instances(self):
        first = LastName("Smith")
        second = LastName("Smith")

        assert hash(first) == hash(second)
        assert len({first, second}) == 1
