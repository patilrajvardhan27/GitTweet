'use strict';

const express = require('express');
const { requireGitHub, requireTwitter } = require('../middleware/requireAuth');
const github = require('../services/github');
const twitter = require('../services/twitter');
const claude = require('../services/claude');

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

router.get('/commits', requireGitHub, async (req, res, next) => {
  try {
    const { repo } = req.query;

    if (!repo || !REPO_REGEX.test(repo)) {
      return res.status(400).json({ error: 'Invalid repo parameter. Expected format: owner/name' });
    }

    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const data = await github.getCommits(req.session.github.accessToken, repo, since);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Generate Tweet ───────────────────────────────────────────────────────────

router.post('/generate-tweet', async (req, res, next) => {
  try {
    const { commits, repoName, repoDescription, context } = req.body;

    if (!Array.isArray(commits) || commits.length === 0) {
      return res.status(400).json({ error: 'commits must be a non-empty array' });
    }

    if (!repoName || typeof repoName !== 'string') {
      return res.status(400).json({ error: 'repoName is required' });
    }

    const tweet = await claude.generateTweet(
      commits,
      repoName,
      repoDescription ?? null,
      context ?? null,
    );

    res.json({ tweet });
  } catch (err) {
    next(err);
  }
});

// ─── Post Tweet ───────────────────────────────────────────────────────────────

router.post('/post-tweet', requireTwitter, async (req, res, next) => {
  try {
    const { text } = req.body;

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
  } catch (err) {
    next(err);
  }
});

module.exports = router;
