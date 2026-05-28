'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

/**
 * @param {{ sha: string, message: string, author: string, date: string }[]} commits
 * @param {string} repoName
 * @param {string|null} repoDescription
 * @param {string|null} context
 * @returns {Promise<string>}
 */
async function generateTweet(commits, repoName, repoDescription, context) {
  const commitLines = commits
    .map((c) => `- ${c.message} (${c.sha.slice(0, 7)})`)
    .join('\n');

  const prompt = [
    'You are a developer sharing daily progress on social media. Write one authentic, engaging tweet about today\'s GitHub commits.',
    '',
    `Project: ${repoName}`,
    repoDescription ? `Description: ${repoDescription}` : '',
    context ? `Additional context: ${context}` : '',
    '',
    "Today's commits:",
    commitLines,
    '',
    'Rules:',
    '- Maximum 255 characters (reserve space for hashtags)',
    '- Sound like a real developer, not a marketing bot',
    '- Focus on what changed — what was built, fixed, or improved',
    '- End with 2–3 relevant hashtags (choose from: #buildinpublic #indiedev #coding #devlog #opensource #webdev #100daysofcode)',
    '- Do not wrap in quotes',
    '- Do not add preamble or explanation — output only the tweet text',
  ]
    .filter((line) => line !== null)
    .join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0];
  if (text.type !== 'text') throw new Error('Unexpected response type from Claude');

  return text.text.trim();
}

module.exports = { generateTweet };
