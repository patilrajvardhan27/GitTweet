'use strict';

const cron = require('node-cron');
const db = require('./supabase');
const github = require('./github');
const twitter = require('./twitter');
const claude = require('./claude');

async function runAutoPost() {
  const currentUTCHour = new Date().getUTCHours();
  let users;
  try {
    users = await db.getAutoPostUsers(currentUTCHour);
  } catch (err) {
    console.error('[scheduler] Failed to fetch auto-post users:', err.message);
    return;
  }

  if (!users.length) return;
  console.log(`[scheduler] Running auto-post for ${users.length} user(s) at UTC hour ${currentUTCHour}`);

  for (const user of users) {
    for (const repo of user.repos) {
      try {
        const alreadyPosted = await db.hasTweetedTodayForRepo(user.userId, repo);
        if (alreadyPosted) {
          console.log(`[scheduler] Skipping ${repo} for user ${user.userId} — already tweeted today`);
          continue;
        }

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { commits, repo: repoMeta } = await github.getCommits(user.githubToken, repo, since);
        if (!commits.length) {
          console.log(`[scheduler] No commits in last 24h for ${repo}`);
          continue;
        }

        const tweetText = await claude.generateTweet(
          commits,
          repoMeta.name,
          repoMeta.description,
          null,
          user.tone,
        );

        const result = await twitter.postTweet(
          user.twitterAccessToken,
          user.twitterRefreshToken,
          tweetText,
          async (tokens) => {
            await db.updateToken(user.userId, 'twitter', tokens.access_token, tokens.refresh_token);
          },
        );

        const tweetUrl = `https://twitter.com/i/web/status/${result.id}`;
        await db.saveTweet({
          userId: user.userId,
          githubLogin: null,
          text: tweetText,
          tweetUrl,
          repo,
          tone: user.tone,
        });

        console.log(`[scheduler] Posted tweet for user ${user.userId}, repo ${repo}: ${tweetUrl}`);
      } catch (err) {
        console.error(`[scheduler] Failed for user ${user.userId}, repo ${repo}:`, err.message);
      }
    }
  }
}

function startScheduler() {
  // Runs at the top of every hour
  cron.schedule('0 * * * *', () => {
    runAutoPost().catch((err) => console.error('[scheduler] Unhandled error:', err.message));
  });
  console.log('[scheduler] Auto-post scheduler started (runs hourly)');
}

module.exports = { startScheduler, runAutoPost };
