'use strict';

require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const required = [
  'SESSION_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'TWITTER_CLIENT_ID',
  'TWITTER_CLIENT_SECRET',
  'ANTHROPIC_API_KEY',
  'CLIENT_URL',
  'SERVER_URL',
];

if (isProd) {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const config = {
  isProd,
  port: parseInt(process.env.PORT ?? '3001', 10),
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    callbackUrl: `${process.env.SERVER_URL ?? 'http://localhost:3001'}/auth/github/callback`,
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID ?? '',
    clientSecret: process.env.TWITTER_CLIENT_SECRET ?? '',
    callbackUrl: `${process.env.SERVER_URL ?? 'http://localhost:3001'}/auth/twitter/callback`,
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  },
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000',
  serverUrl: process.env.SERVER_URL ?? 'http://localhost:3001',
  redisUrl: process.env.REDIS_URL,
};

module.exports = config;
