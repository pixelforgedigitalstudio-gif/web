// ---------------------------------------------------------------------------
// AI scorer — client side.
//
// This calls a small server-side endpoint (`/api/score-descriptions`, added as
// a Vite dev-server middleware in `vite.config.ts`) which holds the Claude API
// key. The key NEVER ships to the browser.
//
// Cost control:
//   • The store only sends listings it hasn't scored before.
//   • Scores are cached in localStorage (persisted), so a listing is graded
//     at most once, ever — re-runs and restarts cost nothing.
//   • Requests are batched (many listings → one model call).
// ---------------------------------------------------------------------------

export interface DescItem {
  id: string;
  title: string;
  description: string;
}

/**
 * Returns a map of listing id → 0–10 description score, or `null` if the
 * endpoint is unavailable / no API key is configured (caller then falls back
 * to the heuristic score and stops asking).
 */
export async function scoreDescriptionsBatch(
  items: DescItem[]
): Promise<Record<string, number> | null> {
  if (!items.length) return {};
  try {
    const res = await fetch('/api/score-descriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return null; // 503 = no key configured, etc.
    const data = (await res.json()) as { scores?: Record<string, number> };
    return data.scores ?? {};
  } catch {
    return null;
  }
}
