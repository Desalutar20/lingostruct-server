@a_default:
    just --list

@dev:
    uv run python -m app.main

@lint:
    uv run ruff check --fix

@format:
    uv run ruff format

@test:
    pytest -n 5 -v
