'use strict';

const sharp = require('sharp');

const W = 1200;
const H = 630;

const C = {
  bg:      '#05050e',
  surface: '#0c0c1b',
  border:  '#14142a',
  dim:     '#1a1a32',
  accent:  '#4ade80',
  text1:   '#f0f0f8',
  text2:   '#8080a0',
  text3:   '#363658',
};

const TYPE_COLOR = {
  feat: '#4ade80', feature: '#4ade80', add: '#4ade80',
  fix:  '#f87171', bugfix:  '#f87171', bug: '#f87171', hotfix: '#f87171',
  chore: '#64748b', build: '#fb923c', ci: '#c084fc',
  docs: '#fbbf24', doc: '#fbbf24',
  refactor: '#a78bfa', update: '#60a5fa',
  style: '#818cf8', test: '#22d3ee', perf: '#34d399',
  remove: '#f87171', revert: '#f87171',
};

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function trunc(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function detectType(msg) {
  const m = String(msg).split('\n')[0].toLowerCase().match(/^([a-z]+)(\(.+?\))?:/);
  if (m && TYPE_COLOR[m[1]]) return m[1];
  const w = String(msg).split('\n')[0].toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, '');
  return TYPE_COLOR[w] ? w : null;
}

// Collect unique commit types for the type pills in the footer area
function commitTypePills(commits) {
  const seen = new Set();
  const out = [];
  for (const c of commits) {
    const t = detectType(c.message);
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
    if (out.length >= 4) break;
  }
  return out;
}

/**
 * @param {{ repoName: string, commits: Array<{ message: string }>, hookLine: string }} opts
 * @returns {Promise<Buffer>}
 */
async function generateCard({ repoName, commits, hookLine }) {
  const slashIdx  = repoName.indexOf('/');
  const owner     = slashIdx >= 0 ? repoName.slice(0, slashIdx + 1) : '';
  const repo      = trunc(slashIdx >= 0 ? repoName.slice(slashIdx + 1) : repoName, 22);
  const ownerStr  = trunc(owner, 18);

  const now    = new Date();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr     = `${months[now.getUTCMonth()]} ${now.getUTCDate()}, ${now.getUTCFullYear()}`;
  const countLabel  = `${commits.length} commit${commits.length !== 1 ? 's' : ''}`;

  // Break hook into two lines if needed (max ~42 chars per line)
  const hook    = trunc(hookLine || 'something just shipped', 84);
  const words   = hook.split(' ');
  let line1 = '';
  let line2 = '';
  for (const w of words) {
    if ((line1 + ' ' + w).trim().length <= 42) line1 = (line1 + ' ' + w).trim();
    else line2 = (line2 + ' ' + w).trim();
  }
  line2 = trunc(line2, 42);

  // Type pills
  const types    = commitTypePills(commits);
  const PILL_H   = 38;
  const PILL_PAD = 28;
  // Measure approximate pill width: chars * 11 + padding
  let pillX = 60;
  const pillSvg = types.map((t) => {
    const pw  = t.length * 11 + PILL_PAD * 2;
    const tc  = TYPE_COLOR[t];
    const el  = `
  <rect x="${pillX}" y="490" width="${pw}" height="${PILL_H}" rx="${PILL_H / 2}" fill="${C.dim}" stroke="${tc}" stroke-width="1.5" opacity="0.9"/>
  <text x="${pillX + pw / 2}" y="514" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold" fill="${tc}">${esc(t)}</text>`;
    pillX += pw + 12;
    return el;
  }).join('');

  const FY = H - 72;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="#0b0b1c"/>
      <stop offset="100%" stop-color="#04040c"/>
    </linearGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.2" fill="${C.border}" opacity="0.7"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)" opacity="0.35"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${C.border}" stroke-width="1"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="${W}" height="3" fill="${C.accent}"/>

  <!-- SHIPPED label -->
  <text x="60" y="64" font-family="monospace" font-size="13" letter-spacing="5" fill="${C.text3}">SHIPPED</text>

  <!-- Commit count badge (top-right) -->
  <rect x="${W - 230}" y="30" width="170" height="44" rx="22" fill="${C.surface}" stroke="${C.border}" stroke-width="1"/>
  <circle cx="${W - 209}" cy="52" r="5" fill="${C.accent}"/>
  <text x="${W - 196}" y="58" font-family="monospace" font-size="18" fill="${C.text2}">${esc(countLabel)}</text>

  <!-- Repo name -->
  <text x="60" y="145" font-family="monospace" font-size="48" font-weight="bold">
    <tspan fill="${C.text3}">${esc(ownerStr)}</tspan><tspan fill="${C.accent}">${esc(repo)}</tspan>
  </text>

  <!-- Separator -->
  <line x1="60" y1="172" x2="${W - 60}" y2="172" stroke="${C.border}" stroke-width="1.5"/>

  <!-- Hook line — big, centered, makes you want to read the tweet -->
  <text x="60" y="${line2 ? '280' : '320'}" font-family="sans-serif" font-size="62" font-weight="bold" fill="${C.text1}">${esc(line1)}</text>
  ${line2 ? `<text x="60" y="362" font-family="sans-serif" font-size="62" font-weight="bold" fill="${C.text1}">${esc(line2)}</text>` : ''}

  <!-- Accent underline on hook -->
  <rect x="60" y="${line2 ? '382' : '342'}" width="80" height="4" rx="2" fill="${C.accent}"/>

  <!-- "read the caption ↓" nudge -->
  <text x="60" y="${line2 ? '430' : '390'}" font-family="sans-serif" font-size="22" fill="${C.text3}">read the caption for details</text>

  <!-- Type pills -->
  ${pillSvg}

  <!-- Footer -->
  <line x1="0" y1="${FY}" x2="${W}" y2="${FY}" stroke="${C.border}" stroke-width="1"/>
  <rect x="0" y="${FY}" width="${W}" height="${H - FY}" fill="${C.surface}" opacity="0.85"/>
  <text x="60" y="${FY + 44}" font-family="monospace" font-size="20" fill="${C.text3}">${esc(countLabel)}  ·  ${esc(dateStr)}</text>
  <text x="${W - 60}" y="${FY + 44}" text-anchor="end" font-family="monospace" font-size="20" fill="${C.text3}">GitTweet</text>
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

module.exports = { generateCard };
