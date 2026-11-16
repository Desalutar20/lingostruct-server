import pytest

from app.modules.shared.domain import ValidationError
from app.modules.user.domain import UserRole


class TestUserRole:
    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("regular", id="regular role"),
            pytest.param("admin", id="admin role"),
        ],
    )
    def test_should_create_user_role(self, value: str):
        role = UserRole(value)

        assert role.value == value
        assert str(role) == value

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty role"),
            pytest.param("   ", id="whitespace role"),
            pytest.param("moderator", id="unsupported role"),
            pytest.param("Regular", id="uppercase role"),
            pytest.param("ADMIN", id="uppercase admin"),
        ],
    )
    def test_should_raise_validation_error_when_role_is_invalid(
        self,
        value: str,
    ):
        with pytest.raises(ValidationError):
            UserRole(value)

    def test_should_be_immutable(self):
        role = UserRole("regular")

        with pytest.raises(AttributeError):
            setattr(role, "value", "admin")

        with pytest.raises(AttributeError):
            setattr(role, "_NonEmptyString__value", "admin")

    def test_should_be_equal_to_another_instance_with_same_value(self):
        first = UserRole("regular")
        second = UserRole("regular")

        assert first == second

    def test_should_not_be_equal_to_role_with_different_value(self):
        first = UserRole("regular")
        second = UserRole("admin")

        assert first != second

    def test_should_not_be_equal_to_string(self):
        role = UserRole("regular")

        assert role != "regular"

    def test_should_have_same_hash_for_equal_instances(self):
        first = UserRole("regular")
        second = UserRole("regular")

        assert hash(first) == hash(second)
        assert len({first, second}) == 1

    def test_should_have_regular_constant(self):
        assert UserRole.REGULAR == UserRole("regular")

    def test_should_have_admin_constant(self):
        assert UserRole.ADMIN == UserRole("admin")
