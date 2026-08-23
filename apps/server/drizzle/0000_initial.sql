CREATE TABLE IF NOT EXISTS players (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  level integer NOT NULL,
  aura_milli bigint NOT NULL,
  last_seen_at timestamptz NOT NULL,
  last_settled_at timestamptz NOT NULL,
  progression_version integer NOT NULL,
  breakthrough_status text NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY,
  player_id text NOT NULL REFERENCES players(id) ON DELETE CASCADE
);
