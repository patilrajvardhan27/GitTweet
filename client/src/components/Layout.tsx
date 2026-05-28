'use client';

import Link from 'next/link';
import { AccountCard } from './AccountCard';
import type { GithubUser, TwitterUser } from '@/types';

interface LayoutProps {
  github: GithubUser | null;
  twitter: TwitterUser | null;
  onDisconnect: (provider: 'github' | 'twitter') => void;
  children: React.ReactNode;
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-green flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2 10L6 6L9 9L14 4"
            stroke="#07070D"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="font-display font-bold text-text-1 text-base tracking-tight">GitTweet</span>
    </div>
  );
}

export function Layout({ github, twitter, onDisconnect, children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 flex flex-col border-r border-border bg-bg-surface overflow-y-auto">
        <div className="p-5 border-b border-border">
          <Logo />
        </div>

        <nav className="flex flex-col gap-3 p-4 flex-1">
          <p className="text-xs font-medium text-text-3 uppercase tracking-wider px-1 mb-1">
            Accounts
          </p>
          <AccountCard provider="github" user={github} onDisconnect={() => onDisconnect('github')} />
          <AccountCard provider="twitter" user={twitter} onDisconnect={() => onDisconnect('twitter')} />
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            href="/"
            className="text-xs text-text-3 hover:text-text-2 transition-colors duration-150"
          >
            ← Back to home
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" id="main-content">
        {children}
      </main>
    </div>
  );
}
