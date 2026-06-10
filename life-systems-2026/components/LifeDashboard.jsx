"use client";


import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check, Plus, X, Minus, ChevronRight, ChevronLeft, Send, Trophy, Download, Mail } from "lucide-react";

/* localStorage adapter — replaces the claude.ai artifact storage API */
const storage = {
  async get(key) {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(key);
    return v == null ? null : { key, value: v };
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
    return { key, value };
  },
};

/* ------------------------------------------------------------------ */
/* Design tokens — Apple-style sci-fi: white field, frosted glass,     */
/* aurora glow, SF system typography, violet→cyan accent               */
/* ------------------------------------------------------------------ */
const T = {
  bg: "#F5F5F7",
  card: "rgba(255,255,255,0.72)",
  cardUp: "rgba(255,255,255,0.92)",
  ink: "#1D1D1F",
  inkSoft: "#86868B",
  line: "rgba(0,0,0,0.08)",
  accent: "#6E5BFF",
  accentSoft: "rgba(110,91,255,0.10)",
  track: "rgba(0,0,0,0.06)",
  glow: "0 6px 22px rgba(110,91,255,0.35)",
  display: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', ui-sans-serif, sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace",
  body: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', ui-sans-serif, sans-serif",
};

const PILLARS_DEF = [
  { id: "professional", glyph: "✦", name: "Professional + Certs", color: "#0A84FF" },
  { id: "fitness", glyph: "✦", name: "Fitness", color: "#30B85C" },
  { id: "health", glyph: "✦", name: "Health & Beauty", color: "#FF2D78" },
  { id: "creative", glyph: "✦", name: "Creative", color: "#FF9500" },
  { id: "family", glyph: "✦", name: "Family", color: "#BF5AF2" },
  { id: "home", glyph: "✦", name: "Home", color: "#00A8B5" },
];
const PILLAR_COLORS = Object.fromEntries(PILLARS_DEF.map((p) => [p.id, p.color]));
const PILLAR_NAMES = Object.fromEntries(PILLARS_DEF.map((p) => [p.id, p.name]));
const PILLAR_IDS = PILLARS_DEF.map((p) => p.id);

const STATUS_META = {
  "on-track": { label: "On Track", color: "#34C759" },
  active: { label: "Active", color: "#0A84FF" },
  "on-deck": { label: "On Deck", color: "#FF9500" },
  "at-risk": { label: "At Risk", color: "#FF3B30" },
  done: { label: "Done", color: "#8E8E93" },
};
const STATUS_ORDER = ["on-track", "active", "on-deck", "at-risk", "done"];

/* ------------------------------------------------------------------ */
/* Seed data — 2026 scope                                               */
/* ------------------------------------------------------------------ */
const sundayBlocks = ["2026-06-21", "2026-06-28", "2026-07-05", "2026-07-12", "2026-07-19", "2026-07-26"].map(
  (d, i) => ({ id: "ev-study-" + i, date: d, time: "9:00 AM", title: "Sunday study block (9:00–10:30 AM)", pillar: "professional", booked: true })
);

const SEED = {
  pillars: [
    { id: "professional", status: "on-track", objective: "Role tenure, expert positioning, Salesforce certs", nextAction: "Complete Security & Compliance training" },
    { id: "fitness", status: "active", objective: "Athletic base, gym integration, marathon build", nextAction: "Initialize June sign-up perks at LT Las Colinas" },
    { id: "health", status: "on-deck", objective: "Wellness, recovery, and self-care routines", nextAction: "Set a baseline routine — sleep, skincare, recovery" },
    { id: "creative", status: "on-deck", objective: "Content cadence & white space", nextAction: "Map out next Substack essay structure" },
    { id: "family", status: "active", objective: "Presence, connection, shared time", nextAction: "Plan the next family touchpoint" },
    { id: "home", status: "on-track", objective: "Weekend & operational flow", nextAction: "Finalize logistics for Saturday's Fair Park watch party" },
  ],
  phases: [
    {
      id: "p1",
      name: "Foundation & Quick Wins",
      range: "June 11 – June 15",
      tasks: [
        { id: "t1", pillar: "professional", text: "Security & Compliance training — Sun June 14, 9:00–11:00 AM", done: false },
        { id: "t2", pillar: "fitness", text: "Book free Dynamic Personal Training consultation at LT Las Colinas", done: false },
        { id: "t3", pillar: "fitness", text: "Book Intro to Pilates session", done: false },
        { id: "t4", pillar: "fitness", text: "Sat June 13 AM — base run at White Rock Lake", done: false },
        { id: "t5", pillar: "home", text: "Sat June 13, 5:00 PM — Fair Park, Morocco vs. Brazil watch party", done: false },
      ],
    },
    {
      id: "p2",
      name: "Core Certification Execution",
      range: "June 16 – July 15",
      tasks: [
        { id: "t6", pillar: "professional", text: "Start recurring Sunday study blocks (9:00–10:30 AM) — June 21", done: false },
        { id: "t7", pillar: "professional", text: "Weeks 1–2: Agentforce L1 Badge modules via Trailhead Agentblazer hub", done: false },
        { id: "t8", pillar: "professional", text: "Weeks 3–5: Admin deep dive — Data Modeling, Flow Builder, Security/Permissions", done: false },
        { id: "t9", pillar: "fitness", text: "Add mid-week GTX group training for core strength + endurance support", done: false },
      ],
    },
    {
      id: "p3",
      name: "Mastery & Authority",
      range: "July 16 – July 30",
      tasks: [
        { id: "t10", pillar: "professional", text: "Sit for Salesforce Platform Administrator exam", done: false },
        { id: "t11", pillar: "professional", text: "Lock in Agentforce Level 1 Badge", done: false },
        { id: "t12", pillar: "professional", text: "Map client integration architectures using new agentic tool knowledge", done: false },
      ],
    },
  ],
  milestones: [
    { id: "m1", pillar: "professional", label: "Compliance Training", target: "June 14", progress: 100 },
    { id: "m2", pillar: "professional", label: "Agentforce L1 Badge", target: "June 30", progress: 0 },
    { id: "m3", pillar: "professional", label: "Salesforce Admin Certification", target: "July 30", progress: 0 },
    { id: "m4", pillar: "professional", label: "Senior SA positioning groundwork", target: "Dec 2026", progress: 10 },
    { id: "m5", pillar: "fitness", label: "Life Time routine integration", target: "Ongoing", progress: 25 },
    { id: "m6", pillar: "fitness", label: "Marathon base build (March 2027 race)", target: "Dec 2026", progress: 15 },
    { id: "m7", pillar: "health", label: "Baseline wellness & recovery routine", target: "Q3 2026", progress: 0 },
    { id: "m8", pillar: "creative", label: "Next Substack essay shipped", target: "Q3 2026", progress: 0 },
    { id: "m9", pillar: "creative", label: "2026 essay cadence held", target: "Dec 2026", progress: 10 },
    { id: "m10", pillar: "family", label: "Family rituals & visits on the calendar", target: "Ongoing", progress: 0 },
    { id: "m11", pillar: "home", label: "Weekend operational flow dialed in", target: "Ongoing", progress: 40 },
  ],
  events: [
    { id: "ev1", date: "2026-06-13", time: "Morning", title: "Base run — White Rock Lake", pillar: "fitness", booked: true },
    { id: "ev2", date: "2026-06-13", time: "5:00 PM", title: "Fair Park — Morocco vs. Brazil watch party", pillar: "home", booked: true },
    { id: "ev3", date: "2026-06-14", time: "9:00 AM", title: "Security & Compliance training (9–11 AM)", pillar: "professional", booked: true },
    ...sundayBlocks,
    { id: "ev4", date: "2026-06-30", time: "", title: "Target: Agentforce L1 Badge", pillar: "professional", booked: false },
    { id: "ev5", date: "2026-07-30", time: "", title: "Target: Salesforce Admin exam", pillar: "professional", booked: false },
  ],
  wins: [
    { id: "w1", date: "2026-06-05", scope: "professional", pillar: "professional", text: "Completed Agentic Marketing Expert certification in week one at Qualified" },
  ],
  chat: [],
  profile: { birthday: "" },
  horoscope: null,
  groceries: [],
  notes: "Study block rule: Sunday 9:00 AM is non-negotiable professional white space. Gym rule: schedule GTX or recovery (cold plunge / LifeSpa) right after heavy runs.",
};

