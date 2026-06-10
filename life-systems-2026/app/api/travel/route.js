import { kv } from "@vercel/kv";
import { BOARDS_KEY, kvConfigured, getBoards, publicView, shareKey } from "../../../lib/travel";

export const dynamic = "force-dynamic";

/* Trip boards live in Vercel KV (server-side) so they survive across devices and can
   back public share links. Gated by middleware like every other /api route. */

export async function GET() {
  if (!kvConfigured()) return Response.json({ configured: false, boards: [] }, { status: 503 });
  try {
    return Response.json({ configured: true, boards: await getBoards() });
  } catch (e) {
    return Response.json({ configured: true, error: String(e.message || e) }, { status: 502 });
  }
}

export async function PUT(req) {
  if (!kvConfigured()) return Response.json({ configured: false }, { status: 503 });
  try {
    const { boards } = await req.json();
    if (!Array.isArray(boards)) return Response.json({ error: "boards array required" }, { status: 400 });
    await kv.set(BOARDS_KEY, boards);
    // Keep any live public snapshots in sync with edits.
    for (const b of boards) {
      if (b.shareToken) await kv.set(shareKey(b.shareToken), publicView(b));
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
