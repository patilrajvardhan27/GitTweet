'use client';

import type { Commit } from '@/types';

interface CommitListProps {
  commits: Commit[];
  selected: Set<string>;
  onToggle: (sha: string) => void;
  onToggleAll: () => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function CheckIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CommitList({ commits, selected, onToggle, onToggleAll }: CommitListProps) {
  if (commits.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-bg-elevated border border-border mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-3" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M3 12h3m12 0h3M12 3v3m0 12v3" />
          </svg>
        </div>
        <p className="text-text-3 text-sm">No commits in this date range.</p>
      </div>
    );
  }

  const allSelected = selected.size === commits.length;
  const someSelected = selected.size > 0 && !allSelected;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-2">
            {selected.size} of {commits.length} selected
          </span>
          {someSelected && (
            <span className="w-1 h-1 rounded-full bg-green inline-block" />
          )}
        </div>
        <button
          onClick={onToggleAll}
          className="text-xs text-text-3 hover:text-text-1 transition-colors duration-150 font-medium"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Commit rows */}
      <ul role="list" className="space-y-0.5">
        {commits.map((commit) => {
          const isSelected = selected.has(commit.sha);
          return (
            <li
              key={commit.sha}
              onClick={() => onToggle(commit.sha)}
              className={[
                'group relative flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer',
                'transition-all duration-150 border',
                isSelected
                  ? 'bg-green/[0.06] border-green/20'
                  : 'border-transparent hover:bg-bg-elevated hover:border-border',
              ].join(' ')}
              role="checkbox"
              aria-checked={isSelected}
            >
              {/* Left accent bar */}
              <span
                className={[
                  'absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-all duration-150',
                  isSelected ? 'bg-green' : 'bg-transparent',
                ].join(' ')}
                aria-hidden="true"
              />

              {/* Custom checkbox */}
              <span
                className={[
                  'mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0',
                  'border transition-all duration-150',
                  isSelected
                    ? 'bg-green border-green text-bg-base'
                    : 'border-border-hover bg-bg-base group-hover:border-border-hover',
                ].join(' ')}
                aria-hidden="true"
              >
                {isSelected && <CheckIcon />}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className={[
                  'text-sm leading-snug truncate transition-colors duration-150',
                  isSelected ? 'text-text-1' : 'text-text-2 group-hover:text-text-1',
                ].join(' ')}>
                  {commit.message}
                </p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <code className="text-[10px] text-text-3 bg-bg-elevated border border-border px-1.5 py-0.5 rounded font-mono">
                    {commit.sha.slice(0, 7)}
                  </code>
                  <span className="text-text-3 text-[10px]">·</span>
                  <span className="text-[11px] text-text-3">{commit.author}</span>
                  <span className="text-text-3 text-[10px]">·</span>
                  <span className="text-[11px] text-text-3">{formatTime(commit.date)}</span>
                </div>
              </div>

              {/* Hidden native input for accessibility */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(commit.sha)}
                onClick={(e) => e.stopPropagation()}
                className="sr-only"
                aria-label={`Select commit: ${commit.message}`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
