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

/**
 * Upsert a user record based on their Google ID.
 * Returns the internal user UUID which is used as the FK everywhere else.
 */
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

/**
 * Upsert a linked account (github or twitter) for a user.
 * provider: 'github' | 'twitter'
 * providerData: { providerId, username, name, avatarUrl }
 */
async function linkAccount(userId, provider, { providerId, username, name, avatarUrl }) {
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from('user_accounts')
    .upsert(
      {
        user_id: userId,
        provider,
        provider_id: String(providerId),
        username,
        name,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' },
    );
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

// ─── Preferences ─────────────────────────────────────────────────────────────

async function getPreferences(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_preferences')
    .select('default_tone, default_repo')
    .eq('user_id', userId)
    .single();
  // PGRST116 = no rows found — not an error
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

async function upsertPreferences(userId, { defaultTone, defaultRepo }) {
  if (!supabase || !userId) return;
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: userId, default_tone: defaultTone, default_repo: defaultRepo ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  if (error) throw error;
}

module.exports = {
  isEnabled,
  upsertUser,
  linkAccount,
  removeAccount,
  saveTweet,
  getTweets,
  clearTweets,
  getPreferences,
  upsertPreferences,
};
