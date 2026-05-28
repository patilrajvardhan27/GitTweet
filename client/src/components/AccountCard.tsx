'use client';

import Image from 'next/image';
import { Button } from './ui/Button';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { GithubUser, TwitterUser } from '@/types';

interface AccountCardProps {
  provider: 'github' | 'twitter';
  user: GithubUser | TwitterUser | null;
  onDisconnect: () => void;
}

const icons = {
  github: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  twitter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
};

const labels = { github: 'GitHub', twitter: 'X (Twitter)' };

export function AccountCard({ provider, user, onDisconnect }: AccountCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await api.post(`/auth/disconnect/${provider}`, {});
      onDisconnect();
    } catch {
      // ignore — user can retry
    } finally {
      setDisconnecting(false);
    }
  }

  const avatar =
    user && 'avatar_url' in user
      ? user.avatar_url
      : user && 'profile_image_url' in user
        ? user.profile_image_url
        : null;

  const username =
    user && 'login' in user ? user.login : user && 'username' in user ? user.username : null;

  const displayName = user?.name ?? username ?? '';

  if (!user) {
    return (
      <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-text-3">
          {icons[provider]}
          <span className="text-sm font-medium">{labels[provider]}</span>
        </div>
        <p className="text-xs text-text-3">Not connected</p>
        <a
          href={`/auth/${provider}`}
          className="inline-flex items-center justify-center gap-2 text-xs px-3 py-1.5 rounded-sm
            border border-border text-text-2 hover:border-border-hover hover:text-text-1 transition-all duration-150"
        >
          Connect {labels[provider]}
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-bg-elevated p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-text-2">
        {icons[provider]}
        <span className="text-xs font-medium uppercase tracking-wider">{labels[provider]}</span>
      </div>

      <div className="flex items-center gap-3">
        {avatar ? (
          <Image
            src={avatar}
            alt={displayName}
            width={36}
            height={36}
            className="rounded-full bg-bg-surface"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-bg-surface flex items-center justify-center text-text-3 text-sm font-display">
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-1 truncate">{displayName}</p>
          <p className="text-xs text-text-2 truncate">@{username}</p>
        </div>
      </div>

      <Button
        variant="danger"
        size="sm"
        loading={disconnecting}
        onClick={handleDisconnect}
        className="w-full text-xs"
      >
        Disconnect
      </Button>
    </div>
  );
}
