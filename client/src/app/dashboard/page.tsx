'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCommits } from '@/hooks/useCommits';
import { Layout } from '@/components/Layout';
import { CommitList } from '@/components/CommitList';
import { TweetPreview } from '@/components/TweetPreview';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';
import type { Commit } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { github, twitter, loading: authLoading, refresh: refreshAuth } = useAuth();

  const { repos, commits, repoMeta, loading: commitsLoading, error: commitsError, fetchCommits } =
    useCommits();

  const [repoInput, setRepoInput] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasFetched, setHasFetched] = useState(false);
  const [context, setContext] = useState('');

  const [tweet, setTweet] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [postedUrl, setPostedUrl] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  // Redirect to landing if not authed and loading finished
  useEffect(() => {
    if (!authLoading && !github) {
      router.replace('/');
    }
  }, [authLoading, github, router]);

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
    await fetchCommits(repoInput.trim());
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
        { text: tweet },
      );
      setPosted(true);
      setPostedUrl(res.tweet_url);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Failed to post tweet');
    } finally {
      setPosting(false);
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

          {commitsError && (
            <p className="mt-2 text-sm text-red" role="alert">
              {commitsError}
            </p>
          )}
        </section>

        {/* Step 2 — Commits */}
        {hasFetched && (
          <section aria-labelledby="step-commits">
            <h2 id="step-commits" className="text-lg font-display font-semibold text-text-1 mb-4">
              <span className="text-text-3 font-mono text-sm mr-2">02</span>
              Select commits
            </h2>
            <CommitList
              commits={commits}
              selected={selected}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
            />
          </section>
        )}

        {/* Step 3 — Context + Generate */}
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
      </div>
    </Layout>
  );
}
