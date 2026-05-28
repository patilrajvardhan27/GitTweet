'use strict';

const config = require('../config');

/** @type {import('express').ErrorRequestHandler} */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  if (!config.isProd) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  } else if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.path}: ${message}`);
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
