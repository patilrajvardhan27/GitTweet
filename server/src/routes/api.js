'use strict';

const express = require('express');
const { requireGitHub, requireTwitter } = require('../middleware/requireAuth');
const github = require('../services/github');
const twitter = require('../services/twitter');
const claude = require('../services/claude');
const db = require('../services/supabase');

const router = express.Router();

const REPO_REGEX = /^[\w.\-]+\/[\w.\-]+$/;

// ─── Repos ────────────────────────────────────────────────────────────────────

router.get('/repos', requireGitHub, async (req, res, next) => {
  try {
    const repos = await github.getRepos(req.session.github.accessToken);
    res.json(repos);
  } catch (err) {
    next(err);
  }
});

// ─── Commits ─────────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get('/commits', requireGitHub, async (req, res, next) => {
  try {
    const { repo, since: sinceParam, until: untilParam } = req.query;

    if (!repo || !REPO_REGEX.test(repo)) {
      return res.status(400).json({ error: 'Invalid repo parameter. Expected format: owner/name' });
    }

    const now = new Date();
    const since = (sinceParam && DATE_RE.test(sinceParam))
      ? new Date(sinceParam + 'T00:00:00Z').toISOString()
      : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const until = (untilParam && DATE_RE.test(untilParam))
      ? new Date(untilParam + 'T23:59:59Z').toISOString()
      : undefined;

    const data = await github.getCommits(req.session.github.accessToken, repo, since, until);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Generate Tweet ───────────────────────────────────────────────────────────

router.post('/generate-tweet', async (req, res, next) => {
  try {
    const { commits, repoName, repoDescription, context, tone } = req.body;

    if (!Array.isArray(commits) || commits.length === 0) {
      return res.status(400).json({ error: 'commits must be a non-empty array' });
    }

    if (!repoName || typeof repoName !== 'string') {
      return res.status(400).json({ error: 'repoName is required' });
    }

    const validTones = ['default', 'casual', 'technical', 'motivational'];
    const resolvedTone = validTones.includes(tone) ? tone : 'default';

    const tweet = await claude.generateTweet(
      commits,
      repoName,
      repoDescription ?? null,
      context ?? null,
      resolvedTone,
    );

    res.json({ tweet });
  } catch (err) {
    next(err);
  }
});

// ─── Post Tweet ───────────────────────────────────────────────────────────────

router.post('/post-tweet', requireTwitter, async (req, res, next) => {
  try {
    const { text, repo, tone } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }

    if (text.length > 280) {
      return res.status(400).json({ error: 'Tweet exceeds 280 characters' });
    }

    const { accessToken, refreshToken } = req.session.twitter;

    const result = await twitter.postTweet(accessToken, refreshToken, text, (tokens) => {
      req.session.twitter.accessToken = tokens.access_token;
      req.session.twitter.refreshToken = tokens.refresh_token;
    });

    const tweetUrl = `https://twitter.com/i/web/status/${result.id}`;
    res.json({ success: true, tweet_id: result.id, tweet_url: tweetUrl });

    // Persist to DB in the background — don't block the response
    const login = req.session.github?.user?.login;
    if (repo && login) {
      const resolvedTone = tone ?? 'default';
      db.saveTweet({ githubLogin: login, text, tweetUrl, repo, tone: resolvedTone })
        .catch((e) => console.error('[db] saveTweet failed:', e.message));
      db.upsertPreferences(login, { defaultTone: resolvedTone, defaultRepo: repo })
        .catch((e) => console.error('[db] upsertPreferences failed:', e.message));
    }
  } catch (err) {
    next(err);
  }
});

// ─── Tweet History ────────────────────────────────────────────────────────────

router.get('/history', requireGitHub, async (req, res, next) => {
  try {
    const login = req.session.github.user.login;
    const rows = await db.getTweets(login);
    const tweets = rows.map((r) => ({
      id: r.id,
      text: r.text,
      url: r.tweet_url,
      repo: r.repo,
      date: r.created_at,
      tone: r.tone,
    }));
    res.json({ tweets, enabled: db.isEnabled() });
  } catch (err) {
    next(err);
  }
});

router.delete('/history', requireGitHub, async (req, res, next) => {
  try {
    const login = req.session.github.user.login;
    await db.clearTweets(login);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Preferences ─────────────────────────────────────────────────────────────

router.get('/preferences', requireGitHub, async (req, res, next) => {
  try {
    const login = req.session.github.user.login;
    const prefs = await db.getPreferences(login);
    res.json({
      defaultTone: prefs?.default_tone ?? 'default',
      defaultRepo: prefs?.default_repo ?? null,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
