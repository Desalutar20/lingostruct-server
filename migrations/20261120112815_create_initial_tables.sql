-- +goose Up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  password_salt bytea,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'regular' CHECK (role in ('admin', 'regular')),
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url TEXT,
  google_id TEXT UNIQUE,
  github_id TEXT UNIQUE
);

CREATE TABLE outbox (
  id UUID PRIMARY KEY NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  data JSONB NOT NULL,
  type TEXT NOT NULL CHECK (type in ('email', 'forgot_password'))
);

-- +goose Down
SELECT
DROP TABLE IF EXISTS outbox;

DROP TABLE IF EXISTS users;
