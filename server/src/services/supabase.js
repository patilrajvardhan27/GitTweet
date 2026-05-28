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

async function saveTweet({ githubLogin, text, tweetUrl, repo, tone }) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('tweets')
    .insert({ github_login: githubLogin, text, tweet_url: tweetUrl, repo, tone })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getTweets(githubLogin, limit = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('tweets')
    .select('id, text, tweet_url, repo, tone, created_at')
    .eq('github_login', githubLogin)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

async function clearTweets(githubLogin) {
  if (!supabase) return;
  const { error } = await supabase
    .from('tweets')
    .delete()
    .eq('github_login', githubLogin);
  if (error) throw error;
}

async function getPreferences(githubLogin) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_preferences')
    .select('default_tone, default_repo')
    .eq('github_login', githubLogin)
    .single();
  // PGRST116 = no rows found — not an error
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

async function upsertPreferences(githubLogin, { defaultTone, defaultRepo }) {
  if (!supabase) return;
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { github_login: githubLogin, default_tone: defaultTone, default_repo: defaultRepo ?? null },
      { onConflict: 'github_login' },
    );
  if (error) throw error;
}

module.exports = { isEnabled, saveTweet, getTweets, clearTweets, getPreferences, upsertPreferences };
