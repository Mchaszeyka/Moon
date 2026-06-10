# Life Systems 2026 — Self-Hosted Dashboard

Mia's private life-operations dashboard (Next.js 14, App Router), converted from a claude.ai
artifact for deployment on Vercel with password gating and a server-side Anthropic API proxy.

## Architecture

- `components/LifeDashboard.jsx` — the entire dashboard UI (client component).
  Data persists in **localStorage** (per browser/device — see Known Limits).
- `app/api/assistant/route.js` — server-side proxy to the Anthropic Messages API.
  The API key lives ONLY in env vars; it is never shipped to the browser.
- `app/api/strava/route.js` — server-side Strava proxy (Fitness tab). Refreshes the
  access token from a stored refresh token, fetches activities, returns an aggregated
  training summary. Strava credentials live ONLY in env vars.
- `app/api/travel/*` — Fun & Travel mood boards. `route.js` (list/save boards in
  Vercel KV), `publish/route.js` (publish/unpublish a public share snapshot),
  `upload/route.js` (photo upload to Vercel Blob).
- `app/share/[token]/page.js` — **public**, read-only view of a published trip board.
  `middleware.js` lets `/share` bypass the password gate; only the sanitized snapshot
  written at publish time is ever readable there.
- `middleware.js` — password gate. Every route except `/login` and `/share` requires an
  auth cookie. **Fails closed**: if `DASHBOARD_PASSWORD` is unset, the site returns 503
  rather than serving unprotected.
- `app/login/page.js` + `app/api/login/route.js` — login form; on success sets a
  60-day httpOnly cookie (SHA-256 token, not the raw password).
- `app/layout.js` — sets `robots: noindex, nofollow`.

## Instructions for Claude Code

You are deploying this app to Vercel for Mia. Follow these steps exactly and
confirm each before moving on.

### 1. Local sanity check
```bash
npm install
cp .env.local.example .env.local
# Edit .env.local: set ANTHROPIC_API_KEY (Mia provides; from console.anthropic.com)
# and DASHBOARD_PASSWORD (Mia chooses; do not invent one silently)
npm run dev
```
Verify: visiting http://localhost:3000 redirects to /login; the correct password
enters the dashboard; the Assistant tab returns a reply (proves the API proxy works).

### 2. Deploy to Vercel
```bash
npx vercel login        # Mia authenticates in the browser
npx vercel              # link/create the project; accept defaults
npx vercel env add ANTHROPIC_API_KEY production
npx vercel env add DASHBOARD_PASSWORD production
npx vercel --prod
```

### 2b. Optional integrations (Fitness + Travel)
These tabs degrade gracefully — without their env vars they show a setup card instead
of erroring. Add them when ready (see the dedicated sections below), then redeploy:
```bash
# Strava (Fitness tab)
npx vercel env add STRAVA_CLIENT_ID production
npx vercel env add STRAVA_CLIENT_SECRET production
npx vercel env add STRAVA_REFRESH_TOKEN production
# Travel mood board: add a KV store and a Blob store in Vercel → Storage and
# connect them to the project — KV_REST_API_* and BLOB_READ_WRITE_TOKEN are injected
# automatically. No manual env entry needed.
```

### 3. Attach the custom domain
Mia wants the dashboard on the **apex** `miachaszeyka.com`.
```bash
npx vercel domains add miachaszeyka.com
```
Then add the DNS records Vercel prints at the registrar/DNS host. For an apex domain
that's usually an **A record to `76.76.21.21`** (Vercel may also offer nameserver
delegation); a `www` CNAME to `cname.vercel-dns.com` is typical too. Wait for
verification, then confirm https://miachaszeyka.com loads the login page.

⚠️ **Apex trade-off:** `miachaszeyka.com` may currently serve another site. Pointing the
apex here **replaces** whatever lives at the root. If the existing site should stay,
use a subdomain (`dashboard.miachaszeyka.com`) instead — same steps, different host.
Confirm with Mia before repointing the apex.

### 4. Post-deploy verification checklist
- [ ] Visiting the root URL while logged out → redirected to /login
- [ ] Wrong password → inline error, no entry
- [ ] Correct password → dashboard loads with aurora/glass theme
- [ ] Assistant tab: sending "what's coming up this week?" returns a reply
- [ ] A change (check a task) survives a page reload (localStorage)
- [ ] /api/assistant called while logged out (curl, no cookie) → 401

## Strava setup (Fitness tab) — one-time, ~5 min
The Fitness tab reads your Strava activities via a server-side proxy. Mint a long-lived
refresh token once and store three env vars; nothing touches the browser.

1. Go to **https://www.strava.com/settings/api** and create an app (any name; set
   "Authorization Callback Domain" to `localhost`). Note the **Client ID** and
   **Client Secret**.
2. In a browser, authorize with the read scope (replace `CLIENT_ID`):
   ```
   https://www.strava.com/oauth/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all
   ```
   Approve; you'll be redirected to `http://localhost/?...&code=THE_CODE&...` (the page
   won't load — just copy `THE_CODE` from the address bar).
3. Exchange the code for a **refresh token**:
   ```bash
   curl -X POST https://www.strava.com/oauth/token \
     -d client_id=CLIENT_ID -d client_secret=CLIENT_SECRET \
     -d code=THE_CODE -d grant_type=authorization_code
   ```
   Copy `refresh_token` from the JSON.
4. Set `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REFRESH_TOKEN` in Vercel and
   redeploy. The tab fetches on open, caches, and offers a Refresh button.

Hooks: a weekly training summary is fed to the Assistant (so it can coach push vs.
rest), the "Marathon base build" milestone auto-nudges from your longest run, and
race-type activities offer a one-tap "Log win".

## Travel mood board setup (Fun & Travel tab)
Trip boards live in **Vercel KV** and photos in **Vercel Blob**, so boards survive
across devices and back public share links.

1. Vercel → **Storage** → create a **KV** store and a **Blob** store; connect both to
   this project. Vercel injects `KV_REST_API_URL`, `KV_REST_API_TOKEN`, and
   `BLOB_READ_WRITE_TOKEN` automatically. Redeploy.
2. In the tab: create a trip, add photos/notes/checklist, then **Publish shareable
   link** → copy the `/share/<token>` URL. That page is **public** (no password) and
   read-only; **Unpublish** kills it instantly. Each link exposes only that one board,
   never the rest of the dashboard.

Without these stores the tab simply shows a setup card — the rest of the app is
unaffected.

## Known limits (tell Mia if she asks)

1. **localStorage = per-browser.** Phone and laptop each keep separate data; clearing
   browser data erases it. The claude.ai artifact version synced per-account; this
   version trades that for self-hosting. Upgrade path if cross-device sync is wanted
   later: swap the `storage` adapter in `LifeDashboard.jsx` for Vercel KV or Supabase
   (the adapter is 12 lines and async-ready on purpose). **Exception:** the Fun &
   Travel boards already sync server-side via Vercel KV — they're the proof-of-concept
   for moving the rest of the dashboard off localStorage.
5. **Public share links are unauthenticated.** A published `/share/<token>` board is
   viewable by anyone with the link (that's the point). Keep boards share-appropriate;
   unpublish to revoke. Only the published snapshot is exposed, never other dashboard data.
2. **Password gate is solid for personal use, not enterprise auth.** Single shared
   password, no rate limiting, no 2FA. Fine for one person's dashboard.
3. **API costs.** Assistant + daily horoscope calls bill Mia's Anthropic API key.
   Typical usage here is well under a few dollars/month, but it is metered.
4. The page is `noindex`, and the gate prevents crawling regardless.
