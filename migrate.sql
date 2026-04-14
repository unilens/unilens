PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS users_new (
  id        TEXT PRIMARY KEY,
  email     TEXT UNIQUE NOT NULL,
  role      TEXT NOT NULL CHECK(role IN ('photographer','client')),
  name      TEXT NOT NULL,
  google_id TEXT UNIQUE,
  created_at INTEGER DEFAULT (unixepoch())
);

INSERT INTO users_new (id, email, role, name, created_at)
SELECT id, email, role, name, created_at FROM users;

DROP TABLE users;

ALTER TABLE users_new RENAME TO users;

PRAGMA foreign_keys=ON;