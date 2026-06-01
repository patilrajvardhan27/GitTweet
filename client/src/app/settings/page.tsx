'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCommits } from '@/hooks/useCommits';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { TweetTone, AutoPostPreferences, GeneralPreferences } from '@/types';

// ─── Shared types ─────────────────────────────────────────────────────────────

type Tab = 'general' | 'scheduler';

// ─── Tone data ────────────────────────────────────────────────────────────────

const TONES: { value: TweetTone; label: string; desc: string; emoji: string }[] = [
  { value: 'default',      label: 'Default',      desc: 'Balanced and authentic',  emoji: '✦' },
  { value: 'casual',       label: 'Casual',        desc: 'Relaxed, like a friend',  emoji: '💬' },
  { value: 'technical',    label: 'Technical',     desc: 'Precise, dev-focused',    emoji: '⌥' },
  { value: 'motivational', label: 'Motivational',  desc: 'Uplifting, build in public', emoji: '⚡' },
];

// ─── General preferences section ─────────────────────────────────────────────

function GeneralSection() {
  const [tone, setTone] = useState<TweetTone>('default');
  const [repo, setRepo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ defaultTone: string; defaultRepo: string | null }>('/api/preferences')
      .then((p) => {
        setTone((p.defaultTone as TweetTone) ?? 'default');
        setRepo(p.defaultRepo ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={24} className="text-text-3" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Default repository */}
      <div className="rounded-xl border border-border bg-bg-surface overflow-hidden card-elevated">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-1 font-display">Default repository</h3>
          <p className="text-xs text-text-3 mt-0.5">Pre-fills the repo field when you open the dashboard</p>
        </div>
        <div className="px-6 py-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-3" aria-hidden="true">
                <path d="M10 2C5.58 2 2 5.58 2 10c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0018 10c0-4.42-3.58-8-8-8z" />
              </svg>
            </div>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo  (optional)"
              className="w-full bg-bg-base border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-1
                placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-border-hover
                focus:border-border-hover transition-all duration-150"
            />
          </div>
        </div>
      </div>

      {/* Default tone */}
      <div className="rounded-xl border border-border bg-bg-surface overflow-hidden card-elevated">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-1 font-display">Default tweet tone</h3>
          <p className="text-xs text-text-3 mt-0.5">Applied automatically when you generate tweets</p>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-2.5">
            {TONES.map(({ value, label, desc, emoji }) => {
              const active = tone === value;
              return (
                <button
                  key={value}
                  onClick={() => setTone(value)}
                  className={[
                    'relative text-left px-4 py-4 rounded-xl border transition-all duration-150',
                    active
                      ? 'bg-green/[0.06] border-green/25 shadow-[0_0_0_1px_rgba(0,240,122,0.15)]'
                      : 'border-border hover:border-border-hover hover:bg-bg-elevated',
                  ].join(' ')}
                >
                  {active && (
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green" aria-hidden="true" />
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base leading-none" aria-hidden="true">{emoji}</span>
                    <span className={`text-sm font-semibold ${active ? 'text-text-1' : 'text-text-2'}`}>{label}</span>
                  </div>
                  <p className="text-[11px] text-text-3 leading-snug">{desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green animate-fade-in">
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </span>
          )}
          {error && <span className="text-xs text-red">{error}</span>}
        </div>
        <Button variant="primary" size="md" loading={saving} disabled={saving} onClick={handleSave}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}

// ─── Scheduler section ────────────────────────────────────────────────────────

const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
const tzOffsetMinutes = -new Date().getTimezoneOffset();

function utcToLocal(utcHour: number, utcMinute: number) {
  const total = ((utcHour * 60 + utcMinute + tzOffsetMinutes) % 1440 + 1440) % 1440;
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = Math.round(minute / 5) * 5 % 60;
  return { h, m, ap: (hour < 12 ? 'AM' : 'PM') as 'AM' | 'PM' };
}

function localToUtc(localHour24: number, localMinute: number) {
  const total = ((localHour24 * 60 + localMinute - tzOffsetMinutes) % 1440 + 1440) % 1440;
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);

function SchedulerSection() {
  const { repos } = useCommits();

  const [loading, setLoading]           = useState(true);
  const [enabled, setEnabled]           = useState(false);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [tone, setTone]                 = useState<TweetTone>('default');
  const [hr, setHr]                     = useState(9);
  const [mm, setMm]                     = useState(0);
  const [ampm, setAmpm]                 = useState<'AM' | 'PM'>('AM');
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    api.get<AutoPostPreferences>('/api/preferences')
      .then((p) => {
        setEnabled(p.autoPostEnabled ?? false);
        setSelectedRepos(p.autoPostRepos ?? []);
        setTone((p.autoPostTone as TweetTone) ?? 'default');
        const { h, m, ap } = utcToLocal(p.autoPostHour ?? 9, p.autoPostMinute ?? 0);
        setHr(h); setMm(m); setAmpm(ap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleRepo(name: string) {
    setSelectedRepos((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name],
    );
  }

  function localHour24() {
    return ampm === 'AM' ? hr % 12 : (hr % 12) + 12;
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const { hour: utcHour, minute: utcMinute } = localToUtc(localHour24(), mm);
      await api.put('/api/preferences', {
        autoPostEnabled: enabled,
        autoPostRepos: selectedRepos,
        autoPostTone: tone,
        autoPostHour: utcHour,
        autoPostMinute: utcMinute,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const timeLabel = `${String(hr).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${ampm}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size={24} className="text-text-3" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Enable toggle card */}
      <div className="rounded-xl border border-border bg-bg-surface overflow-hidden card-elevated">
        <div className="px-6 py-5 flex items-center gap-4">
          <div className={[
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200',
            enabled ? 'bg-[#1d9bf0]/15 border border-[#1d9bf0]/30' : 'bg-bg-elevated border border-border',
          ].join(' ')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={enabled ? '#1d9bf0' : 'var(--color-text-3)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-text-1 font-display">Auto-post scheduler</h3>
            <p className="text-xs text-text-3 mt-0.5">
              {enabled
                ? `Posts daily at ${timeLabel} · ${tzName}`
                : 'Automatically post your daily commits on a schedule'}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none',
              enabled ? 'bg-[#1d9bf0]' : 'bg-bg-elevated border border-border',
            ].join(' ')}
          >
            <span className={[
              'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-1',
              enabled ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')} />
          </button>
        </div>
      </div>

      {/* Configuration — only when enabled */}
      {enabled && (
        <div className="space-y-4 animate-fade-up">

          {/* Repositories */}
          <div className="rounded-xl border border-border bg-bg-surface overflow-hidden card-elevated">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-1 font-display">Repositories</h3>
                <p className="text-xs text-text-3 mt-0.5">Which repos should trigger auto-posts?</p>
              </div>
              {selectedRepos.length > 0 && (
                <span className="text-[10px] font-mono text-text-2 bg-bg-elevated border border-border px-2 py-1 rounded-lg">
                  {selectedRepos.length} selected
                </span>
              )}
            </div>
            <div className="px-6 py-4">
              {repos.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-xs text-text-3">No repos loaded — visit the dashboard and fetch commits first.</p>
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto -mx-2 custom-scroll space-y-0.5">
                  {repos.map((r) => {
                    const checked = selectedRepos.includes(r.full_name);
                    return (
                      <label
                        key={r.full_name}
                        className={[
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150',
                          checked ? 'bg-[#1d9bf0]/08 border border-[#1d9bf0]/20' : 'hover:bg-bg-elevated border border-transparent',
                        ].join(' ')}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleRepo(r.full_name)} className="sr-only" />
                        <span className={[
                          'w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all duration-150',
                          checked ? 'bg-[#1d9bf0] border-[#1d9bf0]' : 'border-border bg-bg-base',
                        ].join(' ')} aria-hidden="true">
                          {checked && (
                            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-text-1 truncate block">{r.full_name}</span>
                          {r.description && (
                            <span className="text-[11px] text-text-3 truncate block">{r.description}</span>
                          )}
                        </div>
                        {r.language && (
                          <code className="shrink-0 text-[10px] text-text-3 bg-bg-elevated px-1.5 py-0.5 rounded border border-border">
                            {r.language}
                          </code>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Schedule & Tone — two columns */}
          <div className="grid grid-cols-2 gap-4">

            {/* Post time */}
            <div className="rounded-xl border border-border bg-bg-surface overflow-hidden card-elevated">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-1 font-display">Post time</h3>
                <p className="text-[11px] text-text-3 mt-0.5 truncate">{tzName}</p>
              </div>
              <div className="px-5 py-4">
                {/* Big time display */}
                <div className="text-3xl font-display font-bold text-text-1 mb-4 tabular-nums">
                  {String(hr).padStart(2, '0')}:{String(mm).padStart(2, '0')}
                  <span className="text-lg text-text-3 ml-2">{ampm}</span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={hr}
                    onChange={(e) => setHr(Number(e.target.value))}
                    className="flex-1 bg-bg-base border border-border rounded-lg px-2 py-2 text-xs text-text-1
                      focus:outline-none focus:ring-1 focus:ring-border-hover transition-all text-center"
                  >
                    {HOUR_OPTIONS.map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="flex items-center text-text-3 text-xs font-bold select-none">:</span>
                  <select
                    value={mm}
                    onChange={(e) => setMm(Number(e.target.value))}
                    className="flex-1 bg-bg-base border border-border rounded-lg px-2 py-2 text-xs text-text-1
                      focus:outline-none focus:ring-1 focus:ring-border-hover transition-all text-center"
                  >
                    {MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    value={ampm}
                    onChange={(e) => setAmpm(e.target.value as 'AM' | 'PM')}
                    className="bg-bg-base border border-border rounded-lg px-2 py-2 text-xs text-text-1
                      focus:outline-none focus:ring-1 focus:ring-border-hover transition-all"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tone */}
            <div className="rounded-xl border border-border bg-bg-surface overflow-hidden card-elevated">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-text-1 font-display">Tweet tone</h3>
                <p className="text-[11px] text-text-3 mt-0.5">Used for auto-generated tweets</p>
              </div>
              <div className="px-5 py-4 flex flex-col gap-1">
                {TONES.map(({ value, label, emoji }) => (
                  <button
                    key={value}
                    onClick={() => setTone(value)}
                    className={[
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150',
                      tone === value
                        ? 'bg-bg-elevated border border-border-hover text-text-1'
                        : 'text-text-3 hover:text-text-2 hover:bg-bg-elevated/50 border border-transparent',
                    ].join(' ')}
                  >
                    {tone === value && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" aria-hidden="true" />
                    )}
                    {tone !== value && (
                      <span className="w-1.5 h-1.5 shrink-0" aria-hidden="true" />
                    )}
                    <span className="text-sm" aria-hidden="true">{emoji}</span>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-green animate-fade-in">
              <svg width="11" height="11" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Saved
            </span>
          )}
          {error && <span className="text-xs text-red">{error}</span>}
        </div>
        <Button variant="primary" size="md" loading={saving} disabled={saving} onClick={handleSave}>
          Save scheduler
        </Button>
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'general',
    label: 'General',
    icon: (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'scheduler',
    label: 'Auto-post scheduler',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { google, github, twitter, loading: authLoading, refresh: refreshAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  useEffect(() => {
    if (!authLoading && !google) router.replace('/');
    else if (!authLoading && !github) router.replace('/connect');
  }, [authLoading, google, github, router]);

  async function handleLogout() {
    await api.post('/auth/logout', {});
    router.replace('/');
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-base">
        <Spinner size={32} className="text-text-3" />
      </div>
    );
  }

  if (!google || !github) return null;

  return (
    <Layout
      google={google}
      github={github}
      twitter={twitter}
      onDisconnect={async (provider) => {
        await refreshAuth();
        if (provider === 'github') router.replace('/connect');
      }}
      onLogout={handleLogout}
    >
      <div className="max-w-[720px] mx-auto px-8 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-text-1 tracking-tight">Settings</h1>
          <p className="text-sm text-text-3 mt-1">Manage your preferences and automation</p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 p-1 bg-bg-surface border border-border rounded-xl mb-6 w-fit card-elevated">
          {tabs.map(({ id, label, icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={[
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  active
                    ? 'bg-bg-elevated text-text-1 border border-border-hover shadow-sm'
                    : 'text-text-3 hover:text-text-2',
                ].join(' ')}
                aria-current={active ? 'true' : undefined}
              >
                <span className={active ? 'text-text-1' : 'text-text-3'}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'general' && <GeneralSection key="general" />}
        {activeTab === 'scheduler' && <SchedulerSection key="scheduler" />}

      </div>
    </Layout>
  );
}
