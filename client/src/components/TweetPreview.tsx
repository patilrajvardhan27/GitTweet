'use client';

import Image from 'next/image';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { useState } from 'react';
import type { TwitterUser, Commit } from '@/types';

interface TweetPreviewProps {
  tweet: string;
  onChange: (value: string) => void;
  user: TwitterUser | null;
  onPost: () => void;
  onRegenerate: () => void;
  posting: boolean;
  posted: boolean;
  postedUrl: string | null;
  includeCard: boolean;
  onToggleCard: () => void;
  commits: Commit[];
  repoName: string;
  cardGenerating: boolean;
  cardPreviewUrl: string | null;
  postedCardUrl: string | null;
}

const MAX = 280;
const WARN = 240;
const DANGER = 270;

function ProgressRing({ count }: { count: number }) {
  const radius = 11;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(count / MAX, 1);
  const offset = circumference - pct * circumference;
  const isOver = count > MAX;
  const color =
    isOver ? 'var(--color-red)' : count > DANGER ? 'var(--color-red)' : count > WARN ? 'var(--color-amber)' : 'var(--color-green)';

  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r={radius} fill="none" stroke="var(--color-border-hover)" strokeWidth="2.5" />
      <circle
        cx="15" cy="15" r={radius}
        fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 15 15)"
        style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.15s ease' }}
      />
      {/* Overflow: show remaining count */}
      {isOver && (
        <text x="15" y="19" textAnchor="middle" fontSize="7" fill="var(--color-red)" fontFamily="monospace">
          -{count - MAX}
        </text>
      )}
    </svg>
  );
}

export function TweetPreview({
  tweet, onChange, user, onPost, onRegenerate,
  posting, posted, postedUrl,
  includeCard, onToggleCard, commits, repoName,
  cardGenerating, cardPreviewUrl, postedCardUrl,
}: TweetPreviewProps) {
  const [copied, setCopied] = useState(false);
  const count = tweet.length;
  const overLimit = count > MAX;
  const remaining = MAX - count;
  const countColor = count > DANGER ? 'text-red' : count > WARN ? 'text-amber' : 'text-text-3';

  async function handleCopy() {
    await navigator.clipboard.writeText(tweet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── Success state ─────────────────────────────────────────────────────── */
  if (posted && postedUrl) {
    return (
      <div className="rounded-xl border border-green-border bg-green/[0.05] overflow-hidden animate-fade-in">
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green/10 border border-green-border flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--color-green)" aria-hidden="true">
              <path fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green">Tweet posted!</p>
            <p className="text-xs text-green/60 mt-0.5">Your update is live on X</p>
          </div>
          <a
            href={postedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-green/80 hover:text-green font-medium
              px-3 py-1.5 rounded-lg border border-green/20 hover:border-green/40 bg-green/5
              transition-all duration-150"
          >
            View on X
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2 8L8 2M4 2h4v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {includeCard && (
          <div className="border-t border-green/15 px-5 py-4">
            {cardGenerating ? (
              <div className="flex items-center gap-2 text-green/60 text-xs">
                <Spinner size={12} className="text-green/60" />
                Generating commit card…
              </div>
            ) : postedCardUrl ? (
              <div className="space-y-2">
                <img src={postedCardUrl} alt="Commit card" className="w-full rounded-lg border border-green/15" />
                <p className="text-xs text-green/50">Card attached to your tweet</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  /* ── Compose state ─────────────────────────────────────────────────────── */
  return (
    <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
      {/* Tweet composer header */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3 border-b border-border">
        {user?.profile_image_url ? (
          <Image src={user.profile_image_url} alt={user.name} width={42} height={42}
            className="rounded-full ring-1 ring-white/10 shrink-0 mt-0.5" />
        ) : (
          <div className="w-[42px] h-[42px] rounded-full bg-bg-elevated ring-1 ring-border
            flex items-center justify-center text-text-2 font-display font-bold shrink-0 mt-0.5">
            {user ? user.name[0].toUpperCase() : '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-text-1 leading-tight">{user?.name ?? 'Your Name'}</span>
            <span className="text-xs text-text-3 font-mono">@{user?.username ?? 'yourhandle'}</span>
          </div>
          {/* Editable tweet */}
          <textarea
            value={tweet}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full bg-transparent text-text-1 text-[15px] resize-none focus:outline-none leading-relaxed placeholder:text-text-3"
            placeholder="What did you ship today?"
            aria-label="Tweet text"
          />
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-text-3)" className="shrink-0 mt-1" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* Card toggle */}
      <div className="px-4 py-2.5 flex items-center gap-2.5 border-b border-border">
        <button
          role="switch"
          aria-checked={includeCard}
          onClick={onToggleCard}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            includeCard ? 'bg-green' : 'bg-bg-elevated border border-border'
          }`}
        >
          <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            includeCard ? 'translate-x-4' : 'translate-x-0'
          }`} />
        </button>
        <span className="text-xs text-text-2">Commit card</span>
        {includeCard && (
          <span className="text-[10px] text-text-3">(AI-generated image)</span>
        )}
      </div>

      {/* Card preview */}
      {includeCard && (
        <div className="mx-4 my-3">
          {cardGenerating ? (
            <div className="rounded-xl border border-border bg-bg-elevated h-28 flex items-center justify-center gap-2.5 text-text-3 text-xs">
              <Spinner size={14} />
              Generating card…
            </div>
          ) : cardPreviewUrl ? (
            <img src={cardPreviewUrl} alt="Commit card preview"
              className="w-full rounded-xl border border-border animate-fade-in" />
          ) : null}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {/* Char count */}
        <div className="flex items-center gap-2">
          <ProgressRing count={count} />
          <span className={`text-xs font-mono tabular-nums ${countColor}`}>
            {overLimit ? `-${count - MAX}` : remaining}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={onRegenerate} aria-label="Regenerate tweet">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Regenerate
          </Button>

          <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Copy tweet text">
            {copied ? (
              <><svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg> Copied</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg> Copy</>
            )}
          </Button>

          {user ? (
            <Button variant="primary" size="sm" loading={posting} disabled={overLimit || posting} onClick={onPost}>
              Post to X
            </Button>
          ) : (
            <a href="/auth/twitter"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                bg-[#1d9bf0]/10 border border-[#1d9bf0]/25 text-[#1d9bf0]
                hover:border-[#1d9bf0]/50 hover:bg-[#1d9bf0]/15 transition-all duration-150">
              Connect X
            </a>
          )}
        </div>
      </div>

      {!user && (
        <div className="px-4 pb-4">
          <p className="text-xs text-text-3 bg-bg-elevated rounded-lg px-3 py-2.5 border border-border">
            Connect X to post directly — or copy the text above.
          </p>
        </div>
      )}
    </div>
  );
}