const YEAR = 2026;
const YEAR_START = new Date(YEAR, 0, 1);
const YEAR_END = new Date(YEAR, 11, 31);
const STORAGE_KEY = "life-ops-v3";
const V2_KEY = "life-ops-v2";
const EMAIL = "mia.wvc@gmail.com";

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */
function daysBetween(a, b) {
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
}
const uid = (p) => (p || "x") + Math.random().toString(36).slice(2, 9);
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
const mapOldPillar = (p) => (p === "certs" ? "professional" : p === "household" ? "home" : PILLAR_COLORS[p] ? p : "professional");

/* ---- birthday & horoscope helpers ---- */
const ZODIAC = [
  ["Capricorn", "♑", 1, 19], ["Aquarius", "♒", 2, 18], ["Pisces", "♓", 3, 20], ["Aries", "♈", 4, 19],
  ["Taurus", "♉", 5, 20], ["Gemini", "♊", 6, 20], ["Cancer", "♋", 7, 22], ["Leo", "♌", 8, 22],
  ["Virgo", "♍", 9, 22], ["Libra", "♎", 10, 22], ["Scorpio", "♏", 11, 21], ["Sagittarius", "♐", 12, 21],
  ["Capricorn", "♑", 12, 31],
];
function zodiacFor(isoBirthday) {
  const [, m, d] = isoBirthday.split("-").map(Number);
  for (const [name, emoji, mm, dd] of ZODIAC) {
    if (m < mm || (m === mm && d <= dd)) return { name, emoji };
  }
  return { name: "Capricorn", emoji: "♑" };
}
function nextBirthday(isoBirthday, today) {
  const [, m, d] = isoBirthday.split("-").map(Number);
  let b = new Date(today.getFullYear(), m - 1, d);
  if (daysBetween(today, b) < 0) b = new Date(today.getFullYear() + 1, m - 1, d);
  return b;
}
async function generateHoroscope(sign, todayISO) {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Write today's horoscope for ${sign}, dated ${todayISO}. 2-3 sentences. Warm, a little wry, never saccharine. Include one practical nudge that fits someone balancing career ambition, marathon training, creative writing, and family life. Plain text only — no preamble, no sign name, no date.`,
      }],
    }),
  });
  const json = await response.json();
  const text = (json.content || []).filter((b) => b.type === "text").map((b) => b.text).join(" ").trim();
  if (!text) throw new Error("Empty horoscope");
  return text;
}

function migrateV2(v2) {
  const d = structuredClone(SEED);
  if (v2.phases) {
    d.phases = v2.phases.map((ph) => ({ ...ph, tasks: ph.tasks.map((t) => ({ ...t, pillar: mapOldPillar(t.pillar) })) }));
  }
  if (v2.wins) d.wins = v2.wins.map((w) => ({ ...w, pillar: mapOldPillar(w.pillar), scope: mapOldPillar(w.pillar) === "professional" ? "professional" : "personal" }));
  if (v2.events) d.events = v2.events.map((e) => ({ ...e, pillar: mapOldPillar(e.pillar) }));
  if (v2.milestones) {
    const map = { m1: "professional", m2: "professional", m3: "professional", m4: "fitness" };
    for (const m of v2.milestones) {
      const mine = d.milestones.find((x) => x.label === m.label);
      if (mine) mine.progress = m.progress;
      else d.milestones.push({ ...m, id: uid("m"), pillar: map[m.id] || "professional" });
    }
  }
  if (v2.chat) d.chat = v2.chat;
  if (v2.notes) d.notes = v2.notes;
  return d;
}

/* ------------------------------------------------------------------ */
/* AI assistant                                                          */
/* ------------------------------------------------------------------ */
function buildSystemPrompt(data, todayISO) {
  const tasks = data.phases.flatMap((p) => p.tasks.map((t) => ({ taskId: t.id, phaseId: p.id, phase: p.name, text: t.text, done: t.done, pillar: t.pillar })));
  const state = {
    today: todayISO,
    scope: "Calendar year 2026. Active sprint: June 11 – July 30, 2026.",
    pillars: data.pillars.map((p) => ({ id: p.id, name: PILLAR_NAMES[p.id], status: p.status, objective: p.objective, nextAction: p.nextAction })),
    tasks,
    milestones: data.milestones.map((m) => ({ id: m.id, pillar: m.pillar, label: m.label, target: m.target, progress: m.progress })),
    upcomingEvents: data.events.filter((e) => e.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14),
    recentWins: data.wins.slice(0, 10),
    profile: data.profile && data.profile.birthday ? { birthday: data.profile.birthday, sign: zodiacFor(data.profile.birthday).name } : "birthday not set yet",
    groceries: (data.groceries || []).map((g) => ({ id: g.id, text: g.text, done: g.done })),
    notes: data.notes,
  };
  return `You are Mia's personal life-operations assistant, embedded in her 2026 Life Systems dashboard. Mia is a Success Architect at Qualified (Salesforce), a runner training toward a March 2027 marathon, and a memoir essayist (Substack). Pillars: Professional + Certs, Fitness, Health & Beauty, Creative, Family, Home.

Current dashboard state (JSON):
${JSON.stringify(state)}

Your role is full operational support:
1. UPDATE: when Mia reports progress, completions, bookings, or wins, translate them into actions.
2. SUGGEST: proactively recommend changes — rebalancing pillars, filling neglected areas (e.g., if Health or Family has no recent activity), sequencing tasks, protecting her Sunday study blocks. Make suggestions in "reply"; only execute them as actions if she's clearly asked or agreed.
3. ANSWER: answer questions about her schedule, progress, and priorities from the state above.

Respond with ONLY a valid JSON object — no markdown, no code fences:
{"reply":"conversational reply (concise, specific, honest — no flattery)","actions":[...]}

Allowed actions:
- {"type":"complete_task","taskId":"t1"} / {"type":"uncomplete_task","taskId":"t1"}
- {"type":"add_task","phaseId":"p1|p2|p3","text":"...","pillar":"professional|fitness|health|creative|family|home"}
- {"type":"remove_task","taskId":"..."}
- {"type":"add_win","text":"...","scope":"personal|professional","pillar":"...","date":"YYYY-MM-DD"}
- {"type":"add_event","title":"...","date":"YYYY-MM-DD","time":"e.g. 9:00 AM or empty","pillar":"...","booked":true|false}
- {"type":"remove_event","eventId":"..."}
- {"type":"set_milestone","id":"m1","progress":0-100}
- {"type":"add_milestone","pillar":"...","label":"...","target":"e.g. Q3 2026"}
- {"type":"set_pillar_status","id":"...","status":"on-track|active|on-deck|at-risk|done"}
- {"type":"set_next_action","id":"...","text":"..."}
- {"type":"set_notes","text":"..."} — replaces the sticky execution rules
- {"type":"add_groceries","items":["eggs","oat milk"]} — adds items to the grocery list (Home pillar)
- {"type":"check_grocery","id":"g..."} / {"type":"uncheck_grocery","id":"g..."} — use exact grocery ids from state
- {"type":"remove_grocery","id":"g..."}
- {"type":"clear_checked_groceries"} — removes all checked-off items

Rules:
- Completions of meaningful items get BOTH complete_task (if a task matches) AND add_win.
- Professional-pillar wins are scope "professional"; everything else defaults to "personal" unless she says otherwise.
- Only reference ids that exist in state. Never invent ids.
- Never delete or overwrite anything she didn't ask to change.
- Be precise; cite specifics from state when answering.`;
}

