'use strict';

const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

let supabase = null;

if (config.supabase.url && config.supabase.serviceRoleKey) {
  supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function isEnabled() {
  return !!supabase;
}

// ─── Users ────────────────────────────────────────────────────────────────────

async function upsertUser({ googleId, email, name, picture }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { google_id: googleId, email, name, picture, last_seen_at: new Date().toISOString() },
      { onConflict: 'google_id' },
    )
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// ─── User Accounts ────────────────────────────────────────────────────────────

async function linkAccount(userId, provider, { providerId, username, name, avatarUrl, accessToken, refreshToken }) {
  if (!supabase || !userId) return;
  const row = {
    user_id: userId,
    provider,
    provider_id: String(providerId),
    username,
    name,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  };
  if (accessToken !== undefined) row.access_token = accessToken;
  if (refreshToken !== undefined) row.refresh_token = refreshToken;

  const { error } = await supabase
    .from('user_accounts')
    .upsert(row, { onConflict: 'user_id,provider' });
  if (error) throw error;
}

async function updateToken(userId, provider, accessToken, refreshToken) {
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from('user_accounts')
    .update({ access_token: accessToken, refresh_token: refreshToken, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', provider);
  if (error) throw error;
}

async function removeAccount(userId, provider) {
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from('user_accounts')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
  if (error) throw error;
}

// ─── Tweets ───────────────────────────────────────────────────────────────────

async function saveTweet({ userId, githubLogin, text, tweetUrl, repo, tone }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('tweets')
    .insert({ user_id: userId ?? null, github_login: githubLogin ?? null, text, tweet_url: tweetUrl, repo, tone })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getTweets(userId, limit = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('tweets')
    .select('id, text, tweet_url, repo, tone, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

async function clearTweets(userId) {
  if (!supabase) return;
  const { error } = await supabase
    .from('tweets')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

async function hasTweetedTodayForRepo(userId, repo) {
  if (!supabase) return false;
  const since = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('tweets')
    .select('id')
    .eq('user_id', userId)
    .eq('repo', repo)
    .gte('created_at', since)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// ─── Preferences ─────────────────────────────────────────────────────────────

async function getPreferences(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_preferences')
    .select('default_tone, default_repo, auto_post_enabled, auto_post_repos, auto_post_tone, auto_post_hour, auto_post_minute')
    .eq('user_id', userId)
    .single();
  // PGRST116 = no rows; 42703 / PGRST204 = schema cache not yet refreshed after migration
  if (error && error.code !== 'PGRST116' && error.code !== '42703' && error.code !== 'PGRST204') throw error;
  if (error) return null;
  return data ?? null;
}

async function upsertPreferences(userId, { defaultTone, defaultRepo, autoPostEnabled, autoPostRepos, autoPostTone, autoPostHour, autoPostMinute } = {}) {
  if (!supabase || !userId) return;
  const row = { user_id: userId, updated_at: new Date().toISOString() };
  if (defaultTone !== undefined) row.default_tone = defaultTone;
  if (defaultRepo !== undefined) row.default_repo = defaultRepo ?? null;
  if (autoPostEnabled !== undefined) row.auto_post_enabled = autoPostEnabled;
  if (autoPostRepos !== undefined) row.auto_post_repos = autoPostRepos;
  if (autoPostTone !== undefined) row.auto_post_tone = autoPostTone;
  if (autoPostHour !== undefined) row.auto_post_hour = autoPostHour;
  if (autoPostMinute !== undefined) row.auto_post_minute = autoPostMinute;

  const { error } = await supabase
    .from('user_preferences')
    .upsert(row, { onConflict: 'user_id' });
  // Ignore schema-cache errors — table needs migration
  if (error && error.code !== '42703' && error.code !== 'PGRST204') throw error;
  if (error) console.warn('[db] upsertPreferences schema error — run DB migration:', error.message);
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

async function getAutoPostUsers(currentUTCHour, currentUTCMinute) {
  if (!supabase) return [];

  const { data: prefs, error: prefErr } = await supabase
    .from('user_preferences')
    .select('user_id, auto_post_repos, auto_post_tone')
    .eq('auto_post_enabled', true)
    .eq('auto_post_hour', currentUTCHour)
    .eq('auto_post_minute', currentUTCMinute);

  if (prefErr) throw prefErr;
  if (!prefs?.length) return [];

  const userIds = prefs.map((p) => p.user_id);

  const [{ data: ghAccounts, error: ghErr }, { data: twAccounts, error: twErr }] = await Promise.all([
    supabase
      .from('user_accounts')
      .select('user_id, access_token')
      .eq('provider', 'github')
      .in('user_id', userIds)
      .not('access_token', 'is', null),
    supabase
      .from('user_accounts')
      .select('user_id, access_token, refresh_token')
      .eq('provider', 'twitter')
      .in('user_id', userIds)
      .not('access_token', 'is', null),
  ]);

  if (ghErr) throw ghErr;
  if (twErr) throw twErr;

  const ghMap = Object.fromEntries((ghAccounts ?? []).map((a) => [a.user_id, a.access_token]));
  const twMap = Object.fromEntries(
    (twAccounts ?? []).map((a) => [a.user_id, { access: a.access_token, refresh: a.refresh_token }]),
  );

  return prefs
    .filter((p) => p.auto_post_repos?.length && ghMap[p.user_id] && twMap[p.user_id])
    .map((p) => ({
      userId: p.user_id,
      repos: p.auto_post_repos,
      tone: p.auto_post_tone ?? 'default',
      githubToken: ghMap[p.user_id],
      twitterAccessToken: twMap[p.user_id].access,
      twitterRefreshToken: twMap[p.user_id].refresh,
    }));
}

module.exports = {
  isEnabled,
  upsertUser,
  linkAccount,
  updateToken,
  removeAccount,
  saveTweet,
  getTweets,
  clearTweets,
  hasTweetedTodayForRepo,
  getPreferences,
  upsertPreferences,
  getAutoPostUsers,
};
