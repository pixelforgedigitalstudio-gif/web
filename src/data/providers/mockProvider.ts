import type { Listing, SearchQuery } from '../types';
import { SEED_LISTINGS } from '../seed';
import type { ListingProvider } from './types';

/**
 * Serves the seeded dataset, filtered by the search query, with a tiny
 * simulated network delay so the UI's loading states are exercised exactly
 * as they would be against a real API.
 */
export class MockProvider implements ListingProvider {
  readonly name = 'mock';

  async search(query: SearchQuery): Promise<Listing[]> {
    await new Promise((r) => setTimeout(r, 250));

    const loc = query.location.trim().toLowerCase();
    return SEED_LISTINGS.filter((l) => {
      if (l.maxGuests < query.guests) return false;
      if (loc) {
        const hay = `${l.city} ${l.area}`.toLowerCase();
        if (!hay.includes(loc)) return false;
      }
      return true;
    });
  }
}
