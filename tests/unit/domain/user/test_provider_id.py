import pytest

from app.modules.shared.domain import ValidationError
from app.modules.user.domain import ProviderID


class TestProviderID:
    @pytest.mark.parametrize(
        ("value", "expected"),
        [
            pytest.param("123456", "123456", id="simple provider id"),
            pytest.param("abc-123_xyz", "abc-123_xyz", id="id with special characters"),
            pytest.param(" abc123 ", "abc123", id="strip whitespace"),
        ],
    )
    def test_should_create_provider_id(self, value: str, expected: str):
        provider_id = ProviderID(value)

        assert provider_id.value == expected
        assert str(provider_id) == expected

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty provider id"),
            pytest.param("   ", id="whitespace provider id"),
        ],
    )
    def test_should_raise_validation_error_when_provider_id_is_empty(
        self,
        value: str,
    ):
        with pytest.raises(ValidationError):
            ProviderID(value)

    def test_should_raise_validation_error_when_provider_id_exceeds_max_length(self):
        value = "a" * (ProviderID.MAX_LENGTH + 1)

        with pytest.raises(ValidationError):
            ProviderID(value)

    def test_should_accept_provider_id_at_max_length(self):
        value = "a" * ProviderID.MAX_LENGTH

        provider_id = ProviderID(value)

        assert len(provider_id.value) == ProviderID.MAX_LENGTH

    def test_should_be_immutable(self):
        provider_id = ProviderID("123456")

        with pytest.raises(AttributeError):
            setattr(provider_id, "value", "654321")

        with pytest.raises(AttributeError):
            setattr(provider_id, "_NonEmptyString__value", "654321")

    def test_should_be_equal_to_another_instance_with_same_value(self):
        first = ProviderID("123456")
        second = ProviderID("123456")

        assert first == second

    def test_should_not_be_equal_to_provider_id_with_different_value(self):
        first = ProviderID("123456")
        second = ProviderID("654321")

        assert first != second

    def test_should_not_be_equal_to_string(self):
        provider_id = ProviderID("123456")

        assert provider_id != "123456"

    def test_should_have_same_hash_for_equal_instances(self):
        first = ProviderID("123456")
        second = ProviderID("123456")

        assert hash(first) == hash(second)
        assert len({first, second}) == 1
