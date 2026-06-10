import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Photo upload -> Vercel Blob. Returns a public URL stored on the trip board.
   Gated by middleware; requires a Blob store (BLOB_READ_WRITE_TOKEN). */

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per image

export async function POST(req) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ configured: false, error: "Blob storage not configured" }, { status: 503 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return Response.json({ error: "file required" }, { status: 400 });
    if (!String(file.type || "").startsWith("image/")) return Response.json({ error: "images only" }, { status: 415 });
    if (file.size > MAX_BYTES) return Response.json({ error: "image too large (max 8 MB)" }, { status: 413 });

    const safe = (file.name || "photo").replace(/[^a-zA-Z0-9._-]/g, "_");
    const blob = await put(`travel/${safe}`, file, { access: "public", addRandomSuffix: true });
    return Response.json({ url: blob.url });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 502 });
  }
}
