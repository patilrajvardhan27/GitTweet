'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MockTweetCard() {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5 max-w-sm w-full shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center text-text-3 font-display shrink-0">
          R
        </div>
        <div>
          <p className="text-sm font-semibold text-text-1">Raj Patil</p>
          <p className="text-xs text-text-2">@rajpatil</p>
        </div>
        <div className="ml-auto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-text-3)" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      </div>
      <p className="text-sm text-text-1 leading-relaxed">
        Shipped authentication today — GitHub OAuth working end-to-end with PKCE flow for Twitter.
        Sessions persist across deploys. Feels good to tick this off 🚀{' '}
        <span className="text-blue">#buildinpublic #indiedev #100daysofcode</span>
      </p>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <span className="text-xs text-text-3 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
          </svg>
          24
        </span>
        <span className="text-xs text-text-3 flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M23.77 15.67c-.292-.293-.767-.293-1.06 0l-2.22 2.22V7.65c0-2.068-1.683-3.75-3.75-3.75h-5.85c-.414 0-.75.336-.75.75s.336.75.75.75h5.85c1.24 0 2.25 1.01 2.25 2.25v10.24l-2.22-2.22c-.293-.293-.768-.293-1.06 0s-.294.768 0 1.06l3.5 3.5c.145.147.337.22.53.22s.383-.072.53-.22l3.5-3.5c.294-.292.294-.767 0-1.06zm-10.66 3.28H7.26c-1.24 0-2.25-1.01-2.25-2.25V6.46l2.22 2.22c.148.147.34.22.532.22s.384-.073.53-.22c.293-.293.293-.768 0-1.06l-3.5-3.5c-.293-.294-.768-.294-1.06 0l-3.5 3.5c-.294.292-.294.767 0 1.06s.767.293 1.06 0l2.22-2.22V16.7c0 2.068 1.683 3.75 3.75 3.75h5.85c.414 0 .75-.336.75-.75s-.337-.75-.75-.75z" />
          </svg>
          8
        </span>
      </div>
    </div>
  );
}

const steps = [
  {
    number: '01',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
    title: 'Sign in with Google',
    desc: 'Create your account instantly — one click, no passwords, no forms. Your Google account is all you need.',
  },
  {
    number: '02',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: 'Connect GitHub and X',
    desc: 'Link GitHub to pull your commits, and X (Twitter) to post — one-click OAuth for each, no passwords stored.',
  },
  {
    number: '03',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: 'Generate & post',
    desc: 'Claude writes an authentic developer tweet from your commits. Edit it, then post directly to X.',
  },
];

const features = [
  {
    title: 'Works with any repo',
    desc: 'Public or private repos — any GitHub repository you own.',
    icon: '⬡',
  },
  {
    title: 'AI-powered voice',
    desc: 'Claude generates tweets that sound like a developer, not a PR bot.',
    icon: '◈',
  },
  {
    title: 'One-click posting',
    desc: 'Authenticated with Twitter OAuth — post without leaving the app.',
    icon: '◎',
  },
  {
    title: 'Always free',
    desc: 'Bring your own Anthropic API key. No subscriptions.',
    icon: '◇',
  },
];

const OAUTH_ERRORS: Record<string, string> = {
  google_auth_failed: 'Google sign-in failed. Please try again.',
  github_auth_failed: 'GitHub sign-in failed. Please try again.',
  twitter_auth_failed: 'X (Twitter) sign-in failed. Please try again.',
};

