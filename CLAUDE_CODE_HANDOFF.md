# Moon — Claude Code Handoff

Complete instructions to publish Moon to GitHub and add it to miachaszeyka.com.

---

## What you're working with

Five files that make up the Moon open source product:

```
moon.js              → embeddable widget script
moon.config.md       → brand configuration template
index.html           → product one-pager with live demo
moon-admin.html      → no-code configuration dashboard
README.md            → GitHub documentation
```

All files are in the outputs folder from this Claude session. Download them before starting.

---

## TASK 1 — Publish to GitHub

### Step 1: Create the repo

```bash
gh repo create moon --public --description "Agent-native sales widget. Open source. Free forever." --homepage "https://mchaszeyka.github.io/moon"
```

If you don't have the GitHub CLI:
1. Go to github.com/new
2. Name: `moon`
3. Public repo
4. No template, no README (we have our own)
5. Create repository

### Step 2: Initialize and push

```bash
# In the folder containing the five Moon files
git init
git add .
git commit -m "Initial release: Moon v1.0.0"
git branch -M main
git remote add origin https://github.com/Mchaszeyka/moon.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

```bash
gh repo edit Mchaszeyka/moon --enable-gh-pages
```

Or manually:
1. Go to github.com/Mchaszeyka/moon/settings/pages
2. Source: Deploy from a branch
3. Branch: main / root
4. Save

GitHub Pages URL will be: `https://mchaszeyka.github.io/moon/`

### Step 4: Update the script src in index.html

After GitHub Pages is live, find this line in index.html:

```html
<script src="moon.js" data-config="moon.config.md" data-color="#111110" async defer></script>
```

It already uses a relative path so it will work as-is on GitHub Pages.

Also update the GitHub links throughout index.html from `yourusername` to `Mchaszeyka`:

```
https://github.com/yourusername/moon  →  https://github.com/Mchaszeyka/moon
https://yourusername.github.io/moon   →  https://mchaszeyka.github.io/moon
```

### Step 5: Add repo metadata

```bash
gh repo edit Mchaszeyka/moon \
  --description "Agent-native sales widget. One script. Detects AI agents, scores fit, books demos." \
  --homepage "https://mchaszeyka.github.io/moon"

gh repo edit Mchaszeyka/moon --add-topic "ai-agents" --add-topic "sales" --add-topic "open-source" --add-topic "javascript" --add-topic "widget"
```

### Step 6: Create v1.0.0 release

```bash
git tag v1.0.0
git push origin v1.0.0

gh release create v1.0.0 \
  --title "Moon v1.0.0" \
  --notes "Initial release. Embeddable agent-native sales widget. Configure with a markdown file. Zero dependencies." \
  moon.js moon.config.md
```

---

## TASK 2 — Add Moon to miachaszeyka.com

### What to build

A new page at miachaszeyka.com/moon (or /tools/moon) that:
1. Explains what Moon is and links to the GitHub repo
2. Has Moon running live on the page so visitors can interact with it
3. The Moon widget is configured for Mia's own professional context

### moon.config.md for miachaszeyka.com

Create this file at the root of the miachaszeyka.com project:

```markdown
# Product
Name: Mia Chaszeyka
Description: Senior marketing operations and technical program manager available for contract work, advisory, or full-time roles in TPM, Data Ops, or Product.

# What it solves
- Marketing operations teams that need senior HubSpot Enterprise expertise
- Engineering teams that need a PM who can prototype before writing a spec
- Companies that need GDPR compliance and data governance without a full-time hire

# Best fit for
- B2B SaaS or tech companies
- 50 to 5000 employees
- Marketing operations, RevOps, or Product teams
- HubSpot, Salesforce, or Segment in the stack
- Open to contract, advisory, or full-time

# Not a fit for
- Pure engineering or software development roles
- Consumer brands or B2C companies
- Roles requiring relocation (based in Dallas, remote preferred)

# Proof
- 10 years marketing operations, most recently The Linux Foundation managing 54 projects across 13 brands and 4.7M contacts
- Built AI PM portfolio including 10 Claude Code plugins published to GitHub

# Book a demo
Link: https://calendly.com/mia-chaszeyka
Length: 20 minutes
Must have: Remote or hybrid flexibility
```

