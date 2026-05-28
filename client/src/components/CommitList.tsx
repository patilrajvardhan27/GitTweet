'use client';

import { Badge } from './ui/Badge';
import type { Commit } from '@/types';

interface CommitListProps {
  commits: Commit[];
  selected: Set<string>;
  onToggle: (sha: string) => void;
  onToggleAll: () => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function CommitList({ commits, selected, onToggle, onToggleAll }: CommitListProps) {
  if (commits.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-bg-surface px-5 py-8 text-center">
        <p className="text-text-3 text-sm">No commits found today for this repository.</p>
      </div>
    );
  }

  const allSelected = selected.size === commits.length;

  return (
    <div className="rounded-lg border border-border bg-bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-1">Today&apos;s commits</span>
          <Badge variant={selected.size > 0 ? 'blue' : 'neutral'}>
            {selected.size} of {commits.length} selected
          </Badge>
        </div>
        <button
          onClick={onToggleAll}
          className="text-xs text-text-2 hover:text-text-1 transition-colors duration-150"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Commit rows */}
      <ul role="list">
        {commits.map((commit, i) => (
          <li
            key={commit.sha}
            className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-150
              hover:bg-bg-elevated
              ${i < commits.length - 1 ? 'border-b border-border' : ''}
              ${selected.has(commit.sha) ? 'bg-blue-bg' : ''}
            `}
            onClick={() => onToggle(commit.sha)}
          >
            <input
              type="checkbox"
              checked={selected.has(commit.sha)}
              onChange={() => onToggle(commit.sha)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 shrink-0 accent-[var(--color-blue)]"
              aria-label={`Select commit: ${commit.message}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-1 leading-snug truncate">{commit.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="sha text-xs text-text-3">{commit.sha.slice(0, 7)}</span>
                <span className="text-text-3 text-xs">·</span>
                <span className="text-xs text-text-2">{commit.author}</span>
                <span className="text-text-3 text-xs">·</span>
                <span className="text-xs text-text-3">{formatTime(commit.date)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
