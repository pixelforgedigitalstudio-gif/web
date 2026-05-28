import type { Listing, SearchQuery } from '../types';
import { MockProvider } from './mockProvider';
import type { ListingProvider } from './types';

// ---------------------------------------------------------------------------
// Provider registry + aggregator.
//
// Beta: a single MockProvider.
// Later: push real providers here, e.g.
//   new ExpediaRapidProvider(apiKey), new BookingDemandProvider(apiKey)
// The aggregator fans out the search and merges results — no UI changes needed.
// ---------------------------------------------------------------------------

const providers: ListingProvider[] = [new MockProvider()];

export async function searchAllProviders(query: SearchQuery): Promise<Listing[]> {
  const results = await Promise.allSettled(providers.map((p) => p.search(query)));
  const merged: Listing[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') merged.push(...r.value);
  }
  return merged;
}

export type { ListingProvider };
