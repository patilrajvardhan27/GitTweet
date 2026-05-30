'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import type { TweetTone, GeneralPreferences } from '@/types';

const TONES: { value: TweetTone; label: string; desc: string }[] = [
  { value: 'default',      label: 'Default',      desc: 'Balanced, professional' },
  { value: 'casual',       label: 'Casual',        desc: 'Relaxed, conversational' },
  { value: 'technical',    label: 'Technical',     desc: 'Dev-focused, precise' },
  { value: 'motivational', label: 'Motivational',  desc: 'Inspiring, energetic' },
];

interface Props {
  initial: GeneralPreferences;
  onSaved: (prefs: GeneralPreferences) => void;
}

export function GeneralPreferencesCard({ initial, onSaved }: Props) {
  const [tone, setTone]   = useState<TweetTone>(initial.defaultTone);
  const [repo, setRepo]   = useState(initial.defaultRepo ?? '');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    setTone(initial.defaultTone);
    setRepo(initial.defaultRepo ?? '');
  }, [initial.defaultTone, initial.defaultRepo]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.put('/api/preferences', {
        defaultTone: tone,
        defaultRepo: repo.trim() || null,
      });
      setSaved(true);
      onSaved({ defaultTone: tone, defaultRepo: repo.trim() || null });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-bg-elevated border border-border flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-2" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-1">General preferences</h3>
          <p className="text-xs text-text-3 mt-0.5">Default settings applied to each session</p>
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-border">

        {/* Default repo */}
        <div className="px-5 py-4">
          <label className="block text-[10px] text-text-3 uppercase tracking-widest font-semibold mb-2">
            Default repository
          </label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="owner/repo  (optional)"
            className="w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-1
              placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-border-hover
              transition-all duration-150"
          />
          <p className="text-[10px] text-text-3 mt-1.5">
            Pre-fills the repo field when you open the dashboard.
          </p>
        </div>

        {/* Default tone */}
        <div className="px-5 py-4">
          <p className="text-[10px] text-text-3 uppercase tracking-widest font-semibold mb-3">
            Default tweet tone
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {TONES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setTone(value)}
                className={`text-left px-3 py-2.5 rounded-lg border transition-all duration-150 ${
                  tone === value
                    ? 'bg-bg-elevated border-border-hover text-text-1'
                    : 'border-border text-text-3 hover:border-border-hover hover:text-text-2 hover:bg-bg-elevated/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  {tone === value && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" />
                  )}
                  <span className="text-xs font-semibold">{label}</span>
                </div>
                <span className="text-[10px] text-text-3 leading-tight block">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 bg-bg-elevated/30 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" loading={saving} disabled={saving} onClick={handleSave}>
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
