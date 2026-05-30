'use strict';

const express = require('express');
const { requireAuth, requireGitHub, requireTwitter } = require('../middleware/requireAuth');
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
    const userId = req.session.userId ?? null;
    const login = req.session.github?.user?.login ?? null;
    if (repo && (userId || login)) {
      const resolvedTone = tone ?? 'default';
      db.saveTweet({ userId, githubLogin: login, text, tweetUrl, repo, tone: resolvedTone })
        .catch((e) => console.error('[db] saveTweet failed:', e.message));
      if (userId) {
        db.upsertPreferences(userId, { defaultTone: resolvedTone, defaultRepo: repo })
          .catch((e) => console.error('[db] upsertPreferences failed:', e.message));
      }
    }
  } catch (err) {
    next(err);
  }
});

// ─── Tweet History ────────────────────────────────────────────────────────────

router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.json({ tweets: [], enabled: db.isEnabled() });
    const rows = await db.getTweets(userId);
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

router.delete('/history', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (userId) await db.clearTweets(userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Preferences ─────────────────────────────────────────────────────────────

router.get('/preferences', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.json({
        defaultTone: 'default',
        defaultRepo: null,
        autoPostEnabled: false,
        autoPostRepos: [],
        autoPostTone: 'default',
        autoPostHour: 9,
        autoPostMinute: 0,
      });
    }
    const prefs = await db.getPreferences(userId);
    res.json({
      defaultTone: prefs?.default_tone ?? 'default',
      defaultRepo: prefs?.default_repo ?? null,
      autoPostEnabled: prefs?.auto_post_enabled ?? false,
      autoPostRepos: prefs?.auto_post_repos ?? [],
      autoPostTone: prefs?.auto_post_tone ?? 'default',
      autoPostHour: prefs?.auto_post_hour ?? 9,
      autoPostMinute: prefs?.auto_post_minute ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/preferences', requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { defaultTone, defaultRepo, autoPostEnabled, autoPostRepos, autoPostTone, autoPostHour, autoPostMinute } = req.body;

    const validTones = ['default', 'casual', 'technical', 'motivational'];

    const patch = {};
    if (validTones.includes(defaultTone)) patch.defaultTone = defaultTone;
    if (defaultRepo !== undefined) patch.defaultRepo = typeof defaultRepo === 'string' ? defaultRepo.trim() || null : null;
    if (typeof autoPostEnabled === 'boolean') patch.autoPostEnabled = autoPostEnabled;
    if (Array.isArray(autoPostRepos)) patch.autoPostRepos = autoPostRepos.filter((r) => typeof r === 'string');
    if (validTones.includes(autoPostTone)) patch.autoPostTone = autoPostTone;
    if (typeof autoPostHour === 'number' && autoPostHour >= 0 && autoPostHour <= 23) {
      patch.autoPostHour = Math.floor(autoPostHour);
    }
    if (typeof autoPostMinute === 'number' && autoPostMinute >= 0 && autoPostMinute <= 59) {
      patch.autoPostMinute = Math.floor(autoPostMinute);
    }

    await db.upsertPreferences(userId, patch);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
