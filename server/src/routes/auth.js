'use strict';

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');
const github = require('../services/github');
const twitter = require('../services/twitter');

const db = require('../services/supabase');

const router = express.Router();

// ─── Google OAuth ─────────────────────────────────────────────────────────────

router.get('/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  req.session.googleState = state;

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || state !== req.session.googleState) {
    return res.redirect(`${config.clientUrl}?error=google_auth_failed`);
  }

  delete req.session.googleState;

  try {
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        code,
        redirect_uri: config.google.callbackUrl,
        grant_type: 'authorization_code',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const { access_token } = tokenRes.data;

    const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const googleUser = userRes.data;
    req.session.google = { accessToken: access_token, user: googleUser };

    // Persist user to DB and store internal UUID in session
    const userId = await db.upsertUser({
      googleId: String(googleUser.id),
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture ?? null,
    }).catch((e) => { console.error('[db] upsertUser failed:', e.message); return null; });

    if (userId) req.session.userId = userId;

    res.redirect(`${config.clientUrl}/connect`);
  } catch {
    res.redirect(`${config.clientUrl}?error=google_auth_failed`);
  }
});

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

    if (req.session.userId) {
      db.linkAccount(req.session.userId, 'github', {
        providerId: user.id ?? user.login,
        username: user.login,
        name: user.name ?? user.login,
        avatarUrl: user.avatar_url ?? null,
        accessToken,
      }).catch((e) => console.error('[db] linkAccount github failed:', e.message));
    }

    res.redirect(`${config.clientUrl}/connect`);
  } catch {
    res.redirect(`${config.clientUrl}?error=github_auth_failed`);
  }
});

// ─── Twitter OAuth 1.0a ───────────────────────────────────────────────────────

const REQUEST_TOKEN_URL = 'https://api.twitter.com/oauth/request_token';
const AUTHORIZE_URL     = 'https://api.twitter.com/oauth/authorize';
const ACCESS_TOKEN_URL  = 'https://api.twitter.com/oauth/access_token';

router.get('/twitter', async (req, res) => {
  if (!config.twitter.apiKey || !config.twitter.apiSecret) {
    console.error('[twitter auth] TWITTER_API_KEY or TWITTER_API_SECRET is not set in .env');
    return res.redirect(`${config.clientUrl}?error=twitter_not_configured`);
  }

  try {
    const auth = twitter.oauthSign({
      method: 'POST',
      url: REQUEST_TOKEN_URL,
      oauthExtra: { oauth_callback: config.twitter.callbackUrl },
    });

    const { data } = await axios.post(REQUEST_TOKEN_URL, null, {
      headers: {
        Authorization: auth,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const p = new URLSearchParams(data);
    const requestToken = p.get('oauth_token');
    const requestTokenSecret = p.get('oauth_token_secret');
    if (!requestToken) throw new Error('No request token received');

    req.session.twitterRequestToken = requestToken;
    req.session.twitterRequestTokenSecret = requestTokenSecret;

    res.redirect(`${AUTHORIZE_URL}?oauth_token=${requestToken}`);
  } catch (err) {
    console.error('[twitter auth]', err.response?.data ?? err.message);
    res.redirect(`${config.clientUrl}?error=twitter_auth_failed`);
  }
});

router.get('/twitter/callback', async (req, res) => {
  const { oauth_token, oauth_verifier, denied } = req.query;

  if (denied) return res.redirect(`${config.clientUrl}?error=twitter_auth_denied`);

  if (!oauth_token || !oauth_verifier || oauth_token !== req.session.twitterRequestToken) {
    return res.redirect(`${config.clientUrl}?error=twitter_auth_failed`);
  }

  const requestTokenSecret = req.session.twitterRequestTokenSecret;
  delete req.session.twitterRequestToken;
  delete req.session.twitterRequestTokenSecret;

  try {
    const auth = twitter.oauthSign({
      method: 'POST',
      url: ACCESS_TOKEN_URL,
      oauthExtra: { oauth_verifier: String(oauth_verifier) },
      accessToken: String(oauth_token),
      accessTokenSecret: requestTokenSecret,
    });

    const { data } = await axios.post(ACCESS_TOKEN_URL, null, {
      headers: { Authorization: auth },
    });

    const p = new URLSearchParams(data);
    const accessToken = p.get('oauth_token');
    const accessTokenSecret = p.get('oauth_token_secret');
    if (!accessToken) throw new Error('No access token received');

    const user = await twitter.getUser(accessToken, accessTokenSecret);
    req.session.twitter = { accessToken, accessTokenSecret, user };

    if (req.session.userId) {
      db.linkAccount(req.session.userId, 'twitter', {
        providerId: user.id,
        username:   user.username,
        name:       user.name,
        avatarUrl:  user.profile_image_url ?? null,
        accessToken,
        refreshToken: accessTokenSecret, // reuse refresh_token column for the secret
      }).catch((e) => console.error('[db] linkAccount twitter failed:', e.message));
    }

    res.redirect(`${config.clientUrl}/connect`);
  } catch (err) {
    console.error('[twitter callback]', err.response?.data ?? err.message);
    res.redirect(`${config.clientUrl}?error=twitter_auth_failed`);
  }
});

// ─── Status & Disconnect ──────────────────────────────────────────────────────

router.get('/status', (req, res) => {
  res.json({
    google: req.session.google?.user ?? null,
    github: req.session.github?.user ?? null,
    twitter: req.session.twitter?.user ?? null,
  });
});

router.post('/disconnect/:provider', (req, res) => {
  const { provider } = req.params;

  if (provider === 'google') {
    delete req.session.google;
    delete req.session.userId;
  } else if (provider === 'github') {
    delete req.session.github;
    if (req.session.userId) {
      db.removeAccount(req.session.userId, 'github')
        .catch((e) => console.error('[db] removeAccount github failed:', e.message));
    }
  } else if (provider === 'twitter') {
    delete req.session.twitter;
    if (req.session.userId) {
      db.removeAccount(req.session.userId, 'twitter')
        .catch((e) => console.error('[db] removeAccount twitter failed:', e.message));
    }
  } else {
    return res.status(400).json({ error: 'Unknown provider' });
  }

  res.json({ success: true });
});

// Logout clears Google identity but preserves GitHub/Twitter connections in the session.
router.post('/logout', (req, res) => {
  delete req.session.google;
  delete req.session.userId;
  res.json({ success: true });
});

module.exports = router;
