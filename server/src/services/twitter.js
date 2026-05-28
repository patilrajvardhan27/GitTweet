'use strict';

const axios = require('axios');
const config = require('../config');

const TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const TWEETS_URL = 'https://api.twitter.com/2/tweets';
const USER_URL = 'https://api.twitter.com/2/users/me';

/**
 * @param {string} accessToken
 * @returns {Promise<{ id: string, username: string, name: string, profile_image_url: string }>}
 */
async function getUser(accessToken) {
  const { data } = await axios.get(USER_URL, {
    params: { 'user.fields': 'profile_image_url,name,username' },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return {
    id: data.data.id,
    username: data.data.username,
    name: data.data.name,
    profile_image_url: data.data.profile_image_url,
  };
}

/**
 * @param {string} refreshToken
 * @returns {Promise<{ access_token: string, refresh_token: string }>}
 */
async function refreshAccessToken(refreshToken) {
  const credentials = Buffer.from(
    `${config.twitter.clientId}:${config.twitter.clientSecret}`,
  ).toString('base64');

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.twitter.clientId,
  });

  const { data } = await axios.post(TOKEN_URL, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
  });

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
  };
}

/**
 * Posts a tweet, auto-refreshing the token on 401.
 *
 * @param {string} accessToken
 * @param {string|null} refreshToken
 * @param {string} text
 * @param {(tokens: { access_token: string, refresh_token: string }) => void} onTokenRefresh  callback to persist refreshed tokens
 * @returns {Promise<{ id: string, text: string }>}
 */
async function postTweet(accessToken, refreshToken, text, onTokenRefresh) {
  async function attempt(token) {
    const { data } = await axios.post(
      TWEETS_URL,
      { text },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    return data.data;
  }

  try {
    return await attempt(accessToken);
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 && refreshToken) {
      const tokens = await refreshAccessToken(refreshToken);
      if (onTokenRefresh) onTokenRefresh(tokens);
      return await attempt(tokens.access_token);
    }
    const message = err.response?.data?.detail ?? err.message;
    throw new Error(`Twitter API error: ${message}`);
  }
}

module.exports = { getUser, postTweet, refreshAccessToken };
