import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Filters, Listing, SearchQuery } from '../data/types';
import { ALL_SOURCES } from '../data/types';
import { searchAllProviders } from '../data/providers';
import { buildCityMedians, getScore } from '../scoring/score';
import { scoreDescriptionsBatch } from '../scoring/aiScorer';

export type SortKey = 'score' | 'priceAsc' | 'rating';

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

const DEFAULT_QUERY: SearchQuery = {
  location: 'Miami',
  checkIn: null,
  checkOut: null,
  guests: 2,
};

const DEFAULT_FILTERS: Filters = {
  sources: [...ALL_SOURCES],
  minPrice: 0,
  maxPrice: 1000,
  minScore: 0,
  minBedrooms: 0,
  instantBookOnly: false,
  amenities: [],
};

interface TipiState {
  // Persisted (survives browser restarts via localStorage)
  query: SearchQuery;
  filters: Filters;
  favorites: string[];
  recentSearches: string[];
  sort: SortKey;
  searchAsMove: boolean;
  /** Cached AI description scores by listing id — never re-spends tokens. */
  aiDescScores: Record<string, number>;

  // Runtime only
  results: Listing[];
  loading: boolean;
  hoveredId: string | null;
  selectedId: string | null;
  mapBounds: MapBounds | null;
  scoreVersion: number; // bumped when AI scores rebake; forces re-render
  aiUnavailable: boolean; // set once if the AI endpoint has no key

  // Actions
  setQuery: (patch: Partial<SearchQuery>) => void;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  setSort: (sort: SortKey) => void;
  toggleSearchAsMove: () => void;
  setMapBounds: (b: MapBounds) => void;
  runSearch: () => Promise<void>;
  toggleFavorite: (id: string) => void;
  setHovered: (id: string | null) => void;
  setSelected: (id: string | null) => void;
}

export const useStore = create<TipiState>()(
  persist(
    (set, get) => ({
      query: DEFAULT_QUERY,
      filters: DEFAULT_FILTERS,
      favorites: [],
      recentSearches: [],
      sort: 'score',
      searchAsMove: false,
      aiDescScores: {},

      results: [],
      loading: false,
      hoveredId: null,
      selectedId: null,
      mapBounds: null,
      scoreVersion: 0,
      aiUnavailable: false,

      setQuery: (patch) => set((s) => ({ query: { ...s.query, ...patch } })),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),
      setSort: (sort) => set({ sort }),
      toggleSearchAsMove: () => set((s) => ({ searchAsMove: !s.searchAsMove })),
      setMapBounds: (mapBounds) => set({ mapBounds }),

      runSearch: async () => {
        const { query, aiDescScores } = get();
        set({ loading: true });
        const results = await searchAllProviders(query);
        buildCityMedians(results); // recompute price-for-location context

        // Re-bake any AI description scores we already have cached for these listings.
        for (const l of results) {
          if (aiDescScores[l.id] !== undefined) getScore(l, aiDescScores[l.id]);
        }

        const loc = query.location.trim();
        set((s) => ({
          results,
          loading: false,
          recentSearches: loc
            ? [loc, ...s.recentSearches.filter((r) => r.toLowerCase() !== loc.toLowerCase())].slice(0, 6)
            : s.recentSearches,
        }));

        // Fire-and-forget AI refinement for any listings we haven't scored yet.
        void refineAi(get, set);
      },

      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id],
        })),

      setHovered: (id) => set({ hoveredId: id }),
      setSelected: (id) => set({ selectedId: id }),
    }),
    {
      name: 'tipi-store',
      // Persist user intent + saved data + cached AI scores. Never transient results.
      partialize: (s) => ({
        query: s.query,
        filters: s.filters,
        favorites: s.favorites,
        recentSearches: s.recentSearches,
        sort: s.sort,
        searchAsMove: s.searchAsMove,
        aiDescScores: s.aiDescScores,
      }),
    }
  )
);

type Getter = () => TipiState;
type Setter = (partial: Partial<TipiState> | ((s: TipiState) => Partial<TipiState>)) => void;

/**
 * Calls the AI scorer for listings missing a cached description score, then
 * re-bakes the TiPi scores. Skips entirely if a previous call reported no key,
 * so it never spams the endpoint or burns data.
 */
async function refineAi(get: Getter, set: Setter): Promise<void> {
  const { results, aiDescScores, aiUnavailable } = get();
  if (aiUnavailable) return;

  const pending = results.filter((l) => aiDescScores[l.id] === undefined);
  if (!pending.length) return;

  const scores = await scoreDescriptionsBatch(
    pending.map((l) => ({ id: l.id, title: l.title, description: l.description }))
  );

  if (scores === null) {
    set({ aiUnavailable: true }); // no key configured — fall back to heuristic silently
    return;
  }

  // Re-bake each scored listing's TiPi total with the AI description value.
  const byId = new Map(results.map((l) => [l.id, l]));
  for (const [id, val] of Object.entries(scores)) {
    const listing = byId.get(id);
    if (listing) getScore(listing, val);
  }

  set((s) => ({
    aiDescScores: { ...s.aiDescScores, ...scores },
    scoreVersion: s.scoreVersion + 1,
  }));
}
