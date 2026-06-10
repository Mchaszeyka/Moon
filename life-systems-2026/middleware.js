import { NextResponse } from "next/server";

async function sha256(s) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  // public paths: login page + login API + static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw) {
    // Fail CLOSED if the password env var is missing — never serve unprotected.
    return new NextResponse("DASHBOARD_PASSWORD is not configured.", { status: 503 });
  }
  const want = await sha256(pw);
  const have = req.cookies.get("lifeops_auth")?.value;
  if (have === want) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
