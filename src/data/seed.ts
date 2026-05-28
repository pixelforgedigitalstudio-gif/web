import type { Listing, Source } from './types';

// ---------------------------------------------------------------------------
// Seeded mock dataset.
//
// This stands in for real partner-API feeds during the beta. It is generated
// deterministically (a fixed PRNG seed) so every reload produces identical
// listings — which means TiPi scores stay stable and cacheable.
//
// Photos use picsum.photos (free, no API key). Swap for real CDN URLs later.
// ---------------------------------------------------------------------------

// Small deterministic PRNG (mulberry32) so the dataset never shifts between runs.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CitySpec {
  city: string;
  lat: number;
  lng: number;
  areas: string[];
  /** Rough nightly-price center for "price-for-location" scoring. */
  priceCenter: number;
}

const CITIES: CitySpec[] = [
  { city: 'Miami, FL', lat: 25.7617, lng: -80.1918, priceCenter: 320, areas: ['South Beach', 'Brickell', 'Wynwood', 'Coconut Grove', 'Little Havana'] },
  { city: 'Austin, TX', lat: 30.2672, lng: -97.7431, priceCenter: 240, areas: ['Downtown', 'East Austin', 'Zilker', 'South Congress', 'Hyde Park'] },
  { city: 'Lake Tahoe, CA', lat: 38.9399, lng: -119.9772, priceCenter: 410, areas: ['Tahoe City', 'South Lake', 'Incline Village', 'Kings Beach'] },
  { city: 'Asheville, NC', lat: 35.5951, lng: -82.5515, priceCenter: 210, areas: ['Downtown', 'West Asheville', 'Montford', 'Biltmore Village'] },
  { city: 'Scottsdale, AZ', lat: 33.4942, lng: -111.9261, priceCenter: 280, areas: ['Old Town', 'North Scottsdale', 'McCormick Ranch'] },
];

const SOURCES: Source[] = ['Airbnb', 'Vrbo', 'Booking.com', 'Expedia'];

const ADJ = ['Sunlit', 'Cozy', 'Modern', 'Rustic', 'Breezy', 'Serene', 'Stylish', 'Charming', 'Luxe', 'Hidden'];
const NOUN = ['Bungalow', 'Loft', 'Cottage', 'Villa', 'Cabin', 'Casita', 'Retreat', 'Hideaway', 'Studio', 'Townhome'];

const AMENITY_POOL = [
  'WiFi', 'Pool', 'Hot tub', 'Kitchen', 'Free parking', 'Air conditioning',
  'Washer', 'Pet friendly', 'EV charger', 'Workspace', 'Fireplace', 'BBQ grill',
  'Beach access', 'Mountain view', 'Gym',
];

// Rich vs. sparse descriptions, so the description-quality attribute has range.
const RICH_DESC = [
  'Wake up to floor-to-ceiling windows and a private balcony overlooking the water. The fully stocked chef’s kitchen, king bed with premium linens, and a curated local guidebook make longer stays effortless. Walk to cafes, the marina, and nightlife in minutes.',
  'A light-filled retreat with reclaimed-wood accents, a record player, and a hammock on the deck. Sip coffee in the garden, grill dinner on the patio, and unwind in the hot tub under the stars. Fast WiFi and a dedicated desk for remote work.',
  'Designer-renovated home blending mid-century charm with modern comfort. Heated pool, outdoor shower, and a hammock-strung courtyard. Steps from galleries, taco spots, and the farmers market. Sleeps the whole crew comfortably.',
];
const SPARSE_DESC = [
  'Nice place close to everything. Good for a getaway.',
  'Clean unit with parking. Check-in after 3pm.',
  'Comfy spot near downtown. WiFi included.',
];

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function buildListings(): Listing[] {
  const rng = mulberry32(42);
  const listings: Listing[] = [];
  let n = 0;

  for (const c of CITIES) {
    const count = 7 + Math.floor(rng() * 3); // 7–9 per city
    for (let i = 0; i < count; i++) {
      n++;
      const id = `tipi-${n}`;
      const source = pick(rng, SOURCES);
      const bedrooms = 1 + Math.floor(rng() * 4);
      const beds = bedrooms + Math.floor(rng() * 2);
      const richDesc = rng() > 0.4;
      const reviewCount = Math.floor(rng() * 240);
      // Rating skews high like real platforms; correlate loosely with price.
      const rating = +(3.8 + rng() * 1.2).toFixed(2);
      const priceJitter = 0.55 + rng() * 1.1;
      const pricePerNight = Math.round((c.priceCenter * priceJitter) / 5) * 5;

      const amenityCount = 4 + Math.floor(rng() * 7);
      const amenities = [...AMENITY_POOL]
        .sort(() => rng() - 0.5)
        .slice(0, amenityCount);

      // Small geo scatter (~3km) around the city center.
      const lat = c.lat + (rng() - 0.5) * 0.06;
      const lng = c.lng + (rng() - 0.5) * 0.06;

      const photos = [0, 1, 2, 3].map(
        (k) => `https://picsum.photos/seed/${id}-${k}/800/600`
      );

      listings.push({
        id,
        source,
        url: `https://example.com/${source.toLowerCase().replace(/[^a-z]/g, '')}/${id}`,
        title: `${pick(rng, ADJ)} ${pick(rng, NOUN)} in ${pick(rng, c.areas)}`,
        description: richDesc ? pick(rng, RICH_DESC) : pick(rng, SPARSE_DESC),
        lat,
        lng,
        area: pick(rng, c.areas),
        city: c.city,
        pricePerNight,
        currency: 'USD',
        bedrooms,
        beds,
        bathrooms: Math.max(1, bedrooms - 1 + Math.round(rng())),
        maxGuests: beds * 2,
        rating,
        reviewCount,
        amenities,
        photos,
        instantBook: rng() > 0.45,
      });
    }
  }
  return listings;
}

export const SEED_LISTINGS: Listing[] = buildListings();

/** Distinct city centers, for "fly to" on search and default framing. */
export const CITY_CENTERS = CITIES.map((c) => ({ city: c.city, lat: c.lat, lng: c.lng }));
