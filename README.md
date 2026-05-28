# GitTweet

GitTweet lets you connect GitHub and X (Twitter), fetch today's commits from any repository, generate an AI-powered tweet using Claude, and post it directly to X — all from one clean interface.

---

## Prerequisites

- **Node.js 20+**
- A **GitHub OAuth App** (for GitHub login + repo access)
- A **Twitter Developer App** with OAuth 2.0 and Read+Write permissions
- An **Anthropic API key** (for Claude tweet generation)

---

## Create a GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**
2. Set **Application name**: `GitTweet`
3. Set **Homepage URL**: `http://localhost:3000` (update to your domain in production)
4. Set **Authorization callback URL**: `http://localhost:3001/auth/github/callback`
5. Click **Register application**
6. Copy the **Client ID** and generate a **Client Secret** — save both

---

## Create a Twitter App

1. Go to [developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. In **User authentication settings**, enable **OAuth 2.0**
4. Set **App permissions** to **Read and Write**
5. Set **Type of App** to **Web App**
6. Set **Callback URI**: `http://localhost:3001/auth/twitter/callback`
7. Copy the **Client ID** and **Client Secret**

---

## Local development

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd gittweet

# 2. Set up server environment
cp server/.env.example server/.env
# Edit server/.env with your credentials

# 3. Set up client environment (optional in dev — proxy handles it)
cp client/.env.example client/.env.local

# 4. Install dependencies
cd server && npm install && cd ../client && npm install && cd ..

# 5. Start the server (port 3001)
cd server && npm run dev

# 6. In another terminal, start the client (port 3000)
cd client && npm run dev
```

Visit `http://localhost:3000`.

> The Next.js dev server proxies `/auth/*` and `/api/*` to `localhost:3001` automatically.

---

## Deploy to Render + Vercel

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy server to Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Render detects `render.yaml` automatically — confirm settings
4. Add environment variables in the Render dashboard:
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
   - `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`
   - `ANTHROPIC_API_KEY`
   - `CLIENT_URL` → your Vercel URL (e.g. `https://gittweet.vercel.app`)
   - `SERVER_URL` → your Render URL (e.g. `https://gittweet-server.onrender.com`)
5. Note your Render URL

### 3. Deploy client to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
2. Set **Root Directory** to `client`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` → your Render URL (e.g. `https://gittweet-server.onrender.com`)
4. Deploy

### 4. Update OAuth callback URLs

After deployment, update the callback URLs in both portals to use your production URLs:

- **GitHub**: `https://gittweet-server.onrender.com/auth/github/callback`
- **Twitter**: `https://gittweet-server.onrender.com/auth/twitter/callback`

Also update the GitHub OAuth App's homepage URL to your Vercel URL.

---

## Scope of improvements

### Quick wins

- **Tweet history** — nothing is saved after posting; add localStorage or a simple file-based store
- **OAuth error messages** — failures silently redirect with `?error=` in the URL but show nothing to the user
- **Refresh button** — no way to re-fetch commits after the initial load without a page refresh
- **Date range picker** — date window is hardcoded; let users pick a custom range
- **Tweet tone/style selector** — same Claude prompt for everyone; add options like "casual", "technical", "motivational"

### UX & product

- **Repos loading state** — `reposLoading` state exists but is never shown in the UI
- **Character limit feedback during generation** — the 280-char limit is only checked on post, not while generating
- **Multi-repo support** — can only view one repo at a time; switching clears everything
- **Step flow clarity** — users can't tell if context goes before or after generation

### Reliability

- **No retry logic** — a single timeout on GitHub/Twitter API calls results in a permanent error
- **GitHub token expiry not handled** — Twitter has refresh logic but GitHub doesn't; 401s fail silently
- **Rate limits ignored** — 429 responses from GitHub, Twitter, and Claude all fall through as generic errors
- **Redis optional but risky** — app silently falls back to MemoryStore in production, which loses sessions on restart

### Security

- **No CSRF protection** on `POST /api/generate-tweet` and `POST /api/post-tweet`
- **Commit messages passed raw to Claude** — no sanitization, potential for prompt injection
- **Session secret defaults** in `config.js` should hard-fail in production, not just warn

### Longer term

- **No database** — all state is session-only; add PostgreSQL for tweet history, preferences, analytics
- **No tests** — zero coverage on any critical path (OAuth, generation, posting)
- **TypeScript on the server** — backend is plain JS, losing refactor safety
- **Logging infrastructure** — only `console.log` used; no request IDs or structured logs

---

## Environment variables reference

| Variable | Description | Where to get it |
|---|---|---|
| `SESSION_SECRET` | Secret for signing session cookies | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | GitHub developer settings |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | GitHub developer settings |
| `TWITTER_CLIENT_ID` | Twitter App OAuth 2.0 client ID | Twitter developer portal |
| `TWITTER_CLIENT_SECRET` | Twitter App OAuth 2.0 client secret | Twitter developer portal |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | [console.anthropic.com](https://console.anthropic.com) |
| `CLIENT_URL` | Full URL of the frontend app | Your Vercel URL |
| `SERVER_URL` | Full URL of the backend server | Your Render URL |
| `REDIS_URL` | Redis connection URL (optional) | Redis Cloud, Upstash, etc. |
| `NEXT_PUBLIC_API_URL` | Backend URL for the Next.js client | Your Render URL |
