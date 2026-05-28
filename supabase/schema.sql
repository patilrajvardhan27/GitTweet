-- Run this in your Supabase SQL editor:
-- https://supabase.com/dashboard/project/_/sql/new

-- Tweet history
CREATE TABLE IF NOT EXISTS tweets (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  github_login  text        NOT NULL,
  text          text        NOT NULL,
  tweet_url     text        NOT NULL,
  repo          text        NOT NULL,
  tone          text        NOT NULL DEFAULT 'default',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tweets_github_login_idx ON tweets (github_login);

-- User preferences (one row per GitHub user)
CREATE TABLE IF NOT EXISTS user_preferences (
  github_login  text        PRIMARY KEY,
  default_tone  text        NOT NULL DEFAULT 'default',
  default_repo  text,
  updated_at    timestamptz DEFAULT now()
);
