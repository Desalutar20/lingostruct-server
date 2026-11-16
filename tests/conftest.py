import pytest

from tests.integration.testapp import TestApp


@pytest.fixture
async def test_app(monkeypatch):
    monkeypatch.setenv("ENV", "test")

    async with TestApp() as app:
        yield app
