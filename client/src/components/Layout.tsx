'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AccountCard } from './AccountCard';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from './ThemeProvider';
import type { GoogleUser, GithubUser, TwitterUser } from '@/types';

interface LayoutProps {
  google: GoogleUser | null;
  github: GithubUser | null;
  twitter: TwitterUser | null;
  onDisconnect: (provider: 'github' | 'twitter') => void;
  onLogout: () => void;
  children: React.ReactNode;
}

function Logo() {
  const { theme } = useTheme();
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={theme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg'}
        alt="Twinker logo"
        width={28}
        height={28}
        aria-hidden="true"
      />
      <span className="font-display font-bold text-text-1 text-base tracking-tight">Twinker</span>
    </div>
  );
}

export function Layout({ google, github, twitter, onDisconnect, onLogout, children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 flex flex-col border-r border-border bg-bg-surface overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>

        <nav className="flex flex-col gap-3 p-4 flex-1">
          <p className="text-xs font-medium text-text-3 uppercase tracking-wider px-1 mb-1">
            Accounts
          </p>
          <AccountCard provider="github" user={github} onDisconnect={() => onDisconnect('github')} />
          <AccountCard provider="twitter" user={twitter} onDisconnect={() => onDisconnect('twitter')} />
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          {google && (
            <div className="flex items-center gap-2.5">
              {google.picture ? (
                <Image
                  src={google.picture}
                  alt={google.name}
                  width={28}
                  height={28}
                  className="rounded-full shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center text-text-3 text-xs shrink-0">
                  {google.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-1 truncate">{google.name}</p>
                <p className="text-[10px] text-text-3 truncate">{google.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="text-[10px] text-text-3 hover:text-red transition-colors duration-150 shrink-0"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          )}
          <Link
            href="/"
            className="text-xs text-text-3 hover:text-text-2 transition-colors duration-150 block"
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
