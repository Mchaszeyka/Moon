import { NextResponse } from "next/server";

async function sha256(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req) {
  const { password } = await req.json();
  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) return NextResponse.json({ ok: false, error: "Not configured" }, { status: 503 });
  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const token = await sha256(expected);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("lifeops_auth", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 60, // 60 days
    path: "/",
  });
  return res;
}
