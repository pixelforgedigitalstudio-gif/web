import { useEffect, useMemo, useState } from 'react';
import { useStore } from './store/useStore';
import { getScore } from './scoring/score';
import { ALL_SOURCES } from './data/types';
import { Splash } from './components/Splash';
import { SearchBar } from './components/SearchBar';
import { FilterModal } from './components/FilterModal';
import { MapView } from './components/MapView';
import { ListingCard } from './components/ListingCard';

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const results = useStore((s) => s.results);
  const filters = useStore((s) => s.filters);
  const favorites = useStore((s) => s.favorites);
  const loading = useStore((s) => s.loading);
  const runSearch = useStore((s) => s.runSearch);

  // Initial fetch.
  useEffect(() => {
    runSearch();
  }, [runSearch]);

  // Apply filters + sort by TiPi score (highest first).
  const filtered = useMemo(() => {
    return results
      .filter((l) => {
        if (!filters.sources.includes(l.source)) return false;
        if (l.pricePerNight < filters.minPrice || l.pricePerNight > filters.maxPrice) return false;
        if (getScore(l).total < filters.minScore) return false;
        if (l.bedrooms < filters.minBedrooms) return false;
        if (filters.instantBookOnly && !l.instantBook) return false;
        if (filters.amenities.length && !filters.amenities.every((a) => l.amenities.includes(a)))
          return false;
        return true;
      })
      .sort((a, b) => getScore(b).total - getScore(a).total);
  }, [results, filters]);

  const shown = useMemo(
    () => (showSaved ? filtered.filter((l) => favorites.includes(l.id)) : filtered),
    [showSaved, filtered, favorites]
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
                {loading ? 'Searching…' : `${filtered.length} stays`}
              </button>
              <button className={showSaved ? 'tab-on' : ''} onClick={() => setShowSaved(true)}>
                Saved · {favorites.length}
              </button>
            </div>
            <p className="results-sub">Sorted by TiPi score</p>
          </div>

          <div className="results-list">
            {shown.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
            {!loading && shown.length === 0 && (
              <p className="empty">
                {showSaved
                  ? 'No saved stays yet — tap the ♡ on any listing.'
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
    </div>
  );
}
