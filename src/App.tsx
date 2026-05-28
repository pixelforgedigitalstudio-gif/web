import { useEffect, useMemo, useState } from 'react';
import { useStore } from './store/useStore';
import { getScore } from './scoring/score';
import { ALL_SOURCES } from './data/types';
import type { SortKey } from './store/useStore';
import { Splash } from './components/Splash';
import { SearchBar } from './components/SearchBar';
import { FilterModal } from './components/FilterModal';
import { MapView } from './components/MapView';
import { ListingCard } from './components/ListingCard';
import { ListingDetail } from './components/ListingDetail';

const SORT_LABELS: Record<SortKey, string> = {
  score: 'TiPi score',
  priceAsc: 'Price: low to high',
  rating: 'Guest rating',
};

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const results = useStore((s) => s.results);
  const filters = useStore((s) => s.filters);
  const favorites = useStore((s) => s.favorites);
  const loading = useStore((s) => s.loading);
  const runSearch = useStore((s) => s.runSearch);
  const sort = useStore((s) => s.sort);
  const setSort = useStore((s) => s.setSort);
  const searchAsMove = useStore((s) => s.searchAsMove);
  const toggleSearchAsMove = useStore((s) => s.toggleSearchAsMove);
  const mapBounds = useStore((s) => s.mapBounds);
  const selectedId = useStore((s) => s.selectedId);
  const setSelected = useStore((s) => s.setSelected);
  const scoreVersion = useStore((s) => s.scoreVersion);

  // Initial fetch.
  useEffect(() => {
    runSearch();
  }, [runSearch]);

  // Apply filters, then sort.
  const filtered = useMemo(() => {
    const list = results.filter((l) => {
      if (!filters.sources.includes(l.source)) return false;
      if (l.pricePerNight < filters.minPrice || l.pricePerNight > filters.maxPrice) return false;
      if (getScore(l).total < filters.minScore) return false;
      if (l.bedrooms < filters.minBedrooms) return false;
      if (filters.instantBookOnly && !l.instantBook) return false;
      if (filters.amenities.length && !filters.amenities.every((a) => l.amenities.includes(a))) return false;
      return true;
    });
    list.sort((a, b) => {
      if (sort === 'priceAsc') return a.pricePerNight - b.pricePerNight;
      if (sort === 'rating') return b.rating - a.rating;
      return getScore(b).total - getScore(a).total;
    });
    return list;
    // scoreVersion forces a re-sort once AI scores rebake.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, filters, sort, scoreVersion]);

  // Optionally narrow to what's visible on the map.
  const inView = useMemo(() => {
    if (!searchAsMove || !mapBounds) return filtered;
    return filtered.filter(
      (l) =>
        l.lat >= mapBounds.south &&
        l.lat <= mapBounds.north &&
        l.lng >= mapBounds.west &&
        l.lng <= mapBounds.east
    );
  }, [filtered, searchAsMove, mapBounds]);

  const shown = useMemo(
    () => (showSaved ? inView.filter((l) => favorites.includes(l.id)) : inView),
    [showSaved, inView, favorites]
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.sources.length !== ALL_SOURCES.length) n++;
    if (filters.minPrice > 0) n++;
    if (filters.maxPrice < 1000) n++;
    if (filters.minScore > 0) n++;
    if (filters.minBedrooms > 0) n++;
    if (filters.instantBookOnly) n++;
    if (filters.amenities.length) n++;
    return n;
  }, [filters]);

  const selected = results.find((l) => l.id === selectedId) ?? null;

  return (
    <div className="app">
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}

      <header className="topbar">
        <div className="brand">TiPi</div>
        <SearchBar onOpenFilters={() => setShowFilters(true)} activeFilterCount={activeFilterCount} />
      </header>

      <main className="layout">
        <aside className="results-panel">
          <div className="results-head">
            <div className="results-tabs">
              <button className={!showSaved ? 'tab-on' : ''} onClick={() => setShowSaved(false)}>
                {loading ? 'Searching…' : `${shown.length} stays`}
              </button>
              <button className={showSaved ? 'tab-on' : ''} onClick={() => setShowSaved(true)}>
                Saved · {favorites.length}
              </button>
            </div>
            <div className="results-controls">
              <label className="sort-control">
                Sort
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <option key={k} value={k}>
                      {SORT_LABELS[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="move-toggle">
                <input type="checkbox" checked={searchAsMove} onChange={toggleSearchAsMove} />
                Search as I move the map
              </label>
            </div>
          </div>

          <div className="results-list">
            {loading &&
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-card" />)}
            {!loading && shown.map((l) => <ListingCard key={l.id} listing={l} />)}
            {!loading && shown.length === 0 && (
              <p className="empty">
                {showSaved
                  ? 'No saved stays yet — tap the ♡ on any listing.'
                  : searchAsMove
                  ? 'No stays in this part of the map. Zoom out or pan around.'
                  : 'No stays match. Try widening your filters or another destination.'}
              </p>
            )}
          </div>
        </aside>

        <section className="map-panel">
          <MapView listings={shown} />
        </section>
      </main>

      {showFilters && <FilterModal onClose={() => setShowFilters(false)} />}
      {selected && <ListingDetail listing={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
