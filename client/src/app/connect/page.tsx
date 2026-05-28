'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { api } from '@/lib/api';

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-green flex items-center justify-center shrink-0">
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

const githubIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const twitterIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const checkIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function ConnectPage() {
  const router = useRouter();
  const { google, github, twitter, loading, refresh } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !google) {
      router.replace('/');
    }
  }, [loading, google, router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api.post('/auth/logout', {});
    } finally {
      router.replace('/');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-base">
        <Spinner size={32} className="text-text-3" />
      </div>
    );
  }

  if (!google) return null;

  const githubAvatar = github?.avatar_url ?? null;
  const githubName = github?.name ?? github?.login ?? '';
  const twitterAvatar = twitter?.profile_image_url ?? null;
  const twitterName = twitter?.name ?? twitter?.username ?? '';

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg-base/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-6 h-14 flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="text-xs text-text-3 hover:text-text-2 transition-colors duration-150"
          >
            ← Back
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display font-bold text-3xl text-text-1 mb-3">
              Connect your accounts
            </h1>
            <p className="text-text-2 text-sm leading-relaxed max-w-sm mx-auto">
              Link GitHub to fetch your commits. Connect X to post your tweets.
              GitHub is required — X is optional but needed for posting.
            </p>
          </div>

          {/* Google signed-in banner */}
          <div className="rounded-xl border border-green/30 bg-green/5 p-4 mb-6 flex items-center gap-3">
            {google.picture ? (
              <Image
                src={google.picture}
                alt={google.name}
                width={36}
                height={36}
                className="rounded-full shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center text-text-3 text-sm font-display shrink-0">
                {google.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-1 truncate">{google.name}</p>
              <p className="text-xs text-text-3 truncate">{google.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-green font-medium flex items-center gap-1">
                {checkIcon}
                Signed in
              </span>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-xs text-text-3 hover:text-red transition-colors duration-150 ml-2"
                title="Sign out"
              >
                {loggingOut ? <Spinner size={12} className="text-text-3" /> : 'Sign out'}
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-4 mb-8">
            {/* GitHub card */}
            <div
              className={`rounded-xl border p-5 transition-colors duration-150 ${
                github
                  ? 'border-green/40 bg-bg-surface'
                  : 'border-border bg-bg-surface'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      github ? 'bg-green/10 text-green' : 'bg-bg-elevated text-text-2'
                    }`}
                  >
                    {githubIcon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold text-text-1 text-sm">GitHub</p>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-3 border border-border">
                        Required
                      </span>
                    </div>
                    <p className="text-xs text-text-2 mt-0.5">
                      Access your repos and commit history
                    </p>
                  </div>
                </div>

                {github ? (
                  <div className="flex items-center gap-1.5 text-green text-xs font-medium shrink-0 mt-1">
                    {checkIcon}
                    Connected
                  </div>
                ) : null}
              </div>

              {github ? (
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border">
                  {githubAvatar ? (
                    <Image
                      src={githubAvatar}
                      alt={githubName}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-text-3 text-xs font-display">
                      {githubName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-1 truncate">{githubName}</p>
                    <p className="text-xs text-text-3 truncate">@{github.login}</p>
                  </div>
                  <a
                    href="/auth/github"
                    className="ml-auto text-xs text-text-3 hover:text-text-2 transition-colors duration-150 shrink-0"
                  >
                    Switch account
                  </a>
                </div>
              ) : (
                <a
                  href="/auth/github"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2
                    bg-green text-bg-base font-semibold text-sm px-4 py-2.5 rounded-lg
                    hover:brightness-110 transition-all duration-150"
                >
                  {githubIcon}
                  Connect GitHub
                </a>
              )}
            </div>

            {/* Twitter card */}
            <div
              className={`rounded-xl border p-5 transition-colors duration-150 ${
                twitter
                  ? 'border-blue/30 bg-bg-surface'
                  : 'border-border bg-bg-surface'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      twitter ? 'bg-blue/10 text-blue' : 'bg-bg-elevated text-text-2'
                    }`}
                  >
                    {twitterIcon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold text-text-1 text-sm">X (Twitter)</p>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-3 border border-border">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-text-2 mt-0.5">
                      Post generated tweets directly to X
                    </p>
                  </div>
                </div>

                {twitter ? (
                  <div className="flex items-center gap-1.5 text-blue text-xs font-medium shrink-0 mt-1">
                    {checkIcon}
                    Connected
                  </div>
                ) : null}
              </div>

              {twitter ? (
                <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border">
                  {twitterAvatar ? (
                    <Image
                      src={twitterAvatar}
                      alt={twitterName}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-text-3 text-xs font-display">
                      {twitterName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-1 truncate">{twitterName}</p>
                    <p className="text-xs text-text-3 truncate">@{twitter.username}</p>
                  </div>
                  <a
                    href="/auth/twitter"
                    className="ml-auto text-xs text-text-3 hover:text-text-2 transition-colors duration-150 shrink-0"
                  >
                    Switch account
                  </a>
                </div>
              ) : (
                <a
                  href="/auth/twitter"
                  className="mt-4 w-full inline-flex items-center justify-center gap-2
                    border border-border text-text-2 text-sm px-4 py-2.5 rounded-lg
                    hover:border-border-hover hover:text-text-1 transition-all duration-150"
                >
                  {twitterIcon}
                  Connect X (Twitter)
                </a>
              )}
            </div>
          </div>

          {/* Continue button */}
          <div className="flex flex-col items-center gap-3">
            {github ? (
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2
                  bg-green text-bg-base font-semibold text-sm px-4 py-3 rounded-lg
                  hover:brightness-110 transition-all duration-150"
              >
                Continue to dashboard →
              </Link>
            ) : (
              <button
                disabled
                className="w-full inline-flex items-center justify-center
                  bg-green text-bg-base font-semibold text-sm px-4 py-3 rounded-lg
                  opacity-30 cursor-not-allowed"
              >
                Continue to dashboard →
              </button>
            )}
            <p className="text-xs text-text-3">
              Connect GitHub first to unlock the dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