export default function LandingPage() {
  const router = useRouter();
  const { google, github, loading } = useAuth();
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errKey = params.get('error');
    if (errKey) {
      setOauthError(OAUTH_ERRORS[errKey] ?? 'Sign-in failed. Please try again.');
      window.history.replaceState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    if (!oauthError && !loading) {
      if (google && github) {
        router.replace('/dashboard');
      } else if (google) {
        router.replace('/connect');
      }
    }
  }, [loading, google, github, router, oauthError]);

  return (
    <div className="min-h-screen bg-bg-base">
      {oauthError && (
        <div className="bg-red/10 border-b border-red/20 px-6 py-3 flex items-center justify-between gap-4" role="alert">
          <p className="text-sm text-red">{oauthError}</p>
          <button
            onClick={() => setOauthError(null)}
            className="text-red/60 hover:text-red transition-colors duration-150 shrink-0"
            aria-label="Dismiss error"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg-base/80 backdrop-blur-sm" aria-label="Main navigation">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo />
          <a href="#how" className="text-xs text-text-3 hover:text-text-2 transition-colors duration-150">
            How it works
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 flex flex-col lg:flex-row items-center gap-12" aria-label="Hero">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-bg-surface text-xs text-text-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green inline-block"></span>
            Powered by Claude
          </div>
          <h1 className="font-display font-bold text-5xl lg:text-6xl text-text-1 leading-[1.1] mb-5">
            Share your<br />
            <span className="text-gradient">code journey.</span>
          </h1>
          <p className="text-text-2 text-lg max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed">
            Connect GitHub and X, fetch today&apos;s commits, and let AI write an authentic tweet about
            your progress — in seconds.
          </p>
          <div className="flex items-center gap-3 justify-center lg:justify-start flex-wrap">
            <a
              href="/auth/google"
              className="inline-flex items-center justify-center gap-2.5
                bg-white text-[#1f1f1f] font-semibold text-sm px-5 py-3 rounded-lg
                border border-[#dadce0] shadow-sm
                hover:shadow-md hover:bg-[#f8f9fa] transition-all duration-150"
            >
              <GoogleIcon />
              Sign in with Google
            </a>
            <a href="#how" className="text-sm text-text-2 hover:text-text-1 transition-colors duration-150 px-2 py-3">
              See how it works →
            </a>
          </div>
        </div>

        <div className="flex-1 flex justify-center lg:justify-end">
          <MockTweetCard />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-20 border-t border-border" aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-display font-bold text-3xl text-text-1 text-center mb-4">
          How it works
        </h2>
        <p className="text-text-2 text-center mb-14 max-w-lg mx-auto">
          Three steps from sign-up to tweet. No complicated setup.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <article
              key={step.number}
              className="bg-bg-surface border border-border rounded-xl p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-text-2">
                  {step.icon}
                </div>
                <span className="font-mono text-text-3 text-sm">{step.number}</span>
              </div>
              <div>
                <h3 className="font-display font-semibold text-text-1 mb-2">{step.title}</h3>
                <p className="text-text-2 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-border" aria-labelledby="features-heading">
        <h2 id="features-heading" className="font-display font-bold text-3xl text-text-1 text-center mb-14">
          Built for developers
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <article
              key={f.title}
              className="bg-bg-surface border border-border rounded-xl p-5 hover:border-border-hover transition-colors duration-150"
            >
              <div className="text-2xl text-text-3 mb-3 font-mono">{f.icon}</div>
              <h3 className="font-display font-semibold text-text-1 text-sm mb-1.5">{f.title}</h3>
              <p className="text-text-2 text-xs leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-border text-center" aria-label="Call to action">
        <h2 className="font-display font-bold text-3xl text-text-1 mb-4">
          Start sharing today
        </h2>
        <p className="text-text-2 mb-8 max-w-sm mx-auto">
          Sign in with Google in one click. Your first tweet is seconds away.
        </p>
        <a
          href="/auth/google"
          className="inline-flex items-center justify-center gap-2.5
            bg-white text-[#1f1f1f] font-semibold text-sm px-5 py-3 rounded-lg
            border border-[#dadce0] shadow-sm
            hover:shadow-md hover:bg-[#f8f9fa] transition-all duration-150"
        >
          <GoogleIcon />
          Sign in with Google
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-border" aria-label="Footer">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo />
          <p className="text-xs text-text-3">© {new Date().getFullYear()} GitTweet</p>
        </div>
      </footer>

      {loading && (
        <div className="fixed bottom-4 right-4">
          <Spinner size={18} className="text-text-3" />
        </div>
      )}
    </div>
  );
}
