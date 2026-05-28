'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AuthStatus } from '@/types';

export function useAuth() {
  const [data, setData] = useState<AuthStatus>({ google: null, github: null, twitter: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await api.get<AuthStatus>('/auth/status');
      setData(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch auth status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    google: data.google,
    github: data.github,
    twitter: data.twitter,
    loading,
    error,
    refresh,
  };
}
