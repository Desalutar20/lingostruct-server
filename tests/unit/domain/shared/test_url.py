import pytest

from app.modules.shared.domain import Url, ValidationError


class TestUrl:
    @pytest.mark.parametrize(
        ("value", "expected"),
        [
            pytest.param(
                "https://example.com",
                "https://example.com",
                id="https url",
            ),
            pytest.param(
                "http://example.com",
                "http://example.com",
                id="http url",
            ),
            pytest.param(
                "https://example.com/path?key=value",
                "https://example.com/path?key=value",
                id="url with path and query",
            ),
            pytest.param(
                "https://sub.example.co.uk",
                "https://sub.example.co.uk",
                id="url with subdomain",
            ),
            pytest.param(
                " https://example.com ",
                "https://example.com",
                id="strip whitespace",
            ),
        ],
    )
    def test_should_create_url(self, value: str, expected: str):
        url = Url(value)

        assert url.value == expected
        assert str(url) == expected

    @pytest.mark.parametrize(
        "value",
        [
            pytest.param("", id="empty url"),
            pytest.param("   ", id="whitespace url"),
            pytest.param("example.com", id="missing scheme"),
            pytest.param("//example.com", id="missing scheme"),
            pytest.param("ftp://example.com", id="unsupported scheme"),
            pytest.param("https://", id="missing hostname"),
            pytest.param("http://", id="missing hostname"),
        ],
    )
    def test_should_raise_validation_error_when_url_is_invalid(
        self,
        value: str,
    ):
        with pytest.raises(ValidationError):
            Url(value)

    def test_should_raise_validation_error_when_url_exceeds_max_length(self):
        value = f"https://example.com/{'a' * Url.MAX_LENGTH}"

        with pytest.raises(ValidationError):
            Url(value)

    def test_should_accept_url_at_max_length(self):
        prefix = "https://example.com/"
        value = prefix + "a" * (Url.MAX_LENGTH - len(prefix))

        url = Url(value)

        assert len(url.value) == Url.MAX_LENGTH

    def test_should_use_custom_field_in_validation_error(self):
        with pytest.raises(ValidationError) as exc_info:
            Url("invalid", field="avatar_url")

        assert exc_info.value.errors[0] == "avatar_url"

    def test_should_skip_validation_when_pass_validation_is_true(self):
        url = Url("", pass_validation=True)

        assert url.value == ""

    def test_should_be_immutable(self):
        url = Url("https://example.com")

        with pytest.raises(AttributeError):
            setattr(url, "value", "https://other.com")

        with pytest.raises(AttributeError):
            setattr(url, "_NonEmptyString__value", "https://other.com")

    def test_should_be_equal_to_another_instance_with_same_value(self):
        first = Url("https://example.com")
        second = Url("https://example.com")

        assert first == second

    def test_should_not_be_equal_to_url_with_different_value(self):
        first = Url("https://example.com")
        second = Url("https://other.com")

        assert first != second

    def test_should_not_be_equal_to_string(self):
        url = Url("https://example.com")

        assert url != "https://example.com"

    def test_should_have_same_hash_for_equal_instances(self):
        first = Url("https://example.com")
        second = Url("https://example.com")

        assert hash(first) == hash(second)
        assert len({first, second}) == 1
