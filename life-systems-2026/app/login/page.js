"use client";

import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!pw || busy) return;
    setBusy(true);
    setErr(false);
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (r.ok) window.location.href = "/";
    else {
      setErr(true);
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif", position: "relative" }}>
      <div aria-hidden="true" style={{ position: "fixed", inset: "-10%", pointerEvents: "none", background: "radial-gradient(560px 420px at 12% 8%, rgba(110,91,255,0.18), transparent 62%), radial-gradient(680px 520px at 88% 14%, rgba(10,200,255,0.14), transparent 62%), radial-gradient(760px 560px at 50% 108%, rgba(255,45,150,0.10), transparent 62%)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "min(360px, 90vw)", background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 18, padding: 28, boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E5BFF", marginBottom: 10 }}>Life Operations → 2026</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 18px", color: "#1D1D1F", letterSpacing: "-0.02em" }}>Private system. Key required.</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          autoFocus
          style={{ width: "100%", boxSizing: "border-box", fontSize: 15, padding: "11px 14px", border: `1px solid ${err ? "#FF3B30" : "rgba(0,0,0,0.08)"}`, borderRadius: 10, background: "rgba(255,255,255,0.92)", color: "#1D1D1F", outline: "none" }}
        />
        {err && <div style={{ color: "#FF3B30", fontSize: 12, marginTop: 8 }}>That's not it — try again.</div>}
        <button
          onClick={submit}
          disabled={busy}
          style={{ width: "100%", marginTop: 14, border: "none", background: busy ? "#C7C7CC" : "#6E5BFF", color: "#fff", borderRadius: 10, padding: "11px 0", fontSize: 14, fontWeight: 600, cursor: busy ? "default" : "pointer", boxShadow: busy ? "none" : "0 6px 22px rgba(110,91,255,0.35)" }}
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  );
}
