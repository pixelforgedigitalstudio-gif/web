import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Filters, Listing, SearchQuery } from '../data/types';
import { ALL_SOURCES } from '../data/types';
import { searchAllProviders } from '../data/providers';
import { buildCityMedians } from '../scoring/score';

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

  // Runtime only
  results: Listing[];
  loading: boolean;
  hoveredId: string | null;
  selectedId: string | null;

  // Actions
  setQuery: (patch: Partial<SearchQuery>) => void;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
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

      results: [],
      loading: false,
      hoveredId: null,
      selectedId: null,

      setQuery: (patch) => set((s) => ({ query: { ...s.query, ...patch } })),
      setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      resetFilters: () => set({ filters: DEFAULT_FILTERS }),

      runSearch: async () => {
        const { query } = get();
        set({ loading: true });
        const results = await searchAllProviders(query);
        buildCityMedians(results); // recompute price-for-location context
        const loc = query.location.trim();
        set((s) => ({
          results,
          loading: false,
          recentSearches: loc
            ? [loc, ...s.recentSearches.filter((r) => r.toLowerCase() !== loc.toLowerCase())].slice(0, 6)
            : s.recentSearches,
        }));
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
      // Only persist user intent + saved data, never transient results.
      partialize: (s) => ({
        query: s.query,
        filters: s.filters,
        favorites: s.favorites,
        recentSearches: s.recentSearches,
      }),
    }
  )
);
