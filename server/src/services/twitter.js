'use strict';

const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');

const TWEETS_URL      = 'https://api.twitter.com/2/tweets';
const USER_URL        = 'https://api.twitter.com/2/users/me';
const MEDIA_UPLOAD_URL = 'https://upload.twitter.com/1.1/media/upload.json';

// ─── OAuth 1.0a Signing ───────────────────────────────────────────────────────

// RFC 3986 percent-encoding (stricter than encodeURIComponent)
function pct(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

/**
 * Builds an OAuth 1.0a Authorization header.
 *
 * @param {{ method: string, url: string, queryParams?: object, oauthExtra?: object, accessToken?: string, accessTokenSecret?: string }} opts
 * @returns {string}
 */
function oauthSign({ method, url, queryParams = {}, oauthExtra = {}, accessToken = '', accessTokenSecret = '' }) {
  const base = {
    oauth_consumer_key:     config.twitter.apiKey,
    oauth_nonce:            crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        String(Math.floor(Date.now() / 1000)),
    oauth_version:          '1.0',
    ...oauthExtra,
  };
  if (accessToken) base.oauth_token = accessToken;

  // Signature base string includes query params + oauth params
  const allParams = { ...queryParams, ...base };
  const paramStr = Object.keys(allParams)
    .sort()
    .map(k => `${pct(k)}=${pct(allParams[k])}`)
    .join('&');

  const sigBase = `${method.toUpperCase()}&${pct(url)}&${pct(paramStr)}`;
  const sigKey  = `${pct(config.twitter.apiSecret)}&${pct(accessTokenSecret)}`;
  base.oauth_signature = crypto.createHmac('sha1', sigKey).update(sigBase).digest('base64');

  const header = Object.keys(base)
    .sort()
    .map(k => `${pct(k)}="${pct(base[k])}"`)
    .join(', ');

  return `OAuth ${header}`;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * @param {string} accessToken
 * @param {string} accessTokenSecret
 * @returns {Promise<{ id: string, username: string, name: string, profile_image_url: string }>}
 */
async function getUser(accessToken, accessTokenSecret) {
  const queryParams = { 'user.fields': 'profile_image_url,name,username' };
  const auth = oauthSign({ method: 'GET', url: USER_URL, queryParams, accessToken, accessTokenSecret });
  const { data } = await axios.get(USER_URL, {
    params: queryParams,
    headers: { Authorization: auth },
  });
  return {
    id:                data.data.id,
    username:          data.data.username,
    name:              data.data.name,
    profile_image_url: data.data.profile_image_url,
  };
}

/**
 * Uploads an image buffer via OAuth 1.0a.
 *
 * @param {string} accessToken
 * @param {string} accessTokenSecret
 * @param {Buffer} imageBuffer
 * @returns {Promise<string>} media_id_string
 */
async function uploadMedia(accessToken, accessTokenSecret, imageBuffer) {
  const auth = oauthSign({ method: 'POST', url: MEDIA_UPLOAD_URL, accessToken, accessTokenSecret });
  const form = new FormData();
  form.append('media', imageBuffer, { filename: 'card.png', contentType: 'image/png' });

  try {
    const { data } = await axios.post(MEDIA_UPLOAD_URL, form, {
      headers: { Authorization: auth, ...form.getHeaders() },
    });
    return data.media_id_string;
  } catch (err) {
    const status  = err.response?.status;
    const detail  = JSON.stringify(err.response?.data ?? err.message);
    throw new Error(`Twitter media upload failed (HTTP ${status}): ${detail}`);
  }
}

/**
 * Posts a tweet with optional media attachment.
 *
 * @param {string} accessToken
 * @param {string} accessTokenSecret
 * @param {string} text
 * @param {string|null} [mediaId]
 * @returns {Promise<{ id: string, text: string }>}
 */
async function postTweet(accessToken, accessTokenSecret, text, mediaId = null) {
  const auth = oauthSign({ method: 'POST', url: TWEETS_URL, accessToken, accessTokenSecret });
  const body = { text };
  if (mediaId) body.media = { media_ids: [mediaId] };

  try {
    const { data } = await axios.post(TWEETS_URL, body, {
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
    });
    return data.data;
  } catch (err) {
    const message = err.response?.data?.detail ?? err.message;
    throw new Error(`Twitter API error: ${message}`);
  }
}

/**
 * Posts a thread by chaining each tweet as a reply to the previous one.
 *
 * @param {string} accessToken
 * @param {string} accessTokenSecret
 * @param {string[]} tweets
 * @param {string|null} [firstMediaId] - optional media attachment for the first tweet
 * @returns {Promise<{ ids: string[], firstId: string }>}
 */
async function postThread(accessToken, accessTokenSecret, tweets, firstMediaId = null) {
  const ids = [];
  let replyToId = null;

  for (let i = 0; i < tweets.length; i++) {
    const auth = oauthSign({ method: 'POST', url: TWEETS_URL, accessToken, accessTokenSecret });
    const body = { text: tweets[i] };
    if (i === 0 && firstMediaId) body.media = { media_ids: [firstMediaId] };
    if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };

    try {
      const { data } = await axios.post(TWEETS_URL, body, {
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
      });
      replyToId = data.data.id;
      ids.push(data.data.id);
    } catch (err) {
      const message = err.response?.data?.detail ?? err.message;
      throw new Error(`Twitter API error on tweet ${i + 1}: ${message}`);
    }
  }

  return { ids, firstId: ids[0] };
}

module.exports = { oauthSign, getUser, uploadMedia, postTweet, postThread };
