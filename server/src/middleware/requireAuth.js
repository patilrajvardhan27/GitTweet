'use strict';

/** @type {import('express').RequestHandler} */
function requireGitHub(req, res, next) {
  if (!req.session.github) {
    return res.status(401).json({ error: 'GitHub account not connected' });
  }
  next();
}

/** @type {import('express').RequestHandler} */
function requireTwitter(req, res, next) {
  if (!req.session.twitter) {
    return res.status(401).json({ error: 'Twitter account not connected' });
  }
  next();
}

module.exports = { requireGitHub, requireTwitter };
