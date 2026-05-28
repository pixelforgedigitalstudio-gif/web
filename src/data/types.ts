// Core domain types for TiPi.

/** The platforms TiPi aggregates. NO HOTELS — vacation rentals only. */
export type Source = 'Airbnb' | 'Vrbo' | 'Booking.com' | 'Expedia';

export const ALL_SOURCES: Source[] = ['Airbnb', 'Vrbo', 'Booking.com', 'Expedia'];

export interface Listing {
  id: string;
  source: Source;
  /** Original listing URL on the source platform (deep link). */
  url: string;
  title: string;
  /** Short, human-written description used for the description-quality score. */
  description: string;
  lat: number;
  lng: number;
  /** Neighborhood / area label shown in the UI. */
  area: string;
  city: string;
  /** Nightly price in USD (the minimum/lead price we display on the map pin). */
  pricePerNight: number;
  currency: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  maxGuests: number;
  /** Average review rating on the source's own scale, normalized to 0–5. */
  rating: number;
  reviewCount: number;
  amenities: string[];
  photos: string[];
  instantBook: boolean;
}

/** A search request the user composes in the search bar. */
export interface SearchQuery {
  location: string;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
}

export interface Filters {
  sources: Source[];
  minPrice: number;
  maxPrice: number;
  minScore: number;
  minBedrooms: number;
  instantBookOnly: boolean;
  amenities: string[];
}
