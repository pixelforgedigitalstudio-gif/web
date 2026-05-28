import type { Listing } from '../data/types';

// ---------------------------------------------------------------------------
// The TiPi score: a 1–10 rating averaged across four attributes.
//
//   • Location            — desirability of the spot
//   • Price-for-location  — value vs. comparable listings in the same city
//   • Reviews             — rating, only trusted once >5 reviews exist
//   • Description quality — how thorough/informative the listing is
//
// Scores are deterministic and CACHED per listing id, so panning the map or
// re-rendering never recomputes (and a future AI scorer is called at most once
// per listing).
// ---------------------------------------------------------------------------

export interface ScoreBreakdown {
  location: number;
  priceForLocation: number;
  reviews: number;
  description: number;
}

export interface TipiScore {
  total: number; // 1–10, one decimal
  breakdown: ScoreBreakdown;
}

const clamp = (n: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, n));

/** Stable 0–1 hash from a string id, so "location" is varied but repeatable. */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const PREMIUM_LOCATION_AMENITIES = ['Beach access', 'Mountain view', 'Pool'];

export function scoreLocation(l: Listing): number {
  // Base desirability (stable per listing) plus a bump for premium-location amenities.
  const base = 5.5 + hash01(l.id) * 3.5; // 5.5–9.0
  const bonus = l.amenities.filter((a) => PREMIUM_LOCATION_AMENITIES.includes(a)).length * 0.4;
  return clamp(base + bonus);
}

/** Cheaper than the city's median price → higher value score. */
export function scorePriceForLocation(price: number, cityMedian: number): number {
  if (!cityMedian) return 6;
  const ratio = price / cityMedian; // 1 == exactly median
  // ratio 0.6 → ~9, ratio 1.0 → ~7, ratio 1.6 → ~4
  return clamp(10 - (ratio - 0.6) * 5);
}

/** Per the spec: only trust reviews once there are >5; then 4★ maps to an 8. */
export function scoreReviews(rating: number, reviewCount: number): number {
  if (reviewCount <= 5) return 6; // low-confidence neutral
  return clamp((rating / 5) * 10);
}

/** Heuristic description quality — the attribute a future AI scorer replaces. */
export function scoreDescriptionHeuristic(description: string): number {
  const text = description.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const sentences = text.split(/[.!?]+/).filter(Boolean).length;
  const specifics = (text.match(/\b(WiFi|kitchen|balcony|pool|hot tub|walk|bed|view|desk|parking|deck|patio)\b/gi) || []).length;

  let s = 3;
  s += Math.min(3, words / 30); // longer, up to +3
  s += Math.min(2, sentences * 0.5); // structured prose
  s += Math.min(2, specifics * 0.4); // concrete details
  return clamp(s);
}

// --- City median prices, computed once for price-for-location ---
const cityMedianCache = new Map<string, number>();

export function buildCityMedians(listings: Listing[]): void {
  cityMedianCache.clear();
  const byCity = new Map<string, number[]>();
  for (const l of listings) {
    const arr = byCity.get(l.city) ?? [];
    arr.push(l.pricePerNight);
    byCity.set(l.city, arr);
  }
  for (const [city, prices] of byCity) {
    prices.sort((a, b) => a - b);
    cityMedianCache.set(city, prices[Math.floor(prices.length / 2)]);
  }
}

// --- Per-listing score cache ---
const scoreCache = new Map<string, TipiScore>();

const WEIGHTS = { location: 1, priceForLocation: 1, reviews: 1, description: 1 };

export function getScore(l: Listing, descriptionOverride?: number): TipiScore {
  const cached = scoreCache.get(l.id);
  if (cached && descriptionOverride === undefined) return cached;

  const breakdown: ScoreBreakdown = {
    location: scoreLocation(l),
    priceForLocation: scorePriceForLocation(l.pricePerNight, cityMedianCache.get(l.city) ?? 0),
    reviews: scoreReviews(l.rating, l.reviewCount),
    description: descriptionOverride ?? scoreDescriptionHeuristic(l.description),
  };

  const wSum = WEIGHTS.location + WEIGHTS.priceForLocation + WEIGHTS.reviews + WEIGHTS.description;
  const total =
    (breakdown.location * WEIGHTS.location +
      breakdown.priceForLocation * WEIGHTS.priceForLocation +
      breakdown.reviews * WEIGHTS.reviews +
      breakdown.description * WEIGHTS.description) /
    wSum;

  const result: TipiScore = { total: +clamp(total, 1, 10).toFixed(1), breakdown };
  scoreCache.set(l.id, result);
  return result;
}

/** Color band for a score, used by the map pins and badges. */
export function scoreTier(total: number): 'high' | 'mid' | 'low' {
  if (total >= 8) return 'high';
  if (total >= 6.5) return 'mid';
  return 'low';
}
