import type { Listing } from '../data/types';

/**
 * The AI slot.
 *
 * Beta ships with `null` — description quality is scored by the cheap
 * heuristic in `score.ts`, so TiPi burns zero API tokens.
 *
 * When you want AI-graded descriptions, implement this interface (e.g. a
 * call to the Claude API) and set `activeAiScorer`. To keep usage optimal:
 *   - only the description-quality attribute uses AI,
 *   - results are cached per-listing in `score.ts` (scored once, reused),
 *   - batch listings together rather than one request each.
 */
export interface AiScorer {
  /** Return a 0–10 quality score for a listing's description. */
  scoreDescription(listing: Listing): Promise<number>;
}

export const activeAiScorer: AiScorer | null = null;
