export const dynamic = "force-dynamic";

/* Server-side Strava proxy. Credentials live ONLY in env vars (never the browser),
   mirroring the Anthropic proxy. Gated by middleware.js like every other /api route. */

async function getAccessToken() {
  const r = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: process.env.STRAVA_REFRESH_TOKEN,
    }),
  });
  if (!r.ok) throw new Error("Strava token exchange failed (" + r.status + ")");
  const j = await r.json();
  if (!j.access_token) throw new Error("No access token from Strava");
  return j.access_token;
}

/* Monday-anchored week key, e.g. "2026-06-08" */
function weekStart(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = Monday
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const isRun = (a) => (a.sport_type || a.type) === "Run";

function summarize(activities) {
  const now = new Date();
  const thisWeekKey = isoDate(weekStart(now));
  const lastWeekKey = isoDate(weekStart(new Date(now.getTime() - 7 * 864e5)));
  const yearStart = new Date(now.getFullYear(), 0, 1);

  // Last 12 Monday weeks, oldest -> newest
  const weekKeys = [];
  for (let i = 11; i >= 0; i--) weekKeys.push(isoDate(weekStart(new Date(now.getTime() - i * 7 * 864e5))));
  const weekMap = Object.fromEntries(weekKeys.map((k) => [k, { week: k, meters: 0, runs: 0 }]));

  let thisWeek = { meters: 0, runs: 0, movingTime: 0, elevation: 0, activities: 0 };
  let lastWeek = { meters: 0, runs: 0 };
  let longestRunMeters = 0;
  let ytdRunMeters = 0;
  let lastRunDate = null;

  for (const a of activities) {
    const start = new Date(a.start_date_local || a.start_date);
    const wk = isoDate(weekStart(start));
    const run = isRun(a);
    if (wk === thisWeekKey) {
      thisWeek.activities += 1;
      thisWeek.movingTime += a.moving_time || 0;
      thisWeek.elevation += a.total_elevation_gain || 0;
      if (run) { thisWeek.meters += a.distance || 0; thisWeek.runs += 1; }
    }
    if (wk === lastWeekKey && run) { lastWeek.meters += a.distance || 0; lastWeek.runs += 1; }
    if (run && weekMap[wk]) { weekMap[wk].meters += a.distance || 0; weekMap[wk].runs += 1; }
    if (run && start >= yearStart) ytdRunMeters += a.distance || 0;
    if (run && start >= new Date(now.getTime() - 90 * 864e5)) longestRunMeters = Math.max(longestRunMeters, a.distance || 0);
    if (run && (!lastRunDate || start > lastRunDate)) lastRunDate = start;
  }

  const slim = (a) => ({
    id: String(a.id),
    name: a.name,
    sport: a.sport_type || a.type,
    date: isoDate(new Date(a.start_date_local || a.start_date)),
    distance: a.distance || 0,
    movingTime: a.moving_time || 0,
    avgSpeed: a.average_speed || 0,
    elevation: a.total_elevation_gain || 0,
    relativeEffort: a.suffer_score || 0,
    prs: a.pr_count || 0,
    achievements: a.achievement_count || 0,
    isRace: isRun(a) && a.workout_type === 1,
  });

  const recent = activities.slice(0, 10).map(slim);
  const races = activities.filter((a) => isRun(a) && a.workout_type === 1).slice(0, 8).map(slim);

  return {
    thisWeek,
    lastWeek,
    weekly: weekKeys.map((k) => weekMap[k]),
    longestRunMeters,
    ytdRunMeters,
    lastRunDaysAgo: lastRunDate ? Math.floor((now - lastRunDate) / 864e5) : null,
    recent,
    races,
  };
}

export async function GET() {
  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET || !process.env.STRAVA_REFRESH_TOKEN) {
    return Response.json({ configured: false, error: "Strava not configured" }, { status: 503 });
  }
  try {
    const token = await getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };
    const [athleteRes, actsRes] = await Promise.all([
      fetch("https://www.strava.com/api/v3/athlete", { headers }),
      fetch("https://www.strava.com/api/v3/athlete/activities?per_page=100", { headers }),
    ]);
    if (!actsRes.ok) throw new Error("activities fetch failed (" + actsRes.status + ")");
    const athlete = athleteRes.ok ? await athleteRes.json() : {};
    const activities = await actsRes.json();
    if (!Array.isArray(activities)) throw new Error("unexpected activities payload");
    return Response.json(
      {
        configured: true,
        athlete: { firstName: athlete.firstname, city: athlete.city, state: athlete.state },
        summary: summarize(activities),
      },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (e) {
    return Response.json({ configured: true, error: String(e.message || e) }, { status: 502 });
  }
}
