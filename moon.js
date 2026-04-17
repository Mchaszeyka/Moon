/**
 * Moon — Agent-Native Sales Widget
 * Open Source · MIT License
 * github.com/Mchaszeyka/moon
 *
 * Install:
 * <script src="moon.js"
 *   data-config="moon.config.md"
 *   data-color="#1a1a1a"
 *   data-analytics="YOUR_GOOGLE_APPS_SCRIPT_URL"
 *   async defer>
 * </script>
 */

(function () {
  "use strict";

  // ── Analytics ─────────────────────────────────────────────────────────────
  const Analytics = {
    endpoint: null,
    sessionId: "moon-" + Math.random().toString(36).slice(2, 10),
    sessionStart: Date.now(),

    // Session data
    messageCount: 0,
    fitScore: null,
    bookingOffered: false,
    bookingClicked: false,
    firstMessage: null,
    allQueries: [],
    pagesVisited: [],
    lastEventTime: Date.now(),

    // Collected once on init
    meta: {},

    init(endpoint) {
      this.endpoint = endpoint || null;
      if (!endpoint) return;

      // Collect all passive data immediately
      this.meta = {
        // Page & navigation
        pageUrl:        window.location.href,
        pagePath:       window.location.pathname,
        pageTitle:      document.title,
        referrer:       document.referrer || "direct",
        referrerDomain: document.referrer ? (new URL(document.referrer).hostname) : "direct",

        // UTM params
        utm_source:   new URLSearchParams(window.location.search).get("utm_source") || "",
        utm_medium:   new URLSearchParams(window.location.search).get("utm_medium") || "",
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
        utm_content:  new URLSearchParams(window.location.search).get("utm_content") || "",
        utm_term:     new URLSearchParams(window.location.search).get("utm_term") || "",

        // Device & browser
        userAgent:      navigator.userAgent,
        language:       navigator.language,
        screenWidth:    screen.width,
        screenHeight:   screen.height,
        viewportWidth:  window.innerWidth,
        viewportHeight: window.innerHeight,
        deviceType:     /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
        timezone:       Intl.DateTimeFormat().resolvedOptions().timeZone,

        // Session context
        localTime:      new Date().toLocaleString(),
        dayOfWeek:      new Date().toLocaleDateString("en-US", { weekday: "long" }),
        hourOfDay:      new Date().getHours(),
      };

      // Track page changes for SPAs
      this.pagesVisited.push({ path: window.location.pathname, title: document.title, time: new Date().toISOString() });
      const origPushState = history.pushState.bind(history);
      history.pushState = function (...args) {
        origPushState(...args);
        Analytics.pagesVisited.push({ path: window.location.pathname, title: document.title, time: new Date().toISOString() });
      };
    },

    fire(event, extra = {}) {
      if (!this.endpoint) return;

      const now = Date.now();
      const payload = {
        // Identity
        sessionId:        this.sessionId,
        event,
        timestamp:        now,
        localTime:        new Date(now).toLocaleString(),

        // Timing
        sessionDuration:  Math.round((now - this.sessionStart) / 1000) + "s",
        timeSinceLastEvent: Math.round((now - this.lastEventTime) / 1000) + "s",

        // Conversation
        messageCount:     this.messageCount,
        fitScore:         this.fitScore,
        bookingOffered:   this.bookingOffered,
        bookingClicked:   this.bookingClicked,
        firstMessage:     this.firstMessage,
        allQueries:       this.allQueries.join(" | "),

        // Navigation
        pagesVisited:     this.pagesVisited.map(p => p.path).join(" → "),
        pageCount:        this.pagesVisited.length,

        // Spread all meta
        ...this.meta,

        // Allow overrides
        ...extra,
      };

      this.lastEventTime = now;

      try {
        fetch(this.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          mode: "no-cors",
        }).catch(() => {});
      } catch (e) {}
    },

    trackQuery(text) {
      this.allQueries.push(text.slice(0, 100));
      this.messageCount++;
    },
  };

  // ── Config parser ─────────────────────────────────────────────────────────
  function parseConfig(md) {
    const config = {
      product: { name: "", description: "", solves: [], proof: [] },
      fit: { bestFor: [], notFor: [], mustHave: "" },
      booking: { link: "", length: "20 minutes", confirm: "" },
    };
    const lines = md.split("\n").map(l => l.trim()).filter(Boolean);
    let section = "";
    for (const line of lines) {
      if (line.startsWith("# ")) { section = line.slice(2).toLowerCase().replace(/\s+/g, "_"); continue; }
      if (section === "product") {
        if (line.startsWith("Name:")) config.product.name = line.slice(5).trim();
        else if (line.startsWith("Description:")) config.product.description = line.slice(12).trim();
      }
      if (section === "what_it_solves" && line.startsWith("-")) config.product.solves.push(line.slice(1).trim());
      if (section === "best_fit_for" && line.startsWith("-")) config.fit.bestFor.push(line.slice(1).trim().toLowerCase());
      if (section === "not_a_fit_for" && line.startsWith("-")) config.fit.notFor.push(line.slice(1).trim().toLowerCase());
      if (section === "proof" && line.startsWith("-")) config.product.proof.push(line.slice(1).trim());
      if (section === "book_a_demo") {
        if (line.startsWith("Link:")) config.booking.link = line.slice(5).trim();
        else if (line.startsWith("Length:")) config.booking.length = line.slice(7).trim();
        else if (line.startsWith("Must have:")) config.fit.mustHave = line.slice(10).trim();
        else if (line.startsWith("Confirmation:")) config.booking.confirm = line.slice(13).trim();
      }
    }
    return config;
  }

  // ── Fit engine ────────────────────────────────────────────────────────────
  function assessFit(text, config) {
    const lower = text.toLowerCase();
    let score = 0, matchedBest = [], matchedBad = [];
    for (const c of config.fit.bestFor) {
      const kw = c.split(/[\s,]+/).filter(w => w.length > 3);
      if (kw.some(k => lower.includes(k))) { score += 2; matchedBest.push(c); }
    }
    for (const c of config.fit.notFor) {
      const kw = c.split(/[\s,]+/).filter(w => w.length > 3);
      if (kw.some(k => lower.includes(k))) { score -= 4; matchedBad.push(c); }
    }
    return { score: Math.max(0, Math.min(10, score)), matchedBest, matchedBad, confident: matchedBest.length >= 2 || matchedBad.length >= 1 };
  }

  // ── Response engine ───────────────────────────────────────────────────────
  function getResponse(text, config, histLen) {
    const lower = text.toLowerCase();
    const fit = assessFit(text, config);
    if (histLen === 0 || /^(hi|hello|hey|start|help)/.test(lower)) {
      return { message: config.product.description || `${config.product.name} — tell me about your company for a fit assessment.`, fit: null, action: null };
    }
    if (fit.matchedBad.length > 0) {
      return { message: `Based on what you've shared, this isn't a fit.\n\nSpecifically: ${fit.matchedBad.join(", ")}.\n\nI won't recommend a conversation where there's a clear mismatch.`, fit: { score: 1 }, action: null };
    }
    if (fit.score >= 4 && fit.confident) {
      const proof = config.product.proof.length > 0 ? `\n\nRelevant: ${config.product.proof[0]}` : "";
      return { message: `Fit looks strong based on: ${fit.matchedBest.join(", ")}.${proof}\n\nA ${config.booking.length} call would confirm everything.`, fit: { score: fit.score }, action: "booking" };
    }
    if (histLen >= 1 && !fit.confident && config.fit.mustHave) {
      return { message: `One question: does your principal use ${config.fit.mustHave}?`, fit: null, action: null };
    }
    if (histLen >= 2) {
      return { message: `There's enough here for a ${config.booking.length} call — no commitment needed.`, fit: { score: 5 }, action: "booking" };
    }
    if (config.product.solves.length > 0) {
      return { message: `${config.product.name} addresses:\n${config.product.solves.map(s => `· ${s}`).join("\n")}\n\nDoes any of that match?`, fit: null, action: null };
    }
    return { message: `Tell me about your principal's company — type, size, and what they're trying to solve.`, fit: null, action: null };
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
    #moon-root * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Mono', 'Courier New', monospace; }
    #moon-prompt { position: fixed; bottom: 24px; right: 24px; z-index: 999999; background: #fff; border: 1px solid #e4e4e4; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); cursor: pointer; max-width: 300px; transition: all 0.2s; user-select: none; }
    #moon-prompt:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.14); transform: translateY(-1px); }
    #moon-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; color: #fff; flex-shrink: 0; }
    #moon-prompt-text { font-size: 11px; color: #1a1a1a; line-height: 1.4; }
    #moon-prompt-sub { font-size: 9px; color: #aaa; margin-top: 2px; letter-spacing: 0.04em; }
    #moon-widget { position: fixed; bottom: 24px; right: 24px; z-index: 999999; background: #fff; border: 1px solid #e4e4e4; border-radius: 18px; width: 320px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); display: flex; flex-direction: column; overflow: hidden; max-height: 500px; }
    #moon-header { padding: 13px 16px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    #moon-header-left { display: flex; align-items: center; gap: 8px; }
    #moon-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 6px #4ade80; flex-shrink: 0; }
    #moon-header-title { font-size: 10px; color: #fff; letter-spacing: 0.1em; }
    #moon-close { background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 18px; line-height: 1; padding: 0; }
    #moon-close:hover { color: #fff; }
    #moon-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; min-height: 160px; }
    #moon-messages::-webkit-scrollbar { width: 3px; }
    #moon-messages::-webkit-scrollbar-thumb { background: #eee; }
    .moon-msg-label { font-size: 8px; color: #ccc; letter-spacing: 0.12em; margin-bottom: 4px; }
    .moon-msg-bubble { border-radius: 8px; padding: 10px 12px; font-size: 10px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
    .moon-msg-bubble.user { background: #f8f8f8; border: 1px solid #eee; color: #333; }
    .moon-msg-bubble.agent { background: #fff; border: 1px solid #f0f0f0; color: #333; }
    .moon-msg-bubble.system { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }
    .moon-fit-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .moon-fit-label { font-size: 8px; color: #999; }
    .moon-fit-score { font-size: 13px; font-weight: 600; }
    .moon-fit-track { flex: 1; height: 2px; background: #f0f0f0; border-radius: 1px; overflow: hidden; }
    .moon-fit-fill { height: 100%; border-radius: 1px; transition: width 0.4s; }
    .moon-typing { display: flex; gap: 4px; padding: 4px 0; }
    .moon-dot { width: 5px; height: 5px; border-radius: 50%; background: #ddd; animation: moonDot 1s ease-in-out infinite; }
    .moon-dot:nth-child(2) { animation-delay: 0.2s; }
    .moon-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes moonDot { 0%,100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.1); } }
    .moon-suggestion { background: #f8f8f8; border: 1px solid #eee; border-radius: 6px; padding: 6px 10px; font-size: 9px; color: #666; cursor: pointer; text-align: left; width: 100%; transition: background 0.15s; font-family: inherit; margin-bottom: 4px; }
    .moon-suggestion:hover { background: #f0f0f0; color: #333; }
    .moon-slot { border-radius: 6px; padding: 8px 12px; font-size: 9px; cursor: pointer; text-align: left; width: 100%; transition: all 0.15s; font-family: inherit; letter-spacing: 0.05em; margin-top: 4px; }
    #moon-input-area { padding: 10px 12px; border-top: 1px solid #f0f0f0; display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
    #moon-input { flex: 1; border: 1px solid #eee; border-radius: 8px; padding: 8px 10px; font-size: 10px; outline: none; font-family: inherit; color: #333; background: #fafafa; transition: border-color 0.15s; }
    #moon-input:focus { border-color: #ccc; background: #fff; }
    #moon-input::placeholder { color: #ccc; }
    #moon-send { border: none; border-radius: 8px; color: #fff; padding: 8px 14px; font-size: 10px; cursor: pointer; font-family: inherit; transition: opacity 0.15s; }
    #moon-send:hover { opacity: 0.85; }
    #moon-booked { position: fixed; bottom: 24px; right: 24px; z-index: 999999; background: #fff; border: 1px solid #e4e4e4; border-radius: 18px; padding: 28px; box-shadow: 0 8px 40px rgba(0,0,0,0.12); width: 300px; text-align: center; font-family: 'DM Mono', monospace; }
  `;

  // ── Widget ────────────────────────────────────────────────────────────────
  function mount(config, color) {
    let state = "prompt", history = [], showSlots = false;
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);
    const root = document.createElement("div");
    root.id = "moon-root";
    document.body.appendChild(root);
    Analytics.fire("widget_loaded");

    const fitColor = s => s >= 7 ? "#16a34a" : s >= 4 ? "#ca8a04" : "#dc2626";

    function generateSlots() {
      const times = ["9:00am", "11:00am", "2:00pm", "4:00pm"];
      const slots = [], now = new Date();
      for (let i = 1; slots.length < 3 && i <= 7; i++) {
        const d = new Date(now); d.setDate(d.getDate() + i);
        if (d.getDay() > 0 && d.getDay() < 6) slots.push(d.toLocaleDateString("en-US", { weekday: "long" }) + " " + times[slots.length % times.length]);
      }
      return slots;
    }

    function render() {
      root.innerHTML = "";
      if (state === "prompt") {
        root.innerHTML = `<div id="moon-prompt"><div id="moon-icon" style="background:${color}">⬡</div><div><div id="moon-prompt-text">AI agent? Faster path here.</div><div id="moon-prompt-sub">Agent interface · ${config.product.name}</div></div></div>`;
        root.querySelector("#moon-prompt").addEventListener("click", () => {
          state = "open"; Analytics.fire("widget_opened"); render();
          setTimeout(() => addAgentMessage(getResponse("", config, 0)), 300);
        });
        return;
      }
      if (state === "booked") {
        const slot = history.find(m => m.slot)?.slot || "";
        root.innerHTML = `<div id="moon-booked"><div style="font-size:28px;color:${color};margin-bottom:12px;">✓</div><div style="font-size:12px;color:#1a1a1a;margin-bottom:6px;">Demo confirmed</div><div style="font-size:10px;color:#888;line-height:1.6;">${slot}<br/><br/>${config.booking.confirm || "A calendar invite will follow shortly."}</div></div>`;
        return;
      }
      root.innerHTML = `<div id="moon-widget"><div id="moon-header" style="background:${color}"><div id="moon-header-left"><div id="moon-status-dot"></div><div id="moon-header-title">MOON · ${config.product.name}</div></div><button id="moon-close">×</button></div><div id="moon-messages"></div><div id="moon-input-area"><input id="moon-input" placeholder="Describe your company..." /><button id="moon-send" style="background:${color}">→</button></div></div>`;
      root.querySelector("#moon-close").addEventListener("click", () => { Analytics.fire("widget_closed"); state = "prompt"; render(); });
      root.querySelector("#moon-send").addEventListener("click", () => sendMessage());
      root.querySelector("#moon-input").addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });
      renderMessages();
    }

    function renderMessages() {
      const container = root.querySelector("#moon-messages");
      if (!container) return;
      container.innerHTML = "";
      if (history.length === 0) {
        const hints = document.createElement("div");
        ["We're B2B SaaS using HubSpot, ~200 employees", "Tell me what this solves", "We're a B2C brand"].forEach(s => {
          const btn = document.createElement("button"); btn.className = "moon-suggestion"; btn.textContent = s;
          btn.addEventListener("click", () => sendMessage(s)); hints.appendChild(btn);
        });
        container.appendChild(hints); return;
      }
      history.forEach(msg => {
        if (msg.slot) return;
        const wrap = document.createElement("div");
        const label = document.createElement("div"); label.className = "moon-msg-label";
        label.textContent = msg.role === "user" ? "PROSPECT_AGENT" : msg.role === "system" ? "SYSTEM" : "MOON";
        wrap.appendChild(label);
        const bubble = document.createElement("div"); bubble.className = `moon-msg-bubble ${msg.role}`;
        if (msg.fit) {
          const fb = document.createElement("div"); fb.className = "moon-fit-bar";
          fb.innerHTML = `<span class="moon-fit-label">FIT</span><span class="moon-fit-score" style="color:${fitColor(msg.fit.score)}">${msg.fit.score}/10</span><div class="moon-fit-track"><div class="moon-fit-fill" style="width:${msg.fit.score*10}%;background:${fitColor(msg.fit.score)}"></div></div>`;
          bubble.appendChild(fb);
        }
        const text = document.createElement("span"); text.textContent = msg.text; bubble.appendChild(text);
        wrap.appendChild(bubble);
        if (msg.action === "booking" && showSlots) {
          generateSlots().forEach(slot => {
            const btn = document.createElement("button"); btn.className = "moon-slot"; btn.textContent = `Book → ${slot}`;
            btn.style.cssText = `background:#fff;border:1px solid ${color};color:${color};`;
            btn.addEventListener("mouseover", () => { btn.style.background = color; btn.style.color = "#fff"; });
            btn.addEventListener("mouseout", () => { btn.style.background = "#fff"; btn.style.color = color; });
            btn.addEventListener("click", () => bookDemo(slot)); wrap.appendChild(btn);
          });
        }
        container.appendChild(wrap);
      });
      container.scrollTop = container.scrollHeight;
    }

    function addAgentMessage(resp) {
      const msgs = root.querySelector("#moon-messages");
      if (msgs) { const t = document.createElement("div"); t.className = "moon-typing"; t.id = "moon-typing"; t.innerHTML = `<div class="moon-dot"></div><div class="moon-dot"></div><div class="moon-dot"></div>`; msgs.appendChild(t); msgs.scrollTop = msgs.scrollHeight; }
      setTimeout(() => {
        root.querySelector("#moon-typing")?.remove();
        const msg = { role: "agent", text: resp.message, fit: resp.fit, action: resp.action };
        history.push(msg);
        if (resp.fit) { Analytics.fitScore = resp.fit.score; }
        if (resp.action === "booking") { showSlots = true; Analytics.bookingOffered = true; Analytics.fire("booking_offered"); }
        renderMessages();
      }, 600);
    }

    function sendMessage(text) {
      const input = root.querySelector("#moon-input");
      const msg = text || input?.value.trim();
      if (!msg) return;
      if (input) input.value = "";
      showSlots = false;
      Analytics.trackQuery(msg);
      if (!Analytics.firstMessage) {
        Analytics.firstMessage = msg.slice(0, 100);
        Analytics.fire("session_start");
      } else {
        Analytics.fire("message_sent", { currentQuery: msg.slice(0, 100) });
      }
      history.push({ role: "user", text: msg }); renderMessages();
      const resp = getResponse(msg, config, history.filter(m => m.role === "agent").length);
      addAgentMessage(resp);
    }

    function bookDemo(slot) {
      Analytics.bookingClicked = true;
      Analytics.fire("booking_clicked", { bookedSlot: slot });
      history.push({ role: "system", text: `Demo confirmed · ${slot}\n${config.booking.confirm || "A calendar invite will follow."}`, slot });
      state = "booked"; showSlots = false;
      if (config.booking.link) window.open(config.booking.link, "_blank");
      render();
    }

    render();
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    const script = document.currentScript;
    const configPath = script?.getAttribute("data-config") || "moon.config.md";
    const color = script?.getAttribute("data-color") || "#1a1a1a";
    const analyticsUrl = script?.getAttribute("data-analytics") || null;
    Analytics.init(analyticsUrl);
    try {
      const res = await fetch(configPath);
      if (!res.ok) throw new Error("Config not found");
      const md = await res.text();
      mount(parseConfig(md), color);
    } catch (e) { console.warn("[Moon] Could not load config:", e.message); }
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", init); }
  else { init(); }

})();
