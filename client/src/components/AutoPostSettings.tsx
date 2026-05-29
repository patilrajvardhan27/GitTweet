'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { Repo, TweetTone, AutoPostPreferences } from '@/types';

const TONES: { value: TweetTone; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'motivational', label: 'Motivational' },
];

const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
const tzOffset = -new Date().getTimezoneOffset() / 60;

function utcToLocal(utcHour: number): number {
  return ((utcHour + tzOffset) % 24 + 24) % 24;
}

function localToUtc(localHour: number): number {
  return ((localHour - tzOffset) % 24 + 24) % 24;
}

const LOCAL_HOURS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i < 12 ? 'AM' : 'PM';
  const h = i % 12 === 0 ? 12 : i % 12;
  return { localHour: i, label: `${String(h).padStart(2, '0')}:00 ${ampm}` };
});

interface Props {
  repos: Repo[];
  initial: AutoPostPreferences;
}

export function AutoPostSettings({ repos, initial }: Props) {
  const [enabled, setEnabled] = useState(initial.autoPostEnabled);
  const [selectedRepos, setSelectedRepos] = useState<string[]>(initial.autoPostRepos);
  const [tone, setTone] = useState<TweetTone>(initial.autoPostTone);
  const [localHour, setLocalHour] = useState(() => utcToLocal(initial.autoPostHour));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRepo(fullName: string) {
    setSelectedRepos((prev) =>
      prev.includes(fullName) ? prev.filter((r) => r !== fullName) : [...prev, fullName],
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.put('/api/preferences', {
        autoPostEnabled: enabled,
        autoPostRepos: selectedRepos,
        autoPostTone: tone,
        autoPostHour: localToUtc(localHour),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const summaryLine = enabled
    ? [
        `${selectedRepos.length} repo${selectedRepos.length !== 1 ? 's' : ''}`,
        LOCAL_HOURS[localHour]?.label,
        TONES.find((t) => t.value === tone)?.label ?? tone,
      ].join(' · ')
    : 'Auto-post commits to Twitter on a daily schedule';

  return (
    <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-[#1d9bf0]/10 border border-[#1d9bf0]/20 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d9bf0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-1">Scheduled auto-posting</h3>
          <p className="text-xs text-text-3 mt-0.5 truncate">{summaryLine}</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${
            enabled ? 'bg-[#1d9bf0]' : 'bg-bg-elevated border border-border'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="border-t border-border">

          {/* Repo list */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-text-3 uppercase tracking-widest font-semibold">Repositories</p>
              {selectedRepos.length > 0 && (
                <span className="text-[10px] text-text-2 font-mono">{selectedRepos.length} selected</span>
              )}
            </div>

            {repos.length === 0 ? (
              <p className="text-xs text-text-3 italic py-1">
                No repos found — fetch commits first to populate this list.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-0.5 -mx-1">
                {repos.map((r) => {
                  const checked = selectedRepos.includes(r.full_name);
                  return (
                    <label
                      key={r.full_name}
                      className={`flex items-center gap-3 px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-colors duration-100 ${
                        checked ? 'bg-[#1d9bf0]/10' : 'hover:bg-bg-elevated'
                      }`}
                    >
                      {/* Hidden native checkbox — drives logic */}
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRepo(r.full_name)}
                        className="sr-only"
                      />
                      {/* Custom visual checkbox */}
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all duration-150 ${
                          checked
                            ? 'bg-[#1d9bf0] border-[#1d9bf0]'
                            : 'border-border bg-bg-base'
                        }`}
                        aria-hidden="true"
                      >
                        {checked && (
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-text-1 font-medium truncate block">{r.full_name}</span>
                        {r.description && (
                          <span className="text-[11px] text-text-3 truncate block">{r.description}</span>
                        )}
                      </div>

                      {r.language && (
                        <span className="shrink-0 text-[10px] text-text-3 bg-bg-elevated px-1.5 py-0.5 rounded font-mono">
                          {r.language}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time + Tone in 2-col layout */}
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">

            {/* Post time */}
            <div className="px-5 py-4">
              <p className="text-[10px] text-text-3 uppercase tracking-widest font-semibold mb-0.5">Post time</p>
              <p className="text-[10px] text-text-3 mb-2 truncate">{tzName}</p>
              <select
                value={localHour}
                onChange={(e) => setLocalHour(Number(e.target.value))}
                className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-1
                  focus:outline-none focus:ring-1 focus:ring-border-hover transition-all duration-150"
              >
                {LOCAL_HOURS.map(({ localHour: h, label }) => (
                  <option key={h} value={h}>{label}</option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div className="px-5 py-4">
              <p className="text-[10px] text-text-3 uppercase tracking-widest font-semibold mb-3">Tone</p>
              <div className="flex flex-col gap-0.5">
                {TONES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTone(value)}
                    className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-all duration-150 ${
                      tone === value
                        ? 'bg-bg-elevated text-text-1 font-semibold'
                        : 'text-text-3 hover:text-text-2 hover:bg-bg-elevated/50'
                    }`}
                  >
                    {tone === value && (
                      <span className="inline-block w-1 h-1 rounded-full bg-green mr-1.5 mb-px" />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3.5 bg-bg-elevated/30 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          loading={saving}
          disabled={saving}
          onClick={handleSave}
        >
          Save preferences
        </Button>

        <div className="flex items-center gap-1.5">
          {saved && (
            <span className="text-xs text-green flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </span>
          )}
          {error && <span className="text-xs text-red">{error}</span>}
        </div>
      </div>
    </div>
  );
}
