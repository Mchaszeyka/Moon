import { kv } from "@vercel/kv";
import { BOARDS_KEY, kvConfigured, getBoards, publicView, shareKey } from "../../../../lib/travel";

export const dynamic = "force-dynamic";

/* Publish/unpublish a single trip board as a public share link.
   Publishing writes a sanitized read-only snapshot at travel:share:<token>;
   unpublishing deletes it so the link goes dead immediately. */

export async function POST(req) {
  if (!kvConfigured()) return Response.json({ configured: false }, { status: 503 });
  try {
    const { boardId, action } = await req.json();
    const boards = await getBoards();
    const board = boards.find((b) => b.id === boardId);
    if (!board) return Response.json({ error: "board not found" }, { status: 404 });

    if (action === "unpublish") {
      if (board.shareToken) await kv.del(shareKey(board.shareToken));
      board.shareToken = null;
      await kv.set(BOARDS_KEY, boards);
      return Response.json({ ok: true, shareToken: null });
    }

    // publish (default)
    if (!board.shareToken) board.shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await kv.set(shareKey(board.shareToken), publicView(board));
    await kv.set(BOARDS_KEY, boards);
    return Response.json({ ok: true, shareToken: board.shareToken });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
