'use client';

import { useState } from 'react';
import type { TweetHistoryItem, TweetTone } from '@/types';

const TONE_COLORS: Record<TweetTone, string> = {
  default:      'text-text-3 bg-bg-elevated border-border',
  casual:       'text-blue bg-blue-bg border-blue/20',
  technical:    'text-amber bg-amber-bg border-amber/20',
  motivational: 'text-green bg-green-bg border-green-border',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface TweetHistoryProps {
  items: TweetHistoryItem[];
  onClear: () => void;
}

export function TweetHistory({ items, onClear }: TweetHistoryProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (items.length === 0) return null;

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section aria-labelledby="history-heading">
      {/* Collapse toggle */}
      <button
        id="history-heading"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left py-2 group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <svg
            width="13"
            height="13"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`text-text-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          >
            <path fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-text-2 group-hover:text-text-1 transition-colors duration-150">
            Tweet history
          </span>
          <span className="text-[10px] font-mono text-text-3 bg-bg-elevated border border-border px-1.5 py-0.5 rounded">
            {items.length}
          </span>
        </div>
      </button>

      {open && (
        <div className="mt-1 animate-fade-up">
          {/* Timeline */}
          <div className="relative pl-4">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-1 bottom-6 w-px bg-border" aria-hidden="true" />

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline dot */}
                  <span className="absolute -left-[13px] top-3.5 w-2 h-2 rounded-full bg-bg-elevated border border-border-hover group-hover:border-green/50 transition-colors duration-150" aria-hidden="true" />

                  <div className="rounded-xl border border-border bg-bg-surface p-4 space-y-2.5 hover:border-border-hover transition-all duration-150 card-elevated">
                    {/* Tweet text */}
                    <p className="text-sm text-text-1 leading-relaxed line-clamp-2">{item.text}</p>

                    {/* Meta row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {/* Repo chip */}
                        <span className="text-[10px] font-mono text-text-2 bg-bg-elevated border border-border px-1.5 py-0.5 rounded truncate max-w-[120px]">
                          {item.repo.split('/')[1] ?? item.repo}
                        </span>
                        {/* Date */}
                        <span className="text-[10px] text-text-3">{formatDate(item.date)}</span>
                        {/* Tone */}
                        {item.tone !== 'default' && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TONE_COLORS[item.tone]}`}>
                            {item.tone}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => handleCopy(item.id, item.text)}
                          className="text-[11px] text-text-3 hover:text-text-1 transition-colors duration-150 font-medium"
                          aria-label="Copy tweet text"
                        >
                          {copied === item.id ? (
                            <span className="text-green">Copied</span>
                          ) : 'Copy'}
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-text-3 hover:text-text-1 transition-colors duration-150 flex items-center gap-0.5"
                        >
                          View
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                            <path d="M2 8L8 2M4 2h4v4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClear}
              className="mt-3 text-[11px] text-text-3 hover:text-red transition-colors duration-150 font-medium"
            >
              Clear history
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
