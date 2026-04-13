CREATE TABLE users (
  id        TEXT PRIMARY KEY,
  email     TEXT UNIQUE NOT NULL,
  role      TEXT NOT NULL CHECK(role IN ('photographer','client')),
  name      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE photographer_profiles (
  user_id       TEXT PRIMARY KEY REFERENCES users(id),
  bio           TEXT,
  portfolio_html TEXT,   -- sanitized on write
  slug          TEXT UNIQUE NOT NULL
);

CREATE TABLE ratings (
  id              TEXT PRIMARY KEY,
  photographer_id TEXT REFERENCES users(id),
  client_id       TEXT REFERENCES users(id),
  score           INTEGER CHECK(score BETWEEN 1 AND 5),
  review          TEXT,
  created_at      INTEGER DEFAULT (unixepoch()),
  UNIQUE(photographer_id, client_id)
);

CREATE TABLE IF NOT EXISTS photographer_profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id),
  bio            TEXT,
  portfolio_html TEXT,
  slug           TEXT UNIQUE NOT NULL
);