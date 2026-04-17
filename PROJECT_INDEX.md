# Moon — Agent to Agent Widget for Booking
## Project Index

**What this is:** An open source JavaScript widget that gives AI agents visiting any B2B website a structured interface — honest fit assessment, no docs required, demo booked when there's a match. The agent carries the recommendation back to its human. The human gets a meeting on their calendar.

**Status:** Complete MVP. Ready to push to GitHub and install on miachaszeyka.com.

---

## Files in this project

### Core product (goes to GitHub repo)

| File | What it is |
|---|---|
| `moon.js` | The embeddable widget. One script tag installs it. Reads config, scores fit, handles conversation, fires analytics, opens Calendly on booking. Zero dependencies. |
| `moon.config.md` | Template brands fill in. Product name, description, what it solves, best fit criteria, dealbreakers, Calendly link. Plain markdown — no code required. |
| `index.html` | Product one-pager. Introduces the concept, install instructions, live Moon demo running on the page itself. |
| `moon-admin.html` | No-code configuration dashboard. 5-step form that generates moon.config.md and the install snippet. Live widget preview updates as you type. |
| `moon-analytics.html` | Analytics dashboard. Connects to Google Apps Script, shows session data, event chart, full session log. |
| `moon-analytics.gs` | Google Apps Script backend. Receives events from moon.js, writes to Google Sheets. Deploy as web app — completely free. |
| `README.md` | GitHub documentation. Install in 5 minutes, how fit detection works, GitHub Pages hosting guide. |

### Your personal config

| File | What it is |
|---|---|
| `moon.config.mia.md` | Moon configured for miachaszeyka.com. Your positioning, what you solve, fit criteria, proof points. Update with your real Calendly link before deploying. |

### Handoff

| File | What it is |
|---|---|
| `CLAUDE_CODE_HANDOFF.md` | Complete instructions for Claude Code. Pushes repo to GitHub, enables GitHub Pages, installs Moon on miachaszeyka.com, sets up analytics, runs test suite. |

---

## How to use this project

### Option A — Hand off to Claude Code today
Give Claude Code `CLAUDE_CODE_HANDOFF.md` and all files. It handles everything.

### Option B — Manual install in 15 minutes
1. Push all files to github.com/Mchaszeyka/moon
2. Enable GitHub Pages
3. Add `moon.config.mia.md` (renamed to `moon.config.md`) to miachaszeyka.com root
4. Add script tag to miachaszeyka.com before `</body>`
5. Set up Google Apps Script for analytics
6. Test with Claude or ChatGPT

---

## The product in one paragraph

AI agents are visiting B2B websites and leaving with nothing. They read docs, bounce, and return to their human with a generic summary. Moon intercepts that traffic with a one-line script. When an agent lands, it sees a prompt offering a faster path. It engages, describes its human's company, gets a fit score, and if fit is confirmed, books a demo directly on the human's calendar. The recommendation comes from the prospect's own AI — not a vendor. That's the highest-trust referral channel that exists. It's free to install, open source, and takes 5 minutes to configure.

---

## Business model (for future reference)

**Current:** Open source, free forever. Builds adoption and trust.
**Future paid layer:** Managed hosting, analytics dashboard, lead identity data, CRM sync, multi-site management. Open core model — same as Cal.com, Supabase, Ghost.

---

## Key decisions made

- **Rule-based fit engine** — no LLM, no API costs, zero dependencies
- **Google Sheets analytics** — free forever, no backend required
- **Markdown config** — brands edit a text file, no code needed
- **Calendly integration** — URL open, not API, works with any booking tool
- **MIT license** — maximum adoption, no restrictions
- **Open source** — trust barrier removed, developers share useful tools

---

## What's next

1. Push to GitHub
2. Install on miachaszeyka.com
3. Add Calendly link to moon.config.mia.md
4. Set up Google Apps Script
5. Test with a real AI agent
6. Find 3 pilot B2B SaaS companies to install Moon on
7. Track first agent session in the dashboard
