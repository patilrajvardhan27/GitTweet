-- Run this in your Supabase SQL editor:
-- https://supabase.com/dashboard/project/_/sql/new
--
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout.

-- ─── Users (Google identity) ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  google_id    text        UNIQUE NOT NULL,
  email        text        NOT NULL,
  name         text        NOT NULL,
  picture      text,
  created_at   timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now()
);

-- ─── User Accounts (linked GitHub / Twitter) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS user_accounts (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider     text        NOT NULL CHECK (provider IN ('github', 'twitter')),
  provider_id  text        NOT NULL,
  username     text,
  name         text,
  avatar_url   text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS user_accounts_user_id_idx ON user_accounts (user_id);
CREATE INDEX IF NOT EXISTS user_accounts_provider_idx ON user_accounts (provider, provider_id);

-- ─── Tweet History ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tweets (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES users(id) ON DELETE SET NULL,
  github_login text,                         -- kept for backwards compat
  text         text        NOT NULL,
  tweet_url    text        NOT NULL,
  repo         text        NOT NULL,
  tone         text        NOT NULL DEFAULT 'default',
  created_at   timestamptz DEFAULT now()
);

-- Add user_id to existing tweets table if it was created before this migration
ALTER TABLE tweets ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tweets_user_id_idx    ON tweets (user_id);
CREATE INDEX IF NOT EXISTS tweets_github_login_idx ON tweets (github_login);

-- ─── User Preferences ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id      uuid        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_tone text        NOT NULL DEFAULT 'default',
  default_repo text,
  updated_at   timestamptz DEFAULT now()
);

-- Auto-post scheduling columns (added after initial schema)
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS auto_post_enabled  boolean   NOT NULL DEFAULT false;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS auto_post_repos    text[]    NOT NULL DEFAULT '{}';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS auto_post_tone     text      NOT NULL DEFAULT 'default';
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS auto_post_hour     smallint  NOT NULL DEFAULT 9;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS auto_post_minute   smallint  NOT NULL DEFAULT 0;

-- Legacy table (github_login keyed) — kept so existing data is not lost
CREATE TABLE IF NOT EXISTS user_preferences_legacy (
  github_login text        PRIMARY KEY,
  default_tone text        NOT NULL DEFAULT 'default',
  default_repo text,
  updated_at   timestamptz DEFAULT now()
);
