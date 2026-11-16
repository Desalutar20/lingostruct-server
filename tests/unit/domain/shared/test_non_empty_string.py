import pytest

from app.modules.shared.domain import NonEmptyString, ValidationError


class TestNonEmptyString:
    @pytest.mark.parametrize(
        ("value", "expected"),
        [
            pytest.param("hello", "hello", id="regular string"),
            pytest.param(" hello ", "hello", id="strip whitespace"),
            pytest.param("a", "a", id="single character"),
            pytest.param(" hello world ", "hello world", id="multiple words"),
        ],
    )
    def test_should_create_non_empty_string(self, value: str, expected: str):
        result = NonEmptyString(value)

        assert result.value == expected
        assert str(result) == expected

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty string"),
            pytest.param(" ", id="single whitespace"),
            pytest.param("   ", id="multiple whitespaces"),
            pytest.param("\t\n", id="tabs and newlines"),
        ],
    )
    def test_should_raise_validation_error_when_string_is_empty(
        self,
        value: str,
    ):
        with pytest.raises(ValidationError):
            NonEmptyString(value)

    @pytest.mark.parametrize(
        ("kwargs", "field"),
        [
            pytest.param(
                {"min_length": 0},
                "field",
                id="minimum length is zero",
            ),
            pytest.param(
                {"min_length": -1},
                "field",
                id="minimum length is negative",
            ),
            pytest.param(
                {"max_length": 0},
                "field",
                id="maximum length is zero",
            ),
            pytest.param(
                {"max_length": -1},
                "field",
                id="maximum length is negative",
            ),
        ],
    )
    def test_should_raise_validation_error_when_length_constraint_is_invalid(
        self,
        kwargs: dict,
        field: str,
    ):
        with pytest.raises(ValidationError):
            NonEmptyString("hello", **kwargs)

    @pytest.mark.parametrize(
        ("value", "kwargs"),
        [
            pytest.param(
                "hello",
                {"min_length": 6},
                id="string shorter than minimum",
            ),
            pytest.param(
                "hello",
                {"max_length": 4},
                id="string longer than maximum",
            ),
        ],
    )
    def test_should_raise_validation_error_when_length_is_out_of_bounds(
        self,
        value: str,
        kwargs: dict,
    ):
        with pytest.raises(ValidationError):
            NonEmptyString(value, **kwargs)

    def test_should_use_custom_field_and_label_in_validation(self):
        with pytest.raises(ValidationError):
            NonEmptyString(
                "",
                field="first_name",
                label="First name",
            )

    def test_should_call_additional_check_with_normalized_value(self):
        received: list[str] = []

        def additional_check(value: str) -> None:
            received.append(value)

        NonEmptyString(
            " hello ",
            additional_check=additional_check,
        )

        assert received == ["hello"]

    def test_should_propagate_additional_check_error(self):
        def additional_check(value: str) -> None:
            raise ValueError("invalid value")

        with pytest.raises(ValueError, match="invalid value"):
            NonEmptyString(
                "hello",
                additional_check=additional_check,
            )

    def test_should_skip_validation_when_pass_validation_is_true(self):
        result = NonEmptyString(
            "",
            min_length=0,
            max_length=0,
            pass_validation=True,
        )

        assert result.value == ""

    def test_should_not_strip_value_when_pass_validation_is_true(self):
        result = NonEmptyString(
            " hello ",
            pass_validation=True,
        )

        assert result.value == " hello "

    def test_should_be_immutable(self):
        value = NonEmptyString("hello")

        with pytest.raises(AttributeError):
            value.value = "world"  # ty: ignore[invalid-assignment]

        with pytest.raises(AttributeError):
            value._NonEmptyString__value = "world"

        with pytest.raises(AttributeError):
            del value.value

    def test_should_not_allow_new_attributes(self):
        value = NonEmptyString("hello")

        with pytest.raises(AttributeError):
            value.new_attribute = "world"

    def test_should_be_equal_to_another_instance_with_same_value(self):
        first = NonEmptyString("hello")
        second = NonEmptyString("hello")

        assert first == second

    def test_should_not_be_equal_to_instance_with_different_value(self):
        first = NonEmptyString("hello")
        second = NonEmptyString("world")

        assert first != second

    def test_should_not_be_equal_to_different_type(self):
        value = NonEmptyString("hello")

        assert value != "hello"

    def test_should_not_be_equal_to_subclass_instance(self):
        class DerivedNonEmptyString(NonEmptyString):
            pass

        value = NonEmptyString("hello")
        derived = DerivedNonEmptyString("hello")

        assert value != derived

    def test_should_have_same_hash_for_equal_instances(self):
        first = NonEmptyString("hello")
        second = NonEmptyString("hello")

        assert hash(first) == hash(second)
        assert len({first, second}) == 1
