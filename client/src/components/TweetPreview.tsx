'use client';

import Image from 'next/image';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
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
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(count / MAX, 1);
  const offset = circumference - pct * circumference;
  const color =
    count > DANGER ? 'var(--color-red)' : count > WARN ? 'var(--color-amber)' : 'var(--color-green)';

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="2.5" />
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 14 14)"
        style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.2s ease' }}
      />
    </svg>
  );
}

export function TweetPreview({
  tweet,
  onChange,
  user,
  onPost,
  onRegenerate,
  posting,
  posted,
  postedUrl,
  includeCard,
  onToggleCard,
  commits,
  repoName,
  cardGenerating,
  cardPreviewUrl,
  postedCardUrl,
}: TweetPreviewProps) {
  const [copied, setCopied] = useState(false);
  const count = tweet.length;
  const overLimit = count > MAX;
  const countColor =
    count > DANGER ? 'text-red' : count > WARN ? 'text-amber' : 'text-text-3';

  async function handleCopy() {
    await navigator.clipboard.writeText(tweet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (posted && postedUrl) {
    return (
      <div className="rounded-lg border border-green-border bg-green-bg overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="var(--color-green)" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green text-sm font-medium">Tweet posted!</span>
          </div>
          <a
            href={postedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            View on X →
          </a>
        </div>

        {/* Card section in success state */}
        {includeCard && (
          <div className="border-t border-green/20 px-5 py-4">
            {cardGenerating && (
              <div className="flex items-center gap-2 text-green/70 text-xs">
                <Spinner size={13} className="text-green/70" />
                Generating commit card…
              </div>
            )}
            {!cardGenerating && postedCardUrl && (
              <div className="space-y-2">
                <img
                  src={postedCardUrl}
                  alt="Commit card"
                  className="w-full rounded-lg border border-green/20"
                />
                <p className="text-xs text-green/70">Card attached to your tweet</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-bg-surface overflow-hidden">
      {/* Twitter-style card header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        {user?.profile_image_url ? (
          <Image
            src={user.profile_image_url}
            alt={user.name}
            width={40}
            height={40}
            className="rounded-full bg-bg-elevated shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center text-text-3 font-display shrink-0">
            {user ? user.name[0].toUpperCase() : '?'}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-text-1">{user?.name ?? 'Your Name'}</p>
          <p className="text-xs text-text-2">@{user?.username ?? 'yourhandle'}</p>
        </div>
        <div className="ml-auto">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-text-3)" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      </div>

      {/* Editable tweet */}
      <div className="px-4 pb-3">
        <textarea
          value={tweet}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full bg-transparent text-text-1 text-sm resize-none focus:outline-none leading-relaxed placeholder:text-text-3"
          placeholder="Your tweet will appear here…"
          aria-label="Tweet text"
        />
      </div>

      {/* Card toggle */}
      <div className="px-4 py-2.5 border-t border-border flex items-center gap-2.5">
        <button
          role="switch"
          aria-checked={includeCard}
          onClick={onToggleCard}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            includeCard ? 'bg-green' : 'bg-bg-elevated'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              includeCard ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-xs text-text-2">Generate commit card</span>
      </div>

      {/* Card preview — real server-rendered PNG */}
      {includeCard && (
        <div className="mx-4 mb-3">
          {cardGenerating && (
            <div className="rounded-lg border border-border bg-bg-elevated h-32 flex items-center justify-center gap-2.5 text-text-3 text-xs">
              <Spinner size={14} />
              Generating card with AI hook…
            </div>
          )}
          {!cardGenerating && cardPreviewUrl && (
            <img
              src={cardPreviewUrl}
              alt="Commit card preview"
              className="w-full rounded-lg border border-border"
            />
          )}
        </div>
      )}

      {/* Footer: char count + actions */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ProgressRing count={count} />
          <span className={`text-xs font-mono ${countColor}`}>
            {count} / {MAX}
          </span>
          {overLimit && (
            <Badge variant="warning">Over limit</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onRegenerate} aria-label="Regenerate tweet">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Regenerate
          </Button>

          <Button variant="ghost" size="sm" onClick={handleCopy} aria-label="Copy tweet text">
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy
              </>
            )}
          </Button>

          {user ? (
            <Button
              variant="primary"
              size="sm"
              loading={posting}
              disabled={overLimit || posting}
              onClick={onPost}
            >
              Post to X
            </Button>
          ) : (
            <a
              href="/auth/twitter"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm
                bg-blue-bg border border-blue/20 text-blue hover:border-blue/40 transition-all duration-150"
            >
              Connect X to post
            </a>
          )}
        </div>
      </div>

      {/* No-twitter banner */}
      {!user && (
        <div className="px-4 pb-4">
          <p className="text-xs text-text-2 bg-bg-elevated rounded-md px-3 py-2 border border-border">
            Connect your X account to post directly. You can still copy and paste.
          </p>
        </div>
      )}
    </div>
  );
}
