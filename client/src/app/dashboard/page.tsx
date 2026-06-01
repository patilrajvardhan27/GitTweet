'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCommits } from '@/hooks/useCommits';
import { Layout } from '@/components/Layout';
import { CommitList } from '@/components/CommitList';
import { TweetPreview } from '@/components/TweetPreview';
import { ThreadPreview } from '@/components/ThreadPreview';
import { TweetHistory } from '@/components/TweetHistory';
import { AutoPostSettings } from '@/components/AutoPostSettings';
import { GeneralPreferencesCard } from '@/components/GeneralPreferences';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import type { Commit, TweetTone, TweetHistoryItem, AutoPostPreferences, GeneralPreferences } from '@/types';

const TONES: { value: TweetTone; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'motivational', label: 'Motivational' },
];

function toDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  if (done) {
    return (
      <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-green/10 border border-green/25 shrink-0">
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M2 5l2.5 2.5L8 3" stroke="var(--color-green)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full border border-border text-[10px] font-mono font-semibold text-text-3 shrink-0">
      {String(n).padStart(2, '0')}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { google, github, twitter, loading: authLoading, refresh: refreshAuth } = useAuth();

  const { repos, commits, repoMeta, loading: commitsLoading, error: commitsError, fetchCommits } =
    useCommits();

  const [repoInput, setRepoInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasFetched, setHasFetched] = useState(false);
  const [context, setContext] = useState('');
  const [tone, setTone] = useState<TweetTone>('default');

  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [dateFrom, setDateFrom] = useState(toDateInput(sevenDaysAgo));
  const [dateTo, setDateTo] = useState(toDateInput(today));

  const [isThread, setIsThread] = useState(false);
  const [tweet, setTweet] = useState('');
  const [thread, setThread] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [postedUrl, setPostedUrl] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [cardGenerating, setCardGenerating] = useState(false);
  const [includeCard, setIncludeCard] = useState(false);
  const [cardPreviewUrl, setCardPreviewUrl] = useState<string | null>(null);
  const [postedCardUrl, setPostedCardUrl] = useState<string | null>(null);

  const [history, setHistory] = useState<TweetHistoryItem[]>([]);
  const [generalPrefs, setGeneralPrefs] = useState<GeneralPreferences | null>(null);
  const [autoPostPrefs, setAutoPostPrefs] = useState<AutoPostPreferences | null>(null);

  useEffect(() => {
    if (!authLoading && !google) {
      router.replace('/');
    } else if (!authLoading && !github) {
      router.replace('/connect');
    }
  }, [authLoading, google, github, router]);

  useEffect(() => {
    if (!github) return;

    api.get<{ defaultTone: string; defaultRepo: string | null; autoPostEnabled: boolean; autoPostRepos: string[]; autoPostTone: string; autoPostHour: number; autoPostMinute: number }>('/api/preferences')
      .then((prefs) => {
        const resolvedTone = (prefs.defaultTone as TweetTone) ?? 'default';
        if (resolvedTone) setTone(resolvedTone);
        if (prefs.defaultRepo) setRepoInput(prefs.defaultRepo);
        setGeneralPrefs({ defaultTone: resolvedTone, defaultRepo: prefs.defaultRepo ?? null });
        setAutoPostPrefs({
          autoPostEnabled: prefs.autoPostEnabled ?? false,
          autoPostRepos: prefs.autoPostRepos ?? [],
          autoPostTone: (prefs.autoPostTone as TweetTone) ?? 'default',
          autoPostHour: prefs.autoPostHour ?? 9,
          autoPostMinute: prefs.autoPostMinute ?? 0,
        });
      })
      .catch(() => {
        setGeneralPrefs({ defaultTone: 'default', defaultRepo: null });
        setAutoPostPrefs({ autoPostEnabled: false, autoPostRepos: [], autoPostTone: 'default', autoPostHour: 9, autoPostMinute: 0 });
      });

    api.get<{ tweets: TweetHistoryItem[] }>('/api/history')
      .then(({ tweets }) => setHistory(tweets))
      .catch(() => {});
  }, [github]);

  useEffect(() => {
    setSelected(new Set(commits.map((c) => c.sha)));
  }, [commits]);

  function handleToggle(sha: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(sha) ? next.delete(sha) : next.add(sha);
      return next;
    });
  }

  function handleToggleAll() {
    setSelected(
      selected.size === commits.length ? new Set() : new Set(commits.map((c) => c.sha)),
    );
  }

  async function handleFetchCommits() {
    if (!repoInput.trim()) return;
    setHasFetched(false);
    setTweet('');
    setThread([]);
    setPosted(false);
    setPostedUrl(null);
    await fetchCommits(repoInput.trim(), dateFrom, dateTo);
    setHasFetched(true);
  }

  function handleToggleThread() {
    setIsThread((prev) => !prev);
    setTweet('');
    setThread([]);
    setPosted(false);
    setPostedUrl(null);
    setGenerateError(null);
    setIncludeCard(false);
    setCardPreviewUrl(null);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    setTweet('');
    setThread([]);
    setPosted(false);
    setPostedUrl(null);

    const selectedCommits = commits.filter((c) => selected.has(c.sha)) as Commit[];
    const payload = {
      commits: selectedCommits,
      repoName: repoMeta?.name ?? repoInput,
      repoDescription: repoMeta?.description ?? null,
      context: context.trim() || null,
      tone,
    };

    try {
      if (isThread) {
        const res = await api.post<{ tweets: string[] }>('/api/generate-thread', payload);
        setThread(res.tweets);
      } else {
        const res = await api.post<{ tweet: string }>('/api/generate-tweet', payload);
        setTweet(res.tweet);
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : `Failed to generate ${isThread ? 'thread' : 'tweet'}`);
    } finally {
      setGenerating(false);
    }
  }

  async function handlePost() {
    if (!tweet.trim()) return;
    setPosting(true);
    setPostError(null);
    setPostedCardUrl(null);

    try {
      const res = await api.post<{ success: boolean; tweet_id: string; tweet_url: string }>(
        '/api/post-tweet',
        {
          text: tweet,
          repo: repoInput,
          tone,
          includeCard: includeCard && selectedCommits.length > 0,
          commits: includeCard ? selectedCommits : undefined,
        },
      );
      setPosted(true);
      setPostedUrl(res.tweet_url);

      const item: TweetHistoryItem = {
        id: Date.now().toString(),
        text: tweet,
        url: res.tweet_url,
        repo: repoInput,
        date: new Date().toISOString(),
        tone,
      };
      setHistory((prev) => [item, ...prev].slice(0, 20));

      // Generate card preview for the success state (non-blocking)
      if (includeCard && selectedCommits.length > 0) {
        setCardGenerating(true);
        try {
          const cardRes = await api.post<{ dataUrl: string }>('/api/generate-card', {
            repoName: repoInput,
            commits: selectedCommits,
          });
          setPostedCardUrl(cardRes.dataUrl);
        } catch {
          // non-fatal
        } finally {
          setCardGenerating(false);
        }
      }
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Failed to post tweet');
    } finally {
      setPosting(false);
    }
  }

  async function handlePostThread() {
    setPosting(true);
    setPostError(null);
    setPostedCardUrl(null);

    try {
      const res = await api.post<{ success: boolean; tweet_ids: string[]; tweet_url: string }>(
        '/api/post-thread',
        {
          tweets: thread,
          repo: repoInput,
          tone,
          includeCard: includeCard && selectedCommits.length > 0,
          commits: includeCard ? selectedCommits.slice(0, 1) : undefined,
        },
      );
      setPosted(true);
      setPostedUrl(res.tweet_url);

      const item: TweetHistoryItem = {
        id: Date.now().toString(),
        text: thread[0],
        url: res.tweet_url,
        repo: repoInput,
        date: new Date().toISOString(),
        tone,
      };
      setHistory((prev) => [item, ...prev].slice(0, 20));

      if (includeCard && selectedCommits.length > 0) {
        setCardGenerating(true);
        try {
          const cardRes = await api.post<{ dataUrl: string }>('/api/generate-card', {
            repoName: repoInput,
            commits: selectedCommits.slice(0, 1),
          });
          setPostedCardUrl(cardRes.dataUrl);
        } catch {
          // non-fatal
        } finally {
          setCardGenerating(false);
        }
      }
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Failed to post thread');
    } finally {
      setPosting(false);
    }
  }

  async function handleClearHistory() {
    try {
      await api.delete('/api/history');
      setHistory([]);
    } catch {
      setHistory([]);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-base">
        <Spinner size={32} className="text-text-3" />
      </div>
    );
  }

  if (!google || !github) return null;

  const selectedCommits = commits.filter((c) => selected.has(c.sha));

  async function handleLogout() {
    await api.post('/auth/logout', {});
    router.replace('/');
  }

  const inputBase =
    'w-full bg-bg-base border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-1 placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-border-hover focus:border-border-hover transition-all duration-150';

  const cardHeader =
    'px-5 py-3.5 border-b border-border flex items-center gap-2.5';

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
      <div className="max-w-[660px] mx-auto px-6 py-10 space-y-3">

        {/* Step 1 — Repository */}
        <section aria-labelledby="step-repo" className="rounded-xl border border-border bg-bg-surface overflow-hidden">
          <div className={cardHeader}>
            <StepBadge n={1} done={hasFetched} />
            <h2 id="step-repo" className="text-sm font-semibold text-text-1">
              Pick a repository
            </h2>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex gap-2.5">
              <div className="flex-1">
                <input
                  list="repos-datalist"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchCommits()}
                  placeholder="owner/repo"
                  className={inputBase}
                  aria-label="Repository name (owner/repo)"
                />
                <datalist id="repos-datalist">
                  {repos.map((r) => (
                    <option key={r.full_name} value={r.full_name} />
                  ))}
                </datalist>
              </div>
              <Button
                variant="ghost"
                size="md"
                loading={commitsLoading}
                disabled={!repoInput.trim() || commitsLoading}
                onClick={handleFetchCommits}
                className="shrink-0"
              >
                {commitsLoading ? 'Fetching…' : 'Fetch commits'}
              </Button>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-text-3 shrink-0">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 bg-bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-1 focus:outline-none focus:ring-1 focus:ring-border-hover transition-all duration-150 [color-scheme:dark]"
                />
              </div>
              <span className="text-text-3 text-xs shrink-0 select-none">→</span>
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  max={toDateInput(new Date())}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 bg-bg-base border border-border rounded-lg px-3 py-2 text-xs text-text-1 focus:outline-none focus:ring-1 focus:ring-border-hover transition-all duration-150 [color-scheme:dark]"
                />
                <span className="text-xs text-text-3 shrink-0">To</span>
              </div>
            </div>

            {commitsError && (
              <p className="text-xs text-red" role="alert">{commitsError}</p>
            )}
          </div>
        </section>

        {/* Step 2 — Commits */}
        {hasFetched && (
          <section aria-labelledby="step-commits" className="rounded-xl border border-border bg-bg-surface overflow-hidden">
            <div className={cardHeader}>
              <StepBadge n={2} />
              <h2 id="step-commits" className="text-sm font-semibold text-text-1 flex-1">
                Select commits
                {commits.length > 0 && (
                  <span className="ml-2 text-xs text-text-3 font-mono font-normal">
                    {selected.size}/{commits.length}
                  </span>
                )}
              </h2>
              <button
                onClick={handleFetchCommits}
                disabled={commitsLoading}
                className="text-text-3 hover:text-text-2 disabled:opacity-40 transition-colors duration-150 p-0.5"
                aria-label="Refresh commits"
                title="Refresh commits"
              >
                <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"
                  className={commitsLoading ? 'animate-spin' : ''}>
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4">
              <CommitList
                commits={commits}
                selected={selected}
                onToggle={handleToggle}
                onToggleAll={handleToggleAll}
              />
            </div>
          </section>
        )}

        {/* Step 3 — Context + Tone + Generate */}
        {hasFetched && (
          <section aria-labelledby="step-context" className="rounded-xl border border-border bg-bg-surface overflow-hidden">
            <div className={cardHeader}>
              <StepBadge n={3} />
              <h2 id="step-context" className="text-sm font-semibold text-text-1">
                Add context
              </h2>
            </div>

            <div className="px-5 py-4 space-y-4">
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="What are you working on? (optional)"
                className={inputBase}
              />

              <div>
                <p className="text-[10px] text-text-3 uppercase tracking-widest font-semibold mb-2">Tone</p>
                <div className="flex items-center gap-1 p-1 bg-bg-base rounded-lg border border-border">
                  {TONES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setTone(value)}
                      className={`flex-1 text-xs px-2 py-1.5 rounded-md transition-all duration-150 ${
                        tone === value
                          ? 'bg-bg-elevated text-text-1 border border-border-hover font-semibold shadow-sm'
                          : 'text-text-3 hover:text-text-2'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thread toggle */}
              <div className="flex items-center gap-2.5">
                <button
                  role="switch"
                  aria-checked={isThread}
                  onClick={handleToggleThread}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                    isThread ? 'bg-green' : 'bg-bg-elevated'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      isThread ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs text-text-2">
                  Thread mode
                  <span className="text-text-3 ml-1">(2–4 tweets)</span>
                </span>
              </div>

              <Button
                variant="primary"
                size="md"
                loading={generating}
                disabled={selectedCommits.length === 0 || generating}
                onClick={handleGenerate}
                className="w-full"
              >
                {generating
                  ? isThread ? 'Generating thread…' : 'Generating…'
                  : selectedCommits.length > 0
                  ? isThread
                    ? `Generate thread from ${selectedCommits.length} commit${selectedCommits.length !== 1 ? 's' : ''}`
                    : `Generate tweet from ${selectedCommits.length} commit${selectedCommits.length !== 1 ? 's' : ''}`
                  : isThread ? 'Generate thread' : 'Generate tweet'}
              </Button>

              {generateError && (
                <p className="text-sm text-red" role="alert">{generateError}</p>
              )}
            </div>
          </section>
        )}

        {/* Step 4 — Tweet / Thread Preview */}
        {(tweet || thread.length > 0 || generating) && (
          <section aria-labelledby="step-tweet" className="rounded-xl border border-border bg-bg-surface overflow-hidden">
            <div className={cardHeader}>
              <StepBadge n={4} />
              <h2 id="step-tweet" className="text-sm font-semibold text-text-1">
                Preview &amp; post
              </h2>
            </div>

            <div className="px-5 py-4">
              {generating ? (
                <div className="py-8 flex items-center justify-center gap-3 text-text-3">
                  <Spinner size={18} />
                  <span className="text-sm">{isThread ? 'Generating your thread…' : 'Generating your tweet…'}</span>
                </div>
              ) : isThread && thread.length > 0 ? (
                <ThreadPreview
                  tweets={thread}
                  onChange={(i, val) => setThread((prev) => prev.map((t, idx) => idx === i ? val : t))}
                  user={twitter}
                  onPost={handlePostThread}
                  onRegenerate={handleGenerate}
                  posting={posting}
                  posted={posted}
                  postedUrl={postedUrl}
                  includeCard={includeCard}
                  onToggleCard={async () => {
                    const next = !includeCard;
                    setIncludeCard(next);
                    setCardPreviewUrl(null);
                    if (next && selectedCommits.length > 0) {
                      setCardGenerating(true);
                      try {
                        const r = await api.post<{ dataUrl: string }>('/api/generate-card', {
                          repoName: repoInput,
                          commits: selectedCommits.slice(0, 1),
                        });
                        setCardPreviewUrl(r.dataUrl);
                      } catch { /* non-fatal */ }
                      finally { setCardGenerating(false); }
                    }
                  }}
                  cardGenerating={cardGenerating}
                  cardPreviewUrl={cardPreviewUrl}
                  postedCardUrl={postedCardUrl}
                />
              ) : (
                <TweetPreview
                  tweet={tweet}
                  onChange={setTweet}
                  user={twitter}
                  onPost={handlePost}
                  onRegenerate={handleGenerate}
                  posting={posting}
                  posted={posted}
                  postedUrl={postedUrl}
                  includeCard={includeCard}
                  onToggleCard={async () => {
                    const next = !includeCard;
                    setIncludeCard(next);
                    setCardPreviewUrl(null);
                    if (next && selectedCommits.length > 0) {
                      setCardGenerating(true);
                      try {
                        const r = await api.post<{ dataUrl: string }>('/api/generate-card', {
                          repoName: repoInput,
                          commits: selectedCommits,
                        });
                        setCardPreviewUrl(r.dataUrl);
                      } catch { /* non-fatal */ }
                      finally { setCardGenerating(false); }
                    }
                  }}
                  commits={selectedCommits}
                  repoName={repoInput}
                  cardGenerating={cardGenerating}
                  cardPreviewUrl={cardPreviewUrl}
                  postedCardUrl={postedCardUrl}
                />
              )}

              {postError && (
                <p className="mt-3 text-sm text-red" role="alert" aria-live="polite">
                  {postError}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Tweet History */}
        {history.length > 0 && (
          <div className="pt-2">
            <TweetHistory items={history} onClear={handleClearHistory} />
          </div>
        )}

        {/* Settings section */}
        <div className="flex items-center gap-3 pt-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold text-text-3 uppercase tracking-widest">
            Settings
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {generalPrefs && (
          <GeneralPreferencesCard
            initial={generalPrefs}
            onSaved={(p) => {
              setGeneralPrefs(p);
              setTone(p.defaultTone);
              if (p.defaultRepo) setRepoInput(p.defaultRepo);
            }}
          />
        )}

        {autoPostPrefs && <AutoPostSettings repos={repos} initial={autoPostPrefs} />}

      </div>
    </Layout>
  );
}
