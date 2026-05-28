'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCommits } from '@/hooks/useCommits';
import { Layout } from '@/components/Layout';
import { CommitList } from '@/components/CommitList';
import { TweetPreview } from '@/components/TweetPreview';
import { TweetHistory } from '@/components/TweetHistory';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import type { Commit, TweetTone, TweetHistoryItem } from '@/types';

const TONES: { value: TweetTone; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'motivational', label: 'Motivational' },
];

function toDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function DashboardPage() {
  const router = useRouter();
  const { github, twitter, loading: authLoading, refresh: refreshAuth } = useAuth();

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

  const [tweet, setTweet] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [postedUrl, setPostedUrl] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  const [history, setHistory] = useState<TweetHistoryItem[]>([]);

  // Redirect to connect if not authed
  useEffect(() => {
    if (!authLoading && !github) {
      router.replace('/connect');
    }
  }, [authLoading, github, router]);

  // Load preferences and history from server
  useEffect(() => {
    if (!github) return;

    api.get<{ defaultTone: string; defaultRepo: string | null }>('/api/preferences')
      .then((prefs) => {
        if (prefs.defaultTone) setTone(prefs.defaultTone as TweetTone);
        if (prefs.defaultRepo) setRepoInput(prefs.defaultRepo);
      })
      .catch(() => {});

    api.get<{ tweets: TweetHistoryItem[] }>('/api/history')
      .then(({ tweets }) => setHistory(tweets))
      .catch(() => {});
  }, [github]);

  // Reset selection when commits change
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
    setPosted(false);
    setPostedUrl(null);
    await fetchCommits(repoInput.trim(), dateFrom, dateTo);
    setHasFetched(true);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    setTweet('');
    setPosted(false);
    setPostedUrl(null);

    const selectedCommits = commits.filter((c) => selected.has(c.sha)) as Commit[];

    try {
      const res = await api.post<{ tweet: string }>('/api/generate-tweet', {
        commits: selectedCommits,
        repoName: repoMeta?.name ?? repoInput,
        repoDescription: repoMeta?.description ?? null,
        context: context.trim() || null,
        tone,
      });
      setTweet(res.tweet);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate tweet');
    } finally {
      setGenerating(false);
    }
  }

  async function handlePost() {
    if (!tweet.trim()) return;
    setPosting(true);
    setPostError(null);

    try {
      const res = await api.post<{ success: boolean; tweet_id: string; tweet_url: string }>(
        '/api/post-tweet',
        { text: tweet, repo: repoInput, tone },
      );
      setPosted(true);
      setPostedUrl(res.tweet_url);

      // Optimistically prepend to local history; server has already persisted it
      const item: TweetHistoryItem = {
        id: Date.now().toString(),
        text: tweet,
        url: res.tweet_url,
        repo: repoInput,
        date: new Date().toISOString(),
        tone,
      };
      setHistory((prev) => [item, ...prev].slice(0, 20));
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Failed to post tweet');
    } finally {
      setPosting(false);
    }
  }

  async function handleClearHistory() {
    try {
      await api.delete('/api/history');
      setHistory([]);
    } catch {
      // silently ignore — history will clear on next load
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

  if (!github) return null;

  const selectedCommits = commits.filter((c) => selected.has(c.sha));

  return (
    <Layout
      github={github}
      twitter={twitter}
      onDisconnect={async (provider) => {
        await refreshAuth();
        if (provider === 'github') router.replace('/');
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Step 1 — Repository */}
        <section aria-labelledby="step-repo">
          <h2 id="step-repo" className="text-lg font-display font-semibold text-text-1 mb-4">
            <span className="text-text-3 font-mono text-sm mr-2">01</span>
            Pick a repository
          </h2>

          <div className="flex gap-3">
            <div className="flex-1">
              <input
                list="repos-datalist"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchCommits()}
                placeholder="owner/repo"
                className="w-full bg-bg-surface border border-border rounded-md px-4 py-2.5 text-sm
                  text-text-1 placeholder:text-text-3 focus:outline-none focus:border-border-hover
                  transition-colors duration-150"
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
            >
              Fetch commits
            </Button>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-text-3 shrink-0 w-7">From</label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 bg-bg-surface border border-border rounded-md px-3 py-2 text-xs
                  text-text-1 focus:outline-none focus:border-border-hover transition-colors duration-150
                  [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-text-3 shrink-0 w-3">To</label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                max={toDateInput(new Date())}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 bg-bg-surface border border-border rounded-md px-3 py-2 text-xs
                  text-text-1 focus:outline-none focus:border-border-hover transition-colors duration-150
                  [color-scheme:dark]"
              />
            </div>
          </div>

          {commitsError && (
            <p className="mt-2 text-sm text-red" role="alert">
              {commitsError}
            </p>
          )}
        </section>

        {/* Step 2 — Commits */}
        {hasFetched && (
          <section aria-labelledby="step-commits">
            <div className="flex items-center gap-3 mb-4">
              <h2 id="step-commits" className="text-lg font-display font-semibold text-text-1">
                <span className="text-text-3 font-mono text-sm mr-2">02</span>
                Select commits
              </h2>
              <button
                onClick={handleFetchCommits}
                disabled={commitsLoading}
                className="ml-auto text-text-3 hover:text-text-2 disabled:opacity-40 transition-colors duration-150"
                aria-label="Refresh commits"
                title="Refresh commits"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  className={commitsLoading ? 'animate-spin' : ''}
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <CommitList
              commits={commits}
              selected={selected}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
            />
          </section>
        )}

        {/* Step 3 — Context + Tone + Generate */}
        {hasFetched && (
          <section aria-labelledby="step-context">
            <h2 id="step-context" className="text-lg font-display font-semibold text-text-1 mb-4">
              <span className="text-text-3 font-mono text-sm mr-2">03</span>
              Add context
            </h2>

            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What are you working on? (optional — helps make the tweet more specific)"
              className="w-full bg-bg-surface border border-border rounded-md px-4 py-2.5 text-sm
                text-text-1 placeholder:text-text-3 focus:outline-none focus:border-border-hover
                transition-colors duration-150 mb-4"
            />

            {/* Tone selector */}
            <div className="mb-4">
              <p className="text-xs text-text-3 mb-2">Tone</p>
              <div className="flex items-center gap-1 p-1 bg-bg-elevated rounded-lg border border-border">
                {TONES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTone(value)}
                    className={`flex-1 text-xs px-2 py-1.5 rounded-md transition-all duration-150 ${
                      tone === value
                        ? 'bg-bg-surface text-text-1 shadow-sm border border-border font-medium'
                        : 'text-text-3 hover:text-text-2'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              loading={generating}
              disabled={selectedCommits.length === 0 || generating}
              onClick={handleGenerate}
              className="w-full"
            >
              {generating ? 'Generating…' : 'Generate tweet'}
            </Button>

            {generateError && (
              <p className="mt-2 text-sm text-red" role="alert">
                {generateError}
              </p>
            )}
          </section>
        )}

        {/* Step 4 — Tweet Preview */}
        {(tweet || generating) && (
          <section aria-labelledby="step-tweet">
            <h2 id="step-tweet" className="text-lg font-display font-semibold text-text-1 mb-4">
              <span className="text-text-3 font-mono text-sm mr-2">04</span>
              Preview &amp; post
            </h2>

            {generating ? (
              <div className="rounded-lg border border-border bg-bg-surface px-5 py-8 flex items-center justify-center gap-3 text-text-3">
                <Spinner size={18} />
                <span className="text-sm">Generating your tweet…</span>
              </div>
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
              />
            )}

            {postError && (
              <p className="mt-2 text-sm text-red" role="alert" aria-live="polite">
                {postError}
              </p>
            )}
          </section>
        )}

        {/* Tweet History */}
        {history.length > 0 && (
          <div className="border-t border-border pt-6">
            <TweetHistory items={history} onClear={handleClearHistory} />
          </div>
        )}
      </div>
    </Layout>
  );
}
