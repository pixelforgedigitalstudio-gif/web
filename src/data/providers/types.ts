import type { Listing, SearchQuery } from '../types';

/**
 * The single interface every data source implements.
 *
 * Today only `MockProvider` exists. When a real partner API lands
 * (Expedia Rapid, Booking Demand API, a future Airbnb/Vrbo partnership),
 * implement this same interface and register it in `providers/index.ts` —
 * nothing else in the app needs to change.
 */
export interface ListingProvider {
  /** Display name, matches a `Source` value. */
  readonly name: string;
  /** Fetch listings matching a query. Async to mirror a real network call. */
  search(query: SearchQuery): Promise<Listing[]>;
}