async function callAssistant(data, history, userMessage, todayISO) {
  const messages = [...history.slice(-12).map((m) => ({ role: m.role, content: m.text })), { role: "user", content: userMessage }];
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ max_tokens: 1000, system: buildSystemPrompt(data, todayISO), messages }),
  });
  const json = await response.json();
  const text = (json.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON");
  return JSON.parse(clean.slice(start, end + 1));
}

/* ------------------------------------------------------------------ */
/* Year-log PNG export                                                  */
/* ------------------------------------------------------------------ */
function exportYearLogPNG(data, todayISO) {
  const W = 1240;
  const wins = [...data.wins].sort((a, b) => b.date.localeCompare(a.date));
  const pro = wins.filter((w) => w.scope === "professional");
  const per = wins.filter((w) => w.scope !== "professional");
  const allTasks = data.phases.flatMap((p) => p.tasks);
  const doneCount = allTasks.filter((t) => t.done).length;

  const rows = 6 + data.milestones.length + Math.min(pro.length, 15) + Math.min(per.length, 15) + 10;
  const H = 320 + rows * 34;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);
  let y = 70;
  ctx.fillStyle = "#6E5BFF";
  ctx.font = "500 16px monospace";
  ctx.fillText("MIA CHASZEYKA — LIFE SYSTEMS · 2026 YEAR LOG", 60, y);
  y += 46;
  ctx.fillStyle = "#1D1D1F";
  ctx.font = "600 40px sans-serif";
  ctx.fillText(`2026 in review — generated ${fmtDate(todayISO)}`, 60, y);
  y += 50;
  ctx.fillStyle = "#86868B";
  ctx.font = "400 18px sans-serif";
  ctx.fillText(`${doneCount}/${allTasks.length} sprint tasks complete · ${wins.length} wins logged · ${data.milestones.length} milestones tracked`, 60, y);
  y += 50;

  const section = (label) => {
    ctx.strokeStyle = "#E5E5EA";
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
    y += 36;
    ctx.fillStyle = "#6E5BFF";
    ctx.font = "500 15px monospace";
    ctx.fillText(label.toUpperCase(), 60, y);
    y += 34;
  };
  const line = (text, color) => {
    ctx.fillStyle = color || "#1D1D1F";
    ctx.font = "400 17px sans-serif";
    ctx.fillText(text.length > 110 ? text.slice(0, 107) + "…" : text, 60, y);
    y += 32;
  };

  section("Milestones by pillar");
  for (const pid of PILLAR_IDS) {
    const ms = data.milestones.filter((m) => m.pillar === pid);
    if (!ms.length) continue;
    ctx.fillStyle = PILLAR_COLORS[pid];
    ctx.font = "500 16px monospace";
    ctx.fillText("✦ " + PILLAR_NAMES[pid], 60, y);
    y += 30;
    for (const m of ms) {
      ctx.fillStyle = "#86868B";
      ctx.font = "400 16px sans-serif";
      ctx.fillText(`${m.label} — target ${m.target}`, 84, y);
      const bx = 760, bw = 360;
      ctx.fillStyle = "#E5E5EA";
      ctx.fillRect(bx, y - 12, bw, 10);
      ctx.fillStyle = m.progress === 100 ? "#34C759" : "#6E5BFF";
      ctx.fillRect(bx, y - 12, bw * (m.progress / 100), 10);
      ctx.fillStyle = "#1D1D1F";
      ctx.font = "500 15px monospace";
      ctx.fillText(`${m.progress}%`, bx + bw + 14, y - 2);
      y += 32;
    }
    y += 6;
  }

  section(`Professional wins (${pro.length})`);
  if (!pro.length) line("— none logged yet", "#86868B");
  pro.slice(0, 15).forEach((w) => line(`${w.date} · ${w.text}`));
  if (pro.length > 15) line(`…and ${pro.length - 15} more`, "#86868B");

  section(`Personal wins (${per.length})`);
  if (!per.length) line("— none logged yet", "#86868B");
  per.slice(0, 15).forEach((w) => line(`${w.date} · ${w.text}`));
  if (per.length > 15) line(`…and ${per.length - 15} more`, "#86868B");

  y += 10;
  ctx.fillStyle = "#86868B";
  ctx.font = "400 14px monospace";
  ctx.fillText("Generated from Life Operations Dashboard · miachaszeyka.com", 60, y);

  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = `mia-life-log-${YEAR}.png`;
  a.click();
}

function openEmailDraft(data, todayISO) {
  const wins = data.wins.length;
  const subject = encodeURIComponent(`Life Systems — ${YEAR} Year Log`);
  const body = encodeURIComponent(
    `2026 Year Log snapshot (generated ${fmtDate(todayISO)})\n\nWins logged: ${wins}\nMilestones tracked: ${data.milestones.length}\n\nAttach the downloaded PNG (mia-life-log-${YEAR}.png) to this email before sending.`
  );
  window.open(`mailto:${EMAIL}?subject=${subject}&body=${body}`);
}

/* ------------------------------------------------------------------ */
/* Small components                                                      */
/* ------------------------------------------------------------------ */
function StatusPill({ status, onClick }) {
  const meta = STATUS_META[status] || STATUS_META["on-deck"];
  return (
    <button onClick={onClick} title="Click to change status" style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: meta.color, border: `1px solid ${meta.color}50`, background: "transparent", borderRadius: 999, padding: "3px 10px", cursor: "pointer" }}>
      {meta.label}
    </button>
  );
}

