import { kv } from "@vercel/kv";
import { kvConfigured, shareKey } from "../../../lib/travel";

export const dynamic = "force-dynamic";

/* PUBLIC read-only trip board. middleware.js lets /share through without the password
   gate. Only the sanitized snapshot written at publish time is ever readable here. */

const T = {
  bg: "#F5F5F7",
  card: "rgba(255,255,255,0.78)",
  ink: "#1D1D1F",
  inkSoft: "#86868B",
  line: "rgba(0,0,0,0.08)",
  accent: "#6E5BFF",
  display: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', ui-sans-serif, sans-serif",
  mono: "'JetBrains Mono', 'SFMono-Regular', Menlo, monospace",
};

function fmtRange(a, b) {
  const f = (s) => { if (!s) return ""; const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
  if (a && b) return `${f(a)} – ${f(b)}`;
  return f(a) || f(b) || "";
}

export default async function SharePage({ params }) {
  let board = null;
  if (kvConfigured()) {
    try { board = await kv.get(shareKey(params.token)); } catch {}
  }

  const wrap = { minHeight: "100vh", background: T.bg, color: T.ink, fontFamily: T.display };
  const inner = { maxWidth: 880, margin: "0 auto", padding: "40px 18px 80px", position: "relative", zIndex: 1 };

  if (!board) {
    return (
      <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧭</div>
          <div style={{ fontWeight: 600, fontSize: 20 }}>This trip board isn’t available.</div>
          <div style={{ color: T.inkSoft, marginTop: 8, fontSize: 14 }}>The link may have been unpublished or doesn’t exist.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div aria-hidden="true" style={{ position: "fixed", inset: "-10%", zIndex: 0, pointerEvents: "none", background: "radial-gradient(560px 420px at 12% 8%, rgba(110,91,255,0.16), transparent 62%), radial-gradient(680px 520px at 88% 14%, rgba(10,200,255,0.12), transparent 62%), radial-gradient(760px 560px at 50% 108%, rgba(255,45,150,0.10), transparent 62%)" }} />
      <div style={inner}>
        <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.accent, marginBottom: 10 }}>Shared trip board</div>
        <h1 style={{ fontWeight: 700, fontSize: "clamp(26px,5vw,40px)", margin: 0, letterSpacing: "-0.02em" }}>{board.title}</h1>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10, color: T.inkSoft, fontSize: 14 }}>
          {board.destination && <span>📍 {board.destination}</span>}
          {fmtRange(board.startDate, board.endDate) && <span>🗓 {fmtRange(board.startDate, board.endDate)}</span>}
          {board.vibe && <span>✨ {board.vibe}</span>}
        </div>

        {board.notes && (
          <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: 18, marginTop: 22, fontSize: 15, lineHeight: 1.65, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", whiteSpace: "pre-wrap" }}>
            {board.notes}
          </div>
        )}

        {board.photos?.length > 0 && (
          <div style={{ columnWidth: 240, columnGap: 12, marginTop: 22 }}>
            {board.photos.map((p, i) => (
              <figure key={i} style={{ margin: "0 0 12px", breakInside: "avoid" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption || board.title} style={{ width: "100%", borderRadius: 14, display: "block", border: `1px solid ${T.line}` }} />
                {p.caption && <figcaption style={{ fontSize: 12, color: T.inkSoft, marginTop: 6 }}>{p.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        {board.checklist?.length > 0 && (
          <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, padding: 18, marginTop: 22, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
            <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: 12 }}>Plan</div>
            {board.checklist.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "5px 0", fontSize: 14, color: c.done ? T.inkSoft : T.ink }}>
                <span>{c.done ? "✓" : "○"}</span>
                <span style={{ textDecoration: c.done ? "line-through" : "none" }}>{c.text}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 34, fontFamily: T.mono, fontSize: 11, color: T.inkSoft, letterSpacing: "0.05em" }}>
          Shared from Mia’s Life Systems dashboard · read-only
        </div>
      </div>
    </div>
  );
}
