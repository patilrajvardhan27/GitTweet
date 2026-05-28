'use strict';

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');
const github = require('../services/github');
const twitter = require('../services/twitter');

const router = express.Router();

// ─── GitHub OAuth ─────────────────────────────────────────────────────────────

router.get('/github', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.githubState = state;

  const params = new URLSearchParams({
    client_id: config.github.clientId,
    redirect_uri: config.github.callbackUrl,
    scope: 'repo read:user',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/github/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || state !== req.session.githubState) {
    return res.redirect(`${config.clientUrl}?error=github_auth_failed`);
  }

  delete req.session.githubState;

  try {
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
        redirect_uri: config.github.callbackUrl,
      },
      { headers: { Accept: 'application/json' } },
    );

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error('No access token returned');

    const user = await github.getUser(accessToken);
    req.session.github = { accessToken, user };

    res.redirect(`${config.clientUrl}/dashboard`);
  } catch {
    res.redirect(`${config.clientUrl}?error=github_auth_failed`);
  }
});

// ─── Twitter OAuth 2.0 PKCE ───────────────────────────────────────────────────

router.get('/twitter', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  req.session.twitterState = state;
  req.session.twitterCodeVerifier = codeVerifier;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.twitter.clientId,
    redirect_uri: config.twitter.callbackUrl,
    scope: config.twitter.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  res.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
});

router.get('/twitter/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || state !== req.session.twitterState) {
    return res.redirect(`${config.clientUrl}?error=twitter_auth_failed`);
  }

  const codeVerifier = req.session.twitterCodeVerifier;
  delete req.session.twitterState;
  delete req.session.twitterCodeVerifier;

  try {
    const credentials = Buffer.from(
      `${config.twitter.clientId}:${config.twitter.clientSecret}`,
    ).toString('base64');

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.twitter.callbackUrl,
      code_verifier: codeVerifier,
    });

    const tokenRes = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
      },
    );

    const { access_token, refresh_token } = tokenRes.data;
    const user = await twitter.getUser(access_token);

    req.session.twitter = { accessToken: access_token, refreshToken: refresh_token, user };

    res.redirect(`${config.clientUrl}/dashboard`);
  } catch {
    res.redirect(`${config.clientUrl}?error=twitter_auth_failed`);
  }
});

// ─── Status & Disconnect ──────────────────────────────────────────────────────

router.get('/status', (req, res) => {
  res.json({
    github: req.session.github?.user ?? null,
    twitter: req.session.twitter?.user ?? null,
  });
});

router.post('/disconnect/:provider', (req, res) => {
  const { provider } = req.params;

  if (provider === 'github') {
    delete req.session.github;
  } else if (provider === 'twitter') {
    delete req.session.twitter;
  } else {
    return res.status(400).json({ error: 'Unknown provider' });
  }

  res.json({ success: true });
});

module.exports = router;
