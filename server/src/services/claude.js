'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

const TONE_RULES = {
  casual: 'Write in a casual, friendly tone — contractions welcome, like chatting with a dev friend.',
  technical: 'Write in a precise, technical tone — mention specific patterns, tools, or approaches used.',
  motivational: 'Write in an uplifting, motivational tone — celebrate the win and inspire others building in public.',
  default: 'Sound like a real developer, not a marketing bot.',
};

/**
 * @param {{ sha: string, message: string, author: string, date: string }[]} commits
 * @param {string} repoName
 * @param {string|null} repoDescription
 * @param {string|null} context
 * @param {'default'|'casual'|'technical'|'motivational'} [tone]
 * @returns {Promise<string>}
 */
async function generateTweet(commits, repoName, repoDescription, context, tone = 'default') {
  const commitLines = commits
    .map((c) => `- ${c.message} (${c.sha.slice(0, 7)})`)
    .join('\n');

  const toneRule = TONE_RULES[tone] ?? TONE_RULES.default;

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
    `- ${toneRule}`,
    '- Focus on what changed — what was built, fixed, or improved',
    '- End with 2–3 relevant hashtags (choose from: #buildinpublic #indiedev #coding #devlog #opensource #webdev #100daysofcode)',
    '- Do not use em dashes (—); use a comma, colon, or rephrase instead',
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

/**
 * Generates a short, punchy hook line for the commit card image.
 * The hook teases what shipped without giving details — makes people read the tweet.
 *
 * @param {{ message: string }[]} commits
 * @param {string} repoName
 * @returns {Promise<string>}
 */
async function generateCardHook(commits, repoName) {
  const commitLines = commits.map((c) => `- ${c.message.split('\n')[0]}`).join('\n');

  const prompt = [
    'You are writing a one-line teaser for a developer\'s commit card image that gets posted to X (Twitter).',
    'The hook should make someone stop scrolling and want to read the tweet caption for details.',
    '',
    `Project: ${repoName}`,
    'Commits:',
    commitLines,
    '',
    'Rules:',
    '- Output exactly ONE line, no punctuation at the end',
    '- Maximum 60 characters',
    '- Be intriguing, punchy, or bold — NOT a summary of what was done',
    '- Do not list features. Do not say "I added X". Tease the reader.',
    '- Examples of good hooks: "something big just landed", "the bug that shouldn\'t exist", "faster than yesterday", "this one took a while"',
    '- Output only the hook text, nothing else',
  ].join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 60,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0];
  if (text.type !== 'text') throw new Error('Unexpected response type from Claude');
  return text.text.trim().replace(/^["']|["']$/g, '');
}

module.exports = { generateTweet, generateCardHook };
