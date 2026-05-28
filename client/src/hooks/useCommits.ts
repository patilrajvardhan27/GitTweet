'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Repo, Commit, RepoMeta, CommitsResponse } from '@/types';

export function useCommits() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [repoMeta, setRepoMeta] = useState<RepoMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [reposLoading, setReposLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRepos() {
      try {
        const data = await api.get<Repo[]>('/api/repos');
        setRepos(data);
      } catch {
        // Repos are optional; silently fail — user may not have GitHub connected yet
      } finally {
        setReposLoading(false);
      }
    }
    loadRepos();
  }, []);

  async function fetchCommits(repo: string) {
    setLoading(true);
    setError(null);
    setCommits([]);
    setRepoMeta(null);

    try {
      const data = await api.get<CommitsResponse>(`/api/commits?repo=${encodeURIComponent(repo)}`);
      setCommits(data.commits);
      setRepoMeta(data.repo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch commits');
    } finally {
      setLoading(false);
    }
  }

  return { repos, commits, repoMeta, loading, reposLoading, error, fetchCommits };
}
