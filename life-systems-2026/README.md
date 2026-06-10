# Life Systems 2026 — Self-Hosted Dashboard

Mia's private life-operations dashboard (Next.js 14, App Router), converted from a claude.ai
artifact for deployment on Vercel with password gating and a server-side Anthropic API proxy.

## Architecture

- `components/LifeDashboard.jsx` — the entire dashboard UI (client component).
  Data persists in **localStorage** (per browser/device — see Known Limits).
- `app/api/assistant/route.js` — server-side proxy to the Anthropic Messages API.
  The API key lives ONLY in env vars; it is never shipped to the browser.
- `middleware.js` — password gate. Every route except `/login` requires an auth
  cookie. **Fails closed**: if `DASHBOARD_PASSWORD` is unset, the site returns 503
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

### 3. Attach the custom domain
Recommended subdomain: `dashboard.miachaszeyka.com` (keeps the main site untouched).
```bash
npx vercel domains add dashboard.miachaszeyka.com
```
Then add the DNS record Vercel prints (typically a CNAME to `cname.vercel-dns.com`)
at the registrar/DNS host for miachaszeyka.com. Wait for verification, then confirm
https://dashboard.miachaszeyka.com loads the login page.

### 4. Post-deploy verification checklist
- [ ] Visiting the root URL while logged out → redirected to /login
- [ ] Wrong password → inline error, no entry
- [ ] Correct password → dashboard loads with aurora/glass theme
- [ ] Assistant tab: sending "what's coming up this week?" returns a reply
- [ ] A change (check a task) survives a page reload (localStorage)
- [ ] /api/assistant called while logged out (curl, no cookie) → 401

## Known limits (tell Mia if she asks)

1. **localStorage = per-browser.** Phone and laptop each keep separate data; clearing
   browser data erases it. The claude.ai artifact version synced per-account; this
   version trades that for self-hosting. Upgrade path if cross-device sync is wanted
   later: swap the `storage` adapter in `LifeDashboard.jsx` for Vercel KV or Supabase
   (the adapter is 12 lines and async-ready on purpose).
2. **Password gate is solid for personal use, not enterprise auth.** Single shared
   password, no rate limiting, no 2FA. Fine for one person's dashboard.
3. **API costs.** Assistant + daily horoscope calls bill Mia's Anthropic API key.
   Typical usage here is well under a few dollars/month, but it is metered.
4. The page is `noindex`, and the gate prevents crawling regardless.
