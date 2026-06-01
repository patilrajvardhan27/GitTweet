'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
  },
];

function NavLinks() {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[9px] font-bold text-text-3 uppercase tracking-[0.12em] px-1 mb-1">
        Navigation
      </p>
      {navItems.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={[
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
              active
                ? 'bg-green/10 text-green border border-green/20'
                : 'text-text-2 hover:text-text-1 hover:bg-bg-elevated border border-transparent',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            <span className={active ? 'text-green' : 'text-text-3'}>{icon}</span>
            {label}
            {active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green" aria-hidden="true" />
            )}
          </Link>
        );
      })}
    </div>
  );
}

function Logo() {
  const { theme } = useTheme();
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <img
          src={theme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg'}
          alt="Twinker logo"
          width={30}
          height={30}
          aria-hidden="true"
        />
      </div>
      <div>
        <span className="font-display font-bold text-text-1 text-[17px] tracking-tight leading-none">
          Twinker
        </span>
        <p className="text-[9px] text-text-3 uppercase tracking-[0.12em] font-medium mt-0.5 leading-none">
          commit → tweet
        </p>
      </div>
    </div>
  );
}

export function Layout({ google, github, twitter, onDisconnect, onLogout, children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg-base">
      {/* Sidebar */}
      <aside className="w-[268px] shrink-0 flex flex-col border-r border-border bg-bg-surface sidebar-pattern overflow-y-auto custom-scroll">
        {/* Logo bar */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bg-surface/90 backdrop-blur-sm sticky top-0 z-10">
          <Logo />
          <ThemeToggle />
        </div>

        {/* Nav + Accounts */}
        <nav className="flex flex-col gap-5 p-4 flex-1">
          {/* Page links */}
          <NavLinks />

          {/* Accounts */}
          <div className="flex flex-col gap-2">
            <p className="text-[9px] font-bold text-text-3 uppercase tracking-[0.12em] px-1">
              Connected accounts
            </p>
            <AccountCard
              provider="github"
              user={github}
              onDisconnect={() => onDisconnect('github')}
            />
            <AccountCard
              provider="twitter"
              user={twitter}
              onDisconnect={() => onDisconnect('twitter')}
            />
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {google && (
            <div className="flex items-center gap-2.5 group">
              {google.picture ? (
                <Image
                  src={google.picture}
                  alt={google.name}
                  width={30}
                  height={30}
                  className="rounded-full ring-1 ring-white/10 shrink-0"
                />
              ) : (
                <div className="w-[30px] h-[30px] rounded-full bg-bg-elevated ring-1 ring-border
                  flex items-center justify-center text-text-3 text-xs font-semibold shrink-0">
                  {google.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-1 truncate leading-tight">{google.name}</p>
                <p className="text-[10px] text-text-3 truncate">{google.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="text-[10px] text-text-3 hover:text-red transition-colors duration-150 shrink-0 opacity-0 group-hover:opacity-100"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          )}
          <Link
            href="/"
            className="text-[11px] text-text-3 hover:text-text-2 transition-colors duration-150 flex items-center gap-1.5"
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M7 5H3M5 2L2 5l3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to home
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto custom-scroll" id="main-content">
        {children}
      </main>
    </div>
  );
}
