'use client';

import { useState } from 'react';
import type { TweetHistoryItem, TweetTone } from '@/types';

const TONE_LABELS: Record<TweetTone, string> = {
  default: 'Default',
  casual: 'Casual',
  technical: 'Technical',
  motivational: 'Motivational',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
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
      <button
        id="history-heading"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left py-2 group"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-text-2 group-hover:text-text-1 transition-colors duration-150 flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Tweet history
        </span>
        <span className="text-xs text-text-3 font-mono">{items.length}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-bg-surface p-4 space-y-2"
            >
              <p className="text-sm text-text-1 leading-relaxed line-clamp-3">{item.text}</p>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-text-3 truncate">{item.repo}</span>
                  <span className="text-text-3 text-xs">·</span>
                  <span className="text-xs text-text-3 shrink-0">{formatDate(item.date)}</span>
                  {item.tone !== 'default' && (
                    <>
                      <span className="text-text-3 text-xs">·</span>
                      <span className="text-xs text-text-3 shrink-0">{TONE_LABELS[item.tone]}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(item.id, item.text)}
                    className="text-xs text-text-3 hover:text-text-2 transition-colors duration-150"
                    aria-label="Copy tweet text"
                  >
                    {copied === item.id ? 'Copied' : 'Copy'}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-text-3 hover:text-text-2 transition-colors duration-150"
                  >
                    View →
                  </a>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={onClear}
            className="text-xs text-text-3 hover:text-red transition-colors duration-150 pt-1"
          >
            Clear history
          </button>
        </div>
      )}
    </section>
  );
}
