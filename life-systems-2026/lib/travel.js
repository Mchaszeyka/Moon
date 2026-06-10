import { kv } from "@vercel/kv";

export const BOARDS_KEY = "travel:boards";
export const shareKey = (token) => `travel:share:${token}`;

/* True only when a Vercel KV store is linked (its env vars are present). Lets the
   routes fail soft with a clear 503 instead of throwing when KV isn't provisioned yet. */
export function kvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function getBoards() {
  return (await kv.get(BOARDS_KEY)) || [];
}
export async function saveBoards(boards) {
  await kv.set(BOARDS_KEY, boards);
}

/* The read-only snapshot served at the public /share/[token] route. Only fields the
   owner chose to put on a published trip board — never the rest of the dashboard. */
export function publicView(b) {
  return {
    title: b.title || "Trip",
    destination: b.destination || "",
    startDate: b.startDate || "",
    endDate: b.endDate || "",
    vibe: b.vibe || "",
    notes: b.notes || "",
    photos: (b.photos || []).map((p) => ({ url: p.url, caption: p.caption || "" })),
    checklist: (b.checklist || []).map((c) => ({ text: c.text, done: !!c.done })),
    sharedAt: Date.now(),
  };
}
