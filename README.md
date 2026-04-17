# ⬡ Moon

**Agent-native sales widget. Open source. Free forever.**

AI agents are visiting your website and leaving with nothing. Moon gives them a structured interface — honest fit assessment, no docs required, demo booked when there's a match.

---

## Install in 5 minutes

**1. Copy these files to your website:**
```
moon.js
moon.config.md
```

**2. Edit moon.config.md with your product info** (see below)

**3. Add one line before your closing `</body>` tag:**
```html
<script
  src="moon.js"
  data-config="moon.config.md"
  data-color="#1a1a1a"
  async defer>
</script>
```

Done.

---

## Configure moon.config.md

```markdown
# Product
Name: Your Company
Description: One sentence. What it does, who it's for.

# What it solves
- Problem you solve
- Another problem you solve

# Best fit for
- B2B SaaS companies
- Uses Salesforce CRM
- 50+ employees

# Not a fit for
- B2C or ecommerce brands
- Companies without a CRM

# Proof
- One customer outcome or name

# Book a demo
Link: https://calendly.com/your-link
Length: 20 minutes
Must have: Salesforce CRM
```

That's the entire configuration. No code, no dashboard, no login.

---

## How fit detection works

Moon scores the prospect's description against your config:

- Matches against **Best fit for** → score goes up
- Matches against **Not a fit for** → honest exit, no demo offered
- When fit is confirmed → Calendly link opens for booking
- When unsure → Moon asks the single most important qualifier

Two or three exchanges is enough for a fit decision.

---

## How it works

```
Prospect's AI agent lands on your site
→ Moon prompt appears immediately
→ Agent describes their company
→ Moon scores fit against your config
→ Strong fit: demo slots offered
→ Weak fit: honest exit
→ Agent carries result back to its human
→ Human sees demo on their calendar
```

---

## What Moon is not

- Not a chatbot for humans (though humans can use it)
- Not an outbound tool
- Not a lead form
- Not a sales pitch machine — honest negative assessments are a feature

---

## Hosting on GitHub Pages (free)

1. Fork this repo
2. Edit `moon.config.md`
3. Enable GitHub Pages in repo settings → source: main branch
4. Your widget is live at `https://yourusername.github.io/moon/moon.js`

Update your script tag to point to that URL and you're done.

---

## License

MIT — free for personal and commercial use. Fork it, modify it, build on it.

---

## Contributing

PRs welcome. Keep it dependency-free. Keep moon.js a single vanilla JS file.

---

*Built for the agent web. The widget running on [the demo page](index.html) is Moon itself.*