function WeekDots({ weekIndex }) {
  const dots = [];
  for (let i = 0; i < 52; i++) {
    const isPast = i < weekIndex;
    const isNow = i === weekIndex;
    dots.push(
      <div key={i} title={`Week ${i + 1}`} style={{ width: 9, height: 9, borderRadius: "50%", background: isNow ? T.accent : isPast ? T.ink : "transparent", border: isNow ? `2px solid ${T.accent}` : `1px solid ${isPast ? T.ink : "#C7C7CC"}`, boxShadow: isNow ? `0 0 0 3px ${T.accentSoft}` : "none" }} />
    );
  }
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(13, 9px)", gap: 6 }}>{dots}</div>;
}

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 7, borderRadius: 999, background: T.track, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${value}%`, borderRadius: 999, background: color || T.accent, transition: "width 0.4s ease" }} />
    </div>
  );
}

function Eyebrow({ children }) {
  return <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.accent, marginBottom: 10 }}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Main app                                                             */
/* ------------------------------------------------------------------ */
export default function LifeOpsDashboard() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("assistant");
  const [saveState, setSaveState] = useState("idle");
  const [editingPillar, setEditingPillar] = useState(null);
  const [editText, setEditText] = useState("");
  const [addingTo, setAddingTo] = useState(null);
  const [newTask, setNewTask] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [calMonth, setCalMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [selectedDay, setSelectedDay] = useState(null);
  const [winForm, setWinForm] = useState({ open: false, text: "", pillar: "professional", scope: "professional" });
  const [winFilter, setWinFilter] = useState("all");
  const [msForm, setMsForm] = useState({ open: false, label: "", target: "", pillar: "professional" });
  const [bdayInput, setBdayInput] = useState("");
  const [groceryInput, setGroceryInput] = useState("");
  const [horoLoading, setHoroLoading] = useState(false);
  const horoFetched = useRef(false);
  const saveTimer = useRef(null);
  const chatEndRef = useRef(null);

  const today = new Date();
  const todayISO = toISO(today);

  /* ---- load (with v2 migration) ---- */
  useEffect(() => {
    (async () => {
      let next = null;
      try {
        const r = await storage.get(STORAGE_KEY);
        if (r && r.value) next = JSON.parse(r.value);
      } catch {}
      if (!next) {
        try {
          const old = await storage.get(V2_KEY);
          if (old && old.value) next = migrateV2(JSON.parse(old.value));
        } catch {}
      }
      const base = next || SEED;
      if (!base.profile) base.profile = { birthday: "" };
      if (!("horoscope" in base)) base.horoscope = null;
      if (!base.groceries) base.groceries = [];
      setData(base);
    })();
  }, []);

  const persist = useCallback((next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await storage.set(STORAGE_KEY, JSON.stringify(next));
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 1500);
      } catch {
        setSaveState("error");
      }
    }, 500);
  }, []);

  const update = useCallback((fn) => {
    setData((prev) => {
      const next = fn(structuredClone(prev));
      persist(next);
      return next;
    });
  }, [persist]);

  useEffect(() => {
    if (tab === "assistant") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.chat?.length, thinking, tab]);

  const refreshHoroscope = useCallback(async (force) => {
    if (!data?.profile?.birthday || horoLoading) return;
    if (!force && data.horoscope && data.horoscope.date === todayISO) return;
    setHoroLoading(true);
    try {
      const sign = zodiacFor(data.profile.birthday);
      const text = await generateHoroscope(sign.name, todayISO);
      update((d) => { d.horoscope = { date: todayISO, sign: sign.name, text }; return d; });
    } catch {
      update((d) => { d.horoscope = { date: todayISO, sign: zodiacFor(data.profile.birthday).name, text: "The stars are buffering — hit refresh to try again." }; return d; });
    }
    setHoroLoading(false);
  }, [data, horoLoading, todayISO, update]);

  useEffect(() => {
    if (!data || horoFetched.current) return;
    if (data.profile?.birthday && (!data.horoscope || data.horoscope.date !== todayISO)) {
      horoFetched.current = true;
      refreshHoroscope(false);
    }
  }, [data, refreshHoroscope, todayISO]);

  if (!data) {
    return <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.mono, color: T.inkSoft, fontSize: 13 }}>Loading your system…</div>;
  }

  /* ---- derived ---- */
  const dayOfYear = Math.max(daysBetween(YEAR_START, today), 0) + 1;
  const weekIndex = Math.min(Math.floor((dayOfYear - 1) / 7), 51);
  const yearLeft = Math.max(daysBetween(today, YEAR_END), 0);
  const allTasks = data.phases.flatMap((p) => p.tasks);
  const doneCount = allTasks.filter((t) => t.done).length;
  const upcoming = data.events.filter((e) => e.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")).slice(0, 6);
  const filteredWins = data.wins.filter((w) => winFilter === "all" || (winFilter === "professional" ? w.scope === "professional" : w.scope !== "professional"));

  /* ---- apply AI actions ---- */
  const applyActions = (d, actions) => {
    const applied = [];
    for (const a of actions || []) {
      try {
        if (a.type === "complete_task" || a.type === "uncomplete_task") {
          for (const ph of d.phases) {
            const t = ph.tasks.find((x) => x.id === a.taskId);
            if (t) { t.done = a.type === "complete_task"; applied.push((t.done ? "✓ " : "↺ ") + t.text.slice(0, 48)); }
          }
        } else if (a.type === "add_task" && a.text) {
          const ph = d.phases.find((p) => p.id === a.phaseId) || d.phases[d.phases.length - 1];
          ph.tasks.push({ id: uid("t"), pillar: mapOldPillar(a.pillar), text: a.text, done: false });
          applied.push("＋ task: " + a.text.slice(0, 48));
        } else if (a.type === "remove_task") {
          for (const ph of d.phases) {
            const t = ph.tasks.find((x) => x.id === a.taskId);
            if (t) { ph.tasks = ph.tasks.filter((x) => x.id !== a.taskId); applied.push("✕ task removed: " + t.text.slice(0, 40)); }
          }
        } else if (a.type === "add_win" && a.text) {
          d.wins.unshift({ id: uid("w"), date: a.date || todayISO, scope: a.scope === "professional" ? "professional" : "personal", pillar: mapOldPillar(a.pillar), text: a.text });
          applied.push("🏆 win logged (" + (a.scope === "professional" ? "professional" : "personal") + ")");
        } else if (a.type === "add_event" && a.title && /^\d{4}-\d{2}-\d{2}$/.test(a.date || "")) {
          d.events.push({ id: uid("ev"), date: a.date, time: a.time || "", title: a.title, pillar: mapOldPillar(a.pillar), booked: a.booked !== false });
          applied.push("📅 " + a.title.slice(0, 48));
        } else if (a.type === "remove_event") {
          const e = d.events.find((x) => x.id === a.eventId);
          if (e) { d.events = d.events.filter((x) => x.id !== a.eventId); applied.push("✕ event removed: " + e.title.slice(0, 40)); }
        } else if (a.type === "set_milestone") {
          const m = d.milestones.find((x) => x.id === a.id);
          if (m) { m.progress = Math.min(100, Math.max(0, Number(a.progress) || 0)); applied.push(`◐ ${m.label} → ${m.progress}%`); }
        } else if (a.type === "add_milestone" && a.label) {
          d.milestones.push({ id: uid("m"), pillar: mapOldPillar(a.pillar), label: a.label, target: a.target || "2026", progress: 0 });
          applied.push("＋ milestone: " + a.label.slice(0, 44));
        } else if (a.type === "set_pillar_status") {
          const p = d.pillars.find((x) => x.id === a.id);
          if (p && STATUS_META[a.status]) { p.status = a.status; applied.push(`● ${PILLAR_NAMES[p.id]} → ${STATUS_META[a.status].label}`); }
        } else if (a.type === "set_next_action") {
          const p = d.pillars.find((x) => x.id === a.id);
          if (p && a.text) { p.nextAction = a.text; applied.push(`→ ${PILLAR_NAMES[p.id]} next action updated`); }
        } else if (a.type === "set_notes" && a.text) {
          d.notes = a.text;
          applied.push("✎ execution rules updated");
        } else if (a.type === "add_groceries" && Array.isArray(a.items)) {
          for (const item of a.items) {
            if (typeof item === "string" && item.trim()) d.groceries.push({ id: uid("g"), text: item.trim(), done: false });
          }
          applied.push("🛒 +" + a.items.length + " grocer" + (a.items.length === 1 ? "y item" : "ies"));
        } else if (a.type === "check_grocery" || a.type === "uncheck_grocery") {
          const g = d.groceries.find((x) => x.id === a.id);
          if (g) { g.done = a.type === "check_grocery"; applied.push((g.done ? "✓ " : "↺ ") + g.text.slice(0, 30)); }
        } else if (a.type === "remove_grocery") {
          const g = d.groceries.find((x) => x.id === a.id);
          if (g) { d.groceries = d.groceries.filter((x) => x.id !== a.id); applied.push("✕ " + g.text.slice(0, 30)); }
        } else if (a.type === "clear_checked_groceries") {
          const n = d.groceries.filter((g) => g.done).length;
          d.groceries = d.groceries.filter((g) => !g.done);
          applied.push(`🛒 cleared ${n} checked item${n === 1 ? "" : "s"}`);
        }
      } catch {}
    }
    return applied;
  };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || thinking) return;
    setChatInput("");
    setThinking(true);
    const history = data.chat;
    update((d) => { d.chat.push({ id: uid("c"), role: "user", text: msg }); return d; });
    try {
      const result = await callAssistant(data, history, msg, todayISO);
      update((d) => {
        const applied = applyActions(d, result.actions);
        d.chat.push({ id: uid("c"), role: "assistant", text: result.reply || "Done.", applied });
        if (d.chat.length > 60) d.chat = d.chat.slice(-60);
        return d;
      });
    } catch {
      update((d) => { d.chat.push({ id: uid("c"), role: "assistant", text: "Connection hiccup — try sending that again.", applied: [] }); return d; });
    }
    setThinking(false);
  };

  /* ---- manual actions ---- */
  const cycleStatus = (pid) => update((d) => { const p = d.pillars.find((x) => x.id === pid); p.status = STATUS_ORDER[(STATUS_ORDER.indexOf(p.status) + 1) % STATUS_ORDER.length]; return d; });
  const saveNextAction = (pid) => { update((d) => { const p = d.pillars.find((x) => x.id === pid); p.nextAction = editText.trim() || p.nextAction; return d; }); setEditingPillar(null); };
  const toggleTask = (phaseId, taskId) => update((d) => { const t = d.phases.find((p) => p.id === phaseId).tasks.find((x) => x.id === taskId); t.done = !t.done; return d; });
  const addTaskManual = (phaseId) => { const text = newTask.trim(); if (!text) return; update((d) => { d.phases.find((p) => p.id === phaseId).tasks.push({ id: uid("t"), pillar: "professional", text, done: false }); return d; }); setNewTask(""); setAddingTo(null); };
  const removeTask = (phaseId, taskId) => update((d) => { const ph = d.phases.find((p) => p.id === phaseId); ph.tasks = ph.tasks.filter((t) => t.id !== taskId); return d; });
  const bumpMilestone = (mid, delta) => update((d) => { const m = d.milestones.find((x) => x.id === mid); m.progress = Math.min(100, Math.max(0, m.progress + delta)); return d; });
  const removeMilestone = (mid) => update((d) => { d.milestones = d.milestones.filter((m) => m.id !== mid); return d; });
  const addMilestoneManual = () => { const label = msForm.label.trim(); if (!label) return; update((d) => { d.milestones.push({ id: uid("m"), pillar: msForm.pillar, label, target: msForm.target.trim() || "2026", progress: 0 }); return d; }); setMsForm({ open: false, label: "", target: "", pillar: "professional" }); };
  const addWinManual = () => { const text = winForm.text.trim(); if (!text) return; update((d) => { d.wins.unshift({ id: uid("w"), date: todayISO, scope: winForm.scope, pillar: winForm.pillar, text }); return d; }); setWinForm({ open: false, text: "", pillar: "professional", scope: "professional" }); };
  const removeWin = (id) => update((d) => { d.wins = d.wins.filter((w) => w.id !== id); return d; });
  const removeEvent = (id) => update((d) => { d.events = d.events.filter((e) => e.id !== id); return d; });

  /* ---- groceries (under Home) ---- */
  const addGrocery = () => {
    const items = groceryInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    update((d) => { for (const t of items) d.groceries.push({ id: uid("g"), text: t, done: false }); return d; });
    setGroceryInput("");
  };
  const toggleGrocery = (id) => update((d) => { const g = d.groceries.find((x) => x.id === id); if (g) g.done = !g.done; return d; });
  const removeGroceryManual = (id) => update((d) => { d.groceries = d.groceries.filter((g) => g.id !== id); return d; });
  const clearCheckedGroceries = () => update((d) => { d.groceries = d.groceries.filter((g) => !g.done); return d; });

  /* ---- birthday & horoscope ---- */
  const saveBirthday = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bdayInput)) return;
    update((d) => {
      d.profile = { ...(d.profile || {}), birthday: bdayInput };
      const nb = nextBirthday(bdayInput, today);
      d.events = d.events.filter((e) => e.id !== "ev-bday");
      d.events.push({ id: "ev-bday", date: toISO(nb), time: "", title: "🎂 Mia's birthday", pillar: "family", booked: true });
      d.horoscope = null;
      return d;
    });
    horoFetched.current = false;
  };

  /* ---- styles ---- */
  const card = { background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: 18, backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" };
  const tabBtn = (id) => ({ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "7px 12px", borderRadius: 999, border: `1px solid ${tab === id ? T.accent : "transparent"}`, cursor: "pointer", background: tab === id ? T.accentSoft : "transparent", color: tab === id ? T.accent : T.inkSoft, transition: "all 0.15s", boxShadow: tab === id ? "0 4px 14px rgba(110,91,255,0.22)" : "none" });
  const inputStyle = { fontSize: 14, padding: "9px 12px", border: `1px solid ${T.line}`, borderRadius: 10, fontFamily: T.body, background: T.cardUp, color: T.ink };

  /* ---- calendar ---- */
  const monthName = new Date(calMonth.y, calMonth.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDow = new Date(calMonth.y, calMonth.m, 1).getDay();
  const daysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate();
  const eventsByDate = {};
  for (const e of data.events) (eventsByDate[e.date] = eventsByDate[e.date] || []).push(e);
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const selectedEvents = selectedDay ? eventsByDate[selectedDay] || [] : [];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink, fontFamily: T.body }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
        button:focus-visible, input:focus-visible { outline: 2px solid ${T.accent}; outline-offset: 2px; }
        input::placeholder { color: #A1A1A6; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
        @keyframes pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }
        @keyframes aurora { 0%,100% { transform: translate(0,0) scale(1) } 33% { transform: translate(-3%,2%) scale(1.06) } 66% { transform: translate(3%,-2%) scale(0.97) } }
        ::-webkit-scrollbar { width: 8px } ::-webkit-scrollbar-thumb { background: #D2D2D7; border-radius: 4px }
      `}</style>

      {/* ---- aurora field ---- */}
      <div aria-hidden="true" style={{ position: "fixed", inset: "-10%", zIndex: 0, pointerEvents: "none", animation: "aurora 24s ease-in-out infinite", background: "radial-gradient(560px 420px at 12% 8%, rgba(110,91,255,0.18), transparent 62%), radial-gradient(680px 520px at 88% 14%, rgba(10,200,255,0.14), transparent 62%), radial-gradient(760px 560px at 50% 108%, rgba(255,45,150,0.10), transparent 62%)" }} />

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "30px 16px 80px", position: "relative", zIndex: 1 }}>
        {/* ---------- Header (site-style hero) ---------- */}
        <header style={{ marginBottom: 26 }}>
          <Eyebrow>Life Operations → 2026</Eyebrow>
          <h1 style={{ fontFamily: T.display, fontWeight: 700, fontSize: "clamp(26px, 5vw, 38px)", lineHeight: 1.12, margin: 0, letterSpacing: "-0.02em" }}>
            I build systems that scale.<br />
            <span style={{ background: "linear-gradient(92deg, #6E5BFF 0%, #0AC8FF 60%, #FF2D96 120%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>This one runs my year.</span>
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 28, marginTop: 22, alignItems: "flex-end" }}>
            {[
              { n: yearLeft, l: "Days left in 2026" },
              { n: `${doneCount}/${allTasks.length}`, l: "Sprint tasks done" },
              { n: data.wins.length, l: "Wins logged" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 26 }}>{s.n}</div>
                <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: T.inkSoft, marginTop: 3 }}>{s.l}</div>
              </div>
            ))}
            <div style={{ marginLeft: "auto" }}>
              <WeekDots weekIndex={weekIndex} />
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.inkSoft, marginTop: 7, letterSpacing: "0.06em" }}>52 WEEKS · CURRENT WEEK HIGHLIGHTED</div>
            </div>
          </div>
        </header>

        {/* ---------- Nav ---------- */}
        <nav style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap", alignItems: "center", borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}`, padding: "10px 0" }}>
          <button style={tabBtn("assistant")} onClick={() => setTab("assistant")}>Assistant</button>
          <button style={tabBtn("overview")} onClick={() => setTab("overview")}>Pillars</button>
          <button style={tabBtn("roadmap")} onClick={() => setTab("roadmap")}>Roadmap</button>
          <button style={tabBtn("calendar")} onClick={() => setTab("calendar")}>Calendar</button>
          <button style={tabBtn("wins")} onClick={() => setTab("wins")}>Wins</button>
          <button style={tabBtn("milestones")} onClick={() => setTab("milestones")}>Milestones</button>
          <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 11, color: saveState === "error" ? "#E86E5A" : T.inkSoft }}>
            {saveState === "saving" && "saving…"}{saveState === "saved" && "saved ✓"}{saveState === "error" && "save failed"}
          </span>
        </nav>

        {/* ================= ASSISTANT ================= */}
        {tab === "assistant" && (
          <div style={{ ...card, padding: 0, display: "flex", flexDirection: "column", height: "62vh", minHeight: 420 }}>
            <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              {data.chat.length === 0 && (
                <div style={{ margin: "auto", textAlign: "center", maxWidth: 460 }}>
                  <div style={{ color: T.accent, fontSize: 20, marginBottom: 10 }}>✦</div>
                  <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Full operational support. Report, ask, or hand me the keys.</div>
                  <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.7 }}>
                    "Finished compliance training" · "Suggest how to rebalance my week" · "Add a Health & Beauty milestone for a quarterly facial routine" · "What's slipping?" · "Book family dinner Sunday at 6"
                  </div>
                </div>
              )}
              {data.chat.map((m) => (
                <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "84%" }}>
                  <div style={{ padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.55, background: m.role === "user" ? T.accent : T.cardUp, color: m.role === "user" ? "#FFFFFF" : T.ink, borderBottomRightRadius: m.role === "user" ? 4 : 12, borderBottomLeftRadius: m.role === "user" ? 12 : 4 }}>
                    {m.text}
                  </div>
                  {m.applied && m.applied.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                      {m.applied.map((a, i) => (
                        <span key={i} style={{ fontFamily: T.mono, fontSize: 10.5, color: T.accent, background: T.accentSoft, borderRadius: 999, padding: "3px 9px" }}>{a}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {thinking && <div style={{ alignSelf: "flex-start", fontFamily: T.mono, fontSize: 12, color: T.inkSoft, animation: "pulse 1.2s infinite" }}>thinking…</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ borderTop: `1px solid ${T.line}`, padding: 12, display: "flex", gap: 8 }}>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} placeholder="Report progress, ask for suggestions, make updates…" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={sendChat} disabled={thinking} aria-label="Send" style={{ border: "none", background: thinking ? "#C7C7CC" : T.accent, color: "#FFFFFF", borderRadius: 8, padding: "0 16px", cursor: thinking ? "default" : "pointer", display: "flex", alignItems: "center" }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ================= PILLARS ================= */}
        {tab === "overview" && (
          <div style={{ display: "grid", gap: 12 }}>
            {/* ---- Today strip: birthday + horoscope ---- */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              <div style={card}>
                <Eyebrow>🎂 Birthday</Eyebrow>
                {data.profile?.birthday ? (() => {
                  const nb = nextBirthday(data.profile.birthday, today);
                  const days = daysBetween(today, nb);
                  const age = nb.getFullYear() - Number(data.profile.birthday.slice(0, 4));
                  return days === 0 ? (
                    <div>
                      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 22 }}>Happy birthday, Mia. 🎉</div>
                      <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 6 }}>{age} today. Log it as a win — it counts.</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 24 }}>{days} day{days === 1 ? "" : "s"}</div>
                      <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 6 }}>
                        until {nb.toLocaleDateString("en-US", { month: "long", day: "numeric" })} — turning {age}. Already on your calendar.
                      </div>
                    </div>
                  );
                })() : (
                  <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontSize: 13, color: T.inkSoft }}>Set your birthdate — stored privately in this app only. Unlocks the countdown, a calendar entry, and your horoscope.</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type="date" value={bdayInput} onChange={(e) => setBdayInput(e.target.value)} style={{ ...inputStyle, flex: 1, colorScheme: "dark" }} />
                      <button onClick={saveBirthday} style={{ border: "none", background: T.accent, color: "#FFFFFF", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Save</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={card}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <Eyebrow>{data.profile?.birthday ? `${zodiacFor(data.profile.birthday).emoji} ${zodiacFor(data.profile.birthday).name} · Today` : "♈ Horoscope"}</Eyebrow>
                  {data.profile?.birthday && (
                    <button onClick={() => refreshHoroscope(true)} disabled={horoLoading} style={{ marginLeft: "auto", border: "none", background: "none", cursor: horoLoading ? "default" : "pointer", color: T.inkSoft, fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.05em" }}>
                      {horoLoading ? "…" : "↻ REFRESH"}
                    </button>
                  )}
                </div>
                {!data.profile?.birthday ? (
                  <div style={{ fontSize: 13, color: T.inkSoft }}>Set your birthday and your sign's daily reading appears here.</div>
                ) : horoLoading && !data.horoscope ? (
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.inkSoft, animation: "pulse 1.2s infinite" }}>consulting the sky…</div>
                ) : (
                  <div>
                    <div style={{ fontSize: 14, lineHeight: 1.6 }}>{data.horoscope?.text}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 10, color: T.inkSoft, marginTop: 8, letterSpacing: "0.05em" }}>AI-GENERATED DAILY · FOR FUN, NOT FATE</div>
                  </div>
                )}
              </div>
            </div>

            <Eyebrow>Six pillars · one system</Eyebrow>
            {data.pillars.map((p) => {
              const color = PILLAR_COLORS[p.id];
              return (
                <div key={p.id} style={{ ...card, borderLeft: `3px solid ${color}`, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
                  <div style={{ color, fontSize: 16 }}>✦</div>
                  <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                    <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 16 }}>{PILLAR_NAMES[p.id]}</div>
                    <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 2 }}>{p.objective}</div>
                    {editingPillar === p.id ? (
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveNextAction(p.id)} style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
                        <button onClick={() => saveNextAction(p.id)} style={{ border: "none", background: T.accent, color: "#FFFFFF", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Save</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingPillar(p.id); setEditText(p.nextAction); }} title="Click to edit" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, background: "none", border: "none", padding: 0, cursor: "pointer", color: T.ink, fontSize: 13, textAlign: "left" }}>
                        <span style={{ color, flexShrink: 0 }}>→</span>
                        <span style={{ borderBottom: `1px dashed ${T.line}` }}>{p.nextAction}</span>
                      </button>
                    )}
                  </div>
                  <StatusPill status={p.status} onClick={() => cycleStatus(p.id)} />
                </div>
              );
            })}
            {/* ---- Groceries · under Home ---- */}
            <div style={{ ...card, borderLeft: `3px solid ${PILLAR_COLORS.home}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ color: PILLAR_COLORS.home }}>🛒</span>
                <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 16 }}>Groceries</span>
                <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkSoft, letterSpacing: "0.06em" }}>· UNDER HOME</span>
                {data.groceries.some((g) => g.done) && (
                  <button onClick={clearCheckedGroceries} style={{ marginLeft: "auto", border: "none", background: "none", cursor: "pointer", color: T.inkSoft, fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.05em" }}>CLEAR CHECKED</button>
                )}
              </div>
              {data.groceries.length === 0 && <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 8 }}>List is empty. Add below, or tell the Assistant — "add eggs, oat milk, and salmon to groceries."</div>}
              <div style={{ display: "grid", gap: 4 }}>
                {data.groceries.map((g) => (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 8, background: g.done ? T.track : "transparent" }}>
                    <button onClick={() => toggleGrocery(g.id)} aria-label={g.done ? "Uncheck item" : "Check item"} style={{ width: 18, height: 18, borderRadius: 9, flexShrink: 0, border: `2px solid ${g.done ? PILLAR_COLORS.home : "#C7C7CC"}`, background: g.done ? PILLAR_COLORS.home : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {g.done && <Check size={11} color="#FFFFFF" strokeWidth={3.5} />}
                    </button>
                    <span style={{ flex: 1, fontSize: 14, color: g.done ? T.inkSoft : T.ink, textDecoration: g.done ? "line-through" : "none" }}>{g.text}</span>
                    <button onClick={() => removeGroceryManual(g.id)} aria-label="Remove item" style={{ border: "none", background: "none", cursor: "pointer", color: "#C7C7CC", padding: 2 }}><X size={13} /></button>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input value={groceryInput} onChange={(e) => setGroceryInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addGrocery()} placeholder="Add items — comma-separate for several…" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
                <button onClick={addGrocery} style={{ border: "none", background: PILLAR_COLORS.home, color: "#FFFFFF", borderRadius: 10, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Add</button>
              </div>
            </div>

            <div style={{ ...card, background: T.accentSoft, border: `1px solid ${T.accent}30` }}>
              <Eyebrow>Sticky execution rules</Eyebrow>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{data.notes}</div>
            </div>
          </div>
        )}

        {/* ================= ROADMAP ================= */}
        {tab === "roadmap" && (
          <div style={{ display: "grid", gap: 16 }}>
            <Eyebrow>Active sprint · June 11 – July 30</Eyebrow>
            {data.phases.map((ph, i) => {
              const phaseDone = ph.tasks.filter((t) => t.done).length;
              return (
                <div key={ph.id} style={card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <span style={{ fontFamily: T.mono, fontSize: 12, color: T.accent, marginRight: 10 }}>Phase 0{i + 1}</span>
                      <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17 }}>{ph.name}</span>
                    </div>
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.inkSoft }}>{ph.range} · {phaseDone}/{ph.tasks.length}</span>
                  </div>
                  <div style={{ margin: "10px 0 12px" }}>
                    <ProgressBar value={ph.tasks.length ? (phaseDone / ph.tasks.length) * 100 : 0} color={T.ink} />
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {ph.tasks.map((t) => {
                      const color = PILLAR_COLORS[t.pillar] || T.inkSoft;
                      return (
                        <div key={t.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 8, background: t.done ? T.cardUp : "transparent" }}>
                          <button onClick={() => toggleTask(ph.id, t.id)} aria-label={t.done ? "Mark not done" : "Mark done"} style={{ width: 19, height: 19, borderRadius: 5, flexShrink: 0, marginTop: 1, border: `2px solid ${t.done ? color : "#C7C7CC"}`, background: t.done ? color : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {t.done && <Check size={12} color="#FFFFFF" strokeWidth={3.5} />}
                          </button>
                          <span style={{ flex: 1, fontSize: 14, lineHeight: 1.45, color: t.done ? T.inkSoft : T.ink, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, marginTop: 6, flexShrink: 0 }} title={PILLAR_NAMES[t.pillar]} />
                          <button onClick={() => removeTask(ph.id, t.id)} aria-label="Delete task" style={{ border: "none", background: "none", cursor: "pointer", color: "#C7C7CC", padding: 2 }}><X size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                  {addingTo === ph.id ? (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <input autoFocus value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTaskManual(ph.id)} placeholder="New task…" style={{ ...inputStyle, flex: 1, fontSize: 13 }} />
                      <button onClick={() => addTaskManual(ph.id)} style={{ border: "none", background: T.accent, color: "#FFFFFF", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Add</button>
                      <button onClick={() => { setAddingTo(null); setNewTask(""); }} style={{ border: `1px solid ${T.line}`, background: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: T.inkSoft }}><X size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingTo(ph.id)} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, border: "none", background: "none", cursor: "pointer", color: T.inkSoft, fontSize: 12, fontFamily: T.mono }}><Plus size={13} /> add task</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ================= CALENDAR ================= */}
        {tab === "calendar" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <button onClick={() => { setCalMonth((c) => ({ y: c.m === 0 ? c.y - 1 : c.y, m: c.m === 0 ? 11 : c.m - 1 })); setSelectedDay(null); }} aria-label="Previous month" style={{ border: `1px solid ${T.line}`, background: T.cardUp, color: T.ink, borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}><ChevronLeft size={16} /></button>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 18 }}>{monthName}</div>
                <button onClick={() => { setCalMonth((c) => ({ y: c.m === 11 ? c.y + 1 : c.y, m: c.m === 11 ? 0 : c.m + 1 })); setSelectedDay(null); }} aria-label="Next month" style={{ border: `1px solid ${T.line}`, background: T.cardUp, color: T.ink, borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}><ChevronRight size={16} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontFamily: T.mono, fontSize: 10, color: T.inkSoft, padding: 4 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {cells.map((d, i) => {
                  if (d === null) return <div key={"e" + i} />;
                  const iso = `${calMonth.y}-${String(calMonth.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                  const evs = eventsByDate[iso] || [];
                  const isToday = iso === todayISO;
                  const isSel = iso === selectedDay;
                  const hasBooked = evs.some((e) => e.booked);
                  return (
                    <button key={iso} onClick={() => setSelectedDay(isSel ? null : iso)} style={{
                      aspectRatio: "1", borderRadius: 8, cursor: "pointer", position: "relative",
                      border: isSel ? `2px solid ${T.accent}` : isToday ? `2px solid ${T.ink}` : `1px solid ${evs.length ? T.line : "transparent"}`,
                      background: isToday ? T.ink : hasBooked ? T.accentSoft : evs.length ? T.cardUp : "transparent",
                      color: isToday ? "#FFFFFF" : T.ink,
                      fontFamily: T.mono, fontSize: 12.5, fontWeight: isToday || evs.length ? 500 : 400,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 2,
                    }}>
                      {d}
                      {evs.length > 0 && (
                        <span style={{ display: "flex", gap: 2 }}>
                          {evs.slice(0, 3).map((e, j) => (
                            <span key={j} style={{ width: 4.5, height: 4.5, borderRadius: "50%", background: isToday ? "#FFFFFF" : PILLAR_COLORS[e.pillar] || T.accent }} />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap", fontFamily: T.mono, fontSize: 10, color: T.inkSoft }}>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: T.accentSoft, border: `1px solid ${T.line}`, verticalAlign: -1, marginRight: 5 }} />booked</span>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: T.cardUp, border: `1px solid ${T.line}`, verticalAlign: -1, marginRight: 5 }} />target / tentative</span>
                <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: T.ink, verticalAlign: -1, marginRight: 5 }} />today</span>
              </div>
            </div>

            {selectedDay && (
              <div style={card}>
                <Eyebrow>{fmtDate(selectedDay)}</Eyebrow>
                {selectedEvents.length === 0 && <div style={{ fontSize: 13, color: T.inkSoft }}>Nothing scheduled. Tell the Assistant to book something here.</div>}
                {selectedEvents.map((e) => (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: PILLAR_COLORS[e.pillar], flexShrink: 0 }} />
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.inkSoft, width: 72, flexShrink: 0 }}>{e.time || "—"}</span>
                    <span style={{ flex: 1, fontSize: 14 }}>{e.title}</span>
                    {!e.booked && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.inkSoft, border: `1px solid ${T.line}`, borderRadius: 999, padding: "2px 8px" }}>target</span>}
                    <button onClick={() => removeEvent(e.id)} aria-label="Remove event" style={{ border: "none", background: "none", cursor: "pointer", color: "#C7C7CC", padding: 2 }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            <div style={card}>
              <Eyebrow>Coming up</Eyebrow>
              {upcoming.length === 0 && <div style={{ fontSize: 13, color: T.inkSoft }}>No upcoming events on the books.</div>}
              {upcoming.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.line}` }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: PILLAR_COLORS[e.pillar], flexShrink: 0 }} />
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: T.ink, width: 110, flexShrink: 0, fontWeight: 500 }}>{fmtDate(e.date)}</span>
                  <span style={{ flex: 1, fontSize: 14 }}>{e.title}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkSoft }}>{e.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= WINS ================= */}
        {tab === "wins" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <Eyebrow>Wins · {data.wins.length} logged</Eyebrow>
              <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                {["all", "professional", "personal"].map((f) => (
                  <button key={f} onClick={() => setWinFilter(f)} style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.05em", textTransform: "uppercase", padding: "5px 11px", borderRadius: 999, cursor: "pointer", border: `1px solid ${winFilter === f ? T.accent : T.line}`, background: winFilter === f ? T.accentSoft : "transparent", color: winFilter === f ? T.accent : T.inkSoft }}>{f}</button>
                ))}
              </div>
            </div>

            {winForm.open ? (
              <div style={{ ...card, display: "grid", gap: 10 }}>
                <input autoFocus value={winForm.text} onChange={(e) => setWinForm((f) => ({ ...f, text: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && addWinManual()} placeholder="What did you accomplish?" style={inputStyle} />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["professional", "personal"].map((s) => (
                    <button key={s} onClick={() => setWinForm((f) => ({ ...f, scope: s }))} style={{ fontFamily: T.mono, fontSize: 11, padding: "4px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${winForm.scope === s ? T.accent : T.line}`, background: winForm.scope === s ? T.accentSoft : "transparent", color: winForm.scope === s ? T.accent : T.inkSoft, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {PILLAR_IDS.map((pid) => (
                    <button key={pid} onClick={() => setWinForm((f) => ({ ...f, pillar: pid }))} style={{ fontFamily: T.mono, fontSize: 10.5, padding: "4px 10px", borderRadius: 999, cursor: "pointer", border: `1px solid ${winForm.pillar === pid ? PILLAR_COLORS[pid] : T.line}`, background: "transparent", color: winForm.pillar === pid ? PILLAR_COLORS[pid] : T.inkSoft }}>{PILLAR_NAMES[pid]}</button>
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button onClick={addWinManual} style={{ border: "none", background: T.accent, color: "#FFFFFF", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Log win</button>
                    <button onClick={() => setWinForm((f) => ({ ...f, open: false, text: "" }))} style={{ border: `1px solid ${T.line}`, background: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: T.inkSoft }}><X size={14} /></button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setWinForm((f) => ({ ...f, open: true }))} style={{ ...card, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: T.inkSoft, fontFamily: T.mono, fontSize: 12, justifyContent: "center", letterSpacing: "0.05em" }}><Plus size={14} /> LOG A WIN</button>
            )}

            {filteredWins.length === 0 && <div style={{ fontSize: 13, color: T.inkSoft, padding: "6px 2px" }}>No {winFilter !== "all" ? winFilter + " " : ""}wins yet — they'll land here as you report them.</div>}
            {filteredWins.map((w) => (
              <div key={w.id} style={{ ...card, borderLeft: `3px solid ${PILLAR_COLORS[w.pillar] || T.accent}`, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Trophy size={15} color={PILLAR_COLORS[w.pillar] || T.accent} style={{ marginTop: 3, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, lineHeight: 1.55 }}>{w.text}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.inkSoft, marginTop: 5 }}>{fmtDate(w.date)} · {w.scope === "professional" ? "Professional" : "Personal"} · {PILLAR_NAMES[w.pillar] || w.pillar}</div>
                </div>
                <button onClick={() => removeWin(w.id)} aria-label="Remove win" style={{ border: "none", background: "none", cursor: "pointer", color: "#C7C7CC", padding: 2 }}><X size={14} /></button>
              </div>
            ))}

            {/* ---- Year log export ---- */}
            <div style={{ ...card, background: T.accentSoft, border: `1px solid ${T.accent}30` }}>
              <Eyebrow>2026 Year Log → {EMAIL}</Eyebrow>
              <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6, marginBottom: 12 }}>
                Downloads a PNG snapshot of the full year — milestones by pillar plus all professional and personal wins — then opens a pre-addressed email draft. Attach the PNG and send.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => exportYearLogPNG(data, todayISO)} style={{ display: "flex", alignItems: "center", gap: 7, border: "none", background: T.accent, color: "#FFFFFF", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                  <Download size={15} /> Download 2026 log (PNG)
                </button>
                <button onClick={() => openEmailDraft(data, todayISO)} style={{ display: "flex", alignItems: "center", gap: 7, border: `1px solid ${T.accent}`, background: "transparent", color: T.accent, borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>
                  <Mail size={15} /> Open email draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= MILESTONES ================= */}
        {tab === "milestones" && (
          <div style={{ display: "grid", gap: 16 }}>
            <Eyebrow>Milestones · by pillar</Eyebrow>
            {PILLARS_DEF.map((pd) => {
              const ms = data.milestones.filter((m) => m.pillar === pd.id);
              return (
                <div key={pd.id} style={card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: ms.length ? 12 : 0 }}>
                    <span style={{ color: pd.color }}>✦</span>
                    <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 16 }}>{pd.name}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkSoft, marginLeft: "auto" }}>{ms.length} milestone{ms.length === 1 ? "" : "s"}</span>
                  </div>
                  {ms.length === 0 && <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 8 }}>Nothing tracked here yet — add one below or ask the Assistant.</div>}
                  <div style={{ display: "grid", gap: 14 }}>
                    {ms.map((m) => (
                      <div key={m.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14 }}>{m.label}</span>
                          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkSoft }}>Target: {m.target}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                          <button onClick={() => bumpMilestone(m.id, -5)} aria-label="Decrease" style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${T.line}`, background: T.cardUp, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSoft }}><Minus size={13} /></button>
                          <div style={{ flex: 1 }}><ProgressBar value={m.progress} color={m.progress === 100 ? "#34C759" : pd.color} /></div>
                          <button onClick={() => bumpMilestone(m.id, 5)} aria-label="Increase" style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${T.line}`, background: T.cardUp, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSoft }}><Plus size={13} /></button>
                          <span style={{ fontFamily: T.mono, fontSize: 12.5, width: 42, textAlign: "right", fontWeight: 500 }}>{m.progress}%</span>
                          <button onClick={() => removeMilestone(m.id)} aria-label="Remove milestone" style={{ border: "none", background: "none", cursor: "pointer", color: "#C7C7CC", padding: 2 }}><X size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {msForm.open ? (
              <div style={{ ...card, display: "grid", gap: 10 }}>
                <input autoFocus value={msForm.label} onChange={(e) => setMsForm((f) => ({ ...f, label: e.target.value }))} placeholder="Milestone name…" style={inputStyle} />
                <input value={msForm.target} onChange={(e) => setMsForm((f) => ({ ...f, target: e.target.value }))} placeholder="Target (e.g. Q3 2026, Dec 2026)…" style={inputStyle} />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  {PILLAR_IDS.map((pid) => (
                    <button key={pid} onClick={() => setMsForm((f) => ({ ...f, pillar: pid }))} style={{ fontFamily: T.mono, fontSize: 10.5, padding: "4px 10px", borderRadius: 999, cursor: "pointer", border: `1px solid ${msForm.pillar === pid ? PILLAR_COLORS[pid] : T.line}`, background: "transparent", color: msForm.pillar === pid ? PILLAR_COLORS[pid] : T.inkSoft }}>{PILLAR_NAMES[pid]}</button>
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                    <button onClick={addMilestoneManual} style={{ border: "none", background: T.accent, color: "#FFFFFF", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Add</button>
                    <button onClick={() => setMsForm({ open: false, label: "", target: "", pillar: "professional" })} style={{ border: `1px solid ${T.line}`, background: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: T.inkSoft }}><X size={14} /></button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setMsForm((f) => ({ ...f, open: true }))} style={{ ...card, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: T.inkSoft, fontFamily: T.mono, fontSize: 12, justifyContent: "center", letterSpacing: "0.05em" }}><Plus size={14} /> ADD MILESTONE</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