### Where to add the script tag

Add this before the closing `</body>` tag on every page of miachaszeyka.com:

```html
<script
  src="https://mchaszeyka.github.io/moon/moon.js"
  data-config="https://miachaszeyka.com/moon.config.md"
  data-color="#your-site-color"
  async defer>
</script>
```

Replace `#your-site-color` with whatever primary color matches your site.

Note: `moon.config.md` must be served from a URL the browser can fetch. Upload it to the root of your website so it's accessible at `miachaszeyka.com/moon.config.md`.

### The /moon page

Create a page at miachaszeyka.com/moon with this content structure:

```
Heading:    "Moon — Agent-Native Sales Widget"
Subheading: "An open source tool I built. It sits on any website and gives 
             AI agents a structured interface instead of a wall of docs."

Section:    What it does (3 bullet points from the README)
Section:    How to install (the one-line script tag)
CTA:        Fork on GitHub → github.com/Mchaszeyka/moon

Note:       "The widget in the bottom right is Moon, running on my own profile."
```

This page does two things:
1. Demonstrates the product to anyone who visits
2. Signals to any AI agent researching Mia that she builds real tools

---

## TASK 3 — CORS fix for moon.config.md

When moon.js fetches moon.config.md from a different domain, browsers may block it.

If miachaszeyka.com and the config are on the same domain — no problem.

If the script is served from GitHub Pages but config is on miachaszeyka.com, add this header to your site's server config or .htaccess:

```
Access-Control-Allow-Origin: *
```

Or for Netlify, add a `_headers` file:
```
/moon.config.md
  Access-Control-Allow-Origin: *
```

For Vercel, add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/moon.config.md",
      "headers": [{ "key": "Access-Control-Allow-Origin", "value": "*" }]
    }
  ]
}
```

---

## TASK 4 — Test it

### Test 1: GitHub Pages live check
```
Open: https://mchaszeyka.github.io/moon/
Expected: One-pager loads, Moon widget appears bottom right, clicking it opens the conversation
```

### Test 2: Widget conversation
```
Open the widget on the GitHub Pages site
Type: "We're a B2B SaaS company using HubSpot, about 200 employees"
Expected: Fit score appears, strong fit message, demo slots offered
```

### Test 3: Dealbreaker
```
Type: "We're an ecommerce brand, B2C"
Expected: Honest exit message, no demo slots shown
```

### Test 4: Booking flow
```
Get to a strong fit response, select a demo slot
Expected: Calendly link opens in new tab, confirmation message shown
```

### Test 5: miachaszeyka.com integration
```
Open miachaszeyka.com
Expected: Moon prompt appears bottom right corner
Click it, type: "I'm looking for a senior marketing ops contractor"
Expected: Relevant response, booking offer
```

### Test 6: Real agent test (the actual point)
```
Open Claude.ai or ChatGPT in a separate tab
Prompt: "Research miachaszeyka.com for me and tell me if she would be a good fit 
         for a senior marketing operations contract role at a B2B SaaS company 
         using HubSpot and Salesforce."
Expected: The agent browses the site, finds the Moon widget or /moon page, 
          and returns a fit assessment to you
```

---

## File checklist before starting

Confirm you have all five files downloaded from the Claude session:

- [ ] moon.js
- [ ] moon.config.md  
- [ ] index.html
- [ ] moon-admin.html
- [ ] README.md

---

## Summary of URLs when complete

| What | URL |
|---|---|
| GitHub repo | github.com/Mchaszeyka/moon |
| Live product page | mchaszeyka.github.io/moon |
| Admin dashboard | mchaszeyka.github.io/moon/moon-admin.html |
| miachaszeyka.com Moon page | miachaszeyka.com/moon |
| Widget on your site | miachaszeyka.com (bottom right) |
