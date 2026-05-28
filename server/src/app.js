'use strict';

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const config = require('./config');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

function buildSessionStore() {
  if (config.redisUrl) {
    try {
      const { createClient } = require('redis');
      const { RedisStore } = require('connect-redis');
      const client = createClient({ url: config.redisUrl });
      client.connect().catch((err) => {
        console.error('Redis connection failed, falling back to MemoryStore:', err.message);
      });
      return new RedisStore({ client });
    } catch {
      // redis package not available — fall through to MemoryStore
    }
  }

  if (config.isProd) {
    console.warn('WARNING: Using MemoryStore in production. Set REDIS_URL for persistent sessions.');
  } else {
    console.warn('DEV: Using MemoryStore (set REDIS_URL to use Redis)');
  }
  return undefined; // express-session defaults to MemoryStore
}

function createApp() {
  const app = express();

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });

  // CORS — restrict to CLIENT_URL only
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    }),
  );

  app.use(express.json());

  // Session
  const store = buildSessionStore();
  app.use(
    session({
      store,
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: config.isProd,
        sameSite: config.isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      },
    }),
  );

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api', apiRoutes);

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
