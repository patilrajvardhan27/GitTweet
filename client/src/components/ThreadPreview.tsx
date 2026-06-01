'use client';

import Image from 'next/image';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import type { TwitterUser } from '@/types';

interface ThreadPreviewProps {
  tweets: string[];
  onChange: (index: number, value: string) => void;
  user: TwitterUser | null;
  onPost: () => void;
  onRegenerate: () => void;
  posting: boolean;
  posted: boolean;
  postedUrl: string | null;
  includeCard: boolean;
  onToggleCard: () => void;
  cardGenerating: boolean;
  cardPreviewUrl: string | null;
  postedCardUrl: string | null;
}

const MAX = 280;
const WARN = 240;
const DANGER = 270;

function ProgressRing({ count }: { count: number }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(count / MAX, 1);
  const offset = circumference - pct * circumference;
  const color =
    count > DANGER ? 'var(--color-red)' : count > WARN ? 'var(--color-amber)' : 'var(--color-green)';

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="2.5" />
      <circle
        cx="12"
        cy="12"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 12 12)"
        style={{ transition: 'stroke-dashoffset 0.2s ease, stroke 0.2s ease' }}
      />
    </svg>
  );
}

function Avatar({ user }: { user: TwitterUser | null }) {
  if (user?.profile_image_url) {
    return (
      <Image
        src={user.profile_image_url}
        alt={user.name}
        width={36}
        height={36}
        className="rounded-full bg-bg-elevated shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center text-text-3 text-sm font-semibold shrink-0">
      {user ? user.name[0].toUpperCase() : '?'}
    </div>
  );
}

export function ThreadPreview({
  tweets,
  onChange,
  user,
  onPost,
  onRegenerate,
  posting,
  posted,
  postedUrl,
  includeCard,
  onToggleCard,
  cardGenerating,
  cardPreviewUrl,
  postedCardUrl,
}: ThreadPreviewProps) {
  const anyOverLimit = tweets.some((t) => t.length > MAX);

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
            <span className="text-green text-sm font-medium">
              Thread posted ({tweets.length} tweets)!
            </span>
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
                <img src={postedCardUrl} alt="Commit card" className="w-full rounded-lg border border-green/20" />
                <p className="text-xs text-green/70">Card attached to your thread</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-bg-surface overflow-hidden">
      {/* Thread label */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-border">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-text-3)" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="text-xs font-semibold text-text-3 uppercase tracking-widest">
          Thread — {tweets.length} tweets
        </span>
      </div>

      {/* Tweet rows */}
      {tweets.map((tweet, i) => {
        const count = tweet.length;
        const overLimit = count > MAX;
        const countColor =
          count > DANGER ? 'text-red' : count > WARN ? 'text-amber' : 'text-text-3';
        const isLast = i === tweets.length - 1;

        return (
          <div key={i} className="flex gap-3 px-4 pt-4">
            {/* Left: avatar + connecting line */}
            <div className="flex flex-col items-center" style={{ minWidth: 36 }}>
              <Avatar user={user} />
              {!isLast && <div className="w-0.5 flex-1 bg-border my-2 rounded-full" />}
            </div>

            {/* Right: name, textarea, counter */}
            <div className={`flex-1 ${isLast ? 'pb-4' : 'pb-2'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-text-1 leading-none">
                    {user?.name ?? 'Your Name'}
                  </span>
                  <span className="text-xs text-text-2">@{user?.username ?? 'yourhandle'}</span>
                </div>
                <span className="text-[10px] font-mono text-text-3">{i + 1}/{tweets.length}</span>
              </div>

              <textarea
                value={tweet}
                onChange={(e) => onChange(i, e.target.value)}
                rows={3}
                className="w-full bg-transparent text-text-1 text-sm resize-none focus:outline-none leading-relaxed placeholder:text-text-3"
                placeholder={`Tweet ${i + 1}…`}
                aria-label={`Tweet ${i + 1} of ${tweets.length}`}
              />

              <div className="flex items-center justify-end gap-1.5 mt-1">
                {overLimit && (
                  <span className="text-xs text-red font-medium">Over limit</span>
                )}
                <span className={`text-xs font-mono ${countColor}`}>{count}/{MAX}</span>
                <ProgressRing count={count} />
              </div>
            </div>
          </div>
        );
      })}

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
        {includeCard && <span className="text-xs text-text-3">(attached to first tweet)</span>}
      </div>

      {/* Card preview */}
      {includeCard && (
        <div className="mx-4 mb-3">
          {cardGenerating && (
            <div className="rounded-lg border border-border bg-bg-elevated h-32 flex items-center justify-center gap-2.5 text-text-3 text-xs">
              <Spinner size={14} />
              Generating card with AI hook…
            </div>
          )}
          {!cardGenerating && cardPreviewUrl && (
            <img src={cardPreviewUrl} alt="Commit card preview" className="w-full rounded-lg border border-border" />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onRegenerate} aria-label="Regenerate thread">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          Regenerate
        </Button>

        {user ? (
          <Button
            variant="primary"
            size="sm"
            loading={posting}
            disabled={anyOverLimit || posting}
            onClick={onPost}
          >
            Post thread to X
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

      {!user && (
        <div className="px-4 pb-4">
          <p className="text-xs text-text-2 bg-bg-elevated rounded-md px-3 py-2 border border-border">
            Connect your X account to post directly. You can still copy each tweet manually.
          </p>
        </div>
      )}
    </div>
  );
}
