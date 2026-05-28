import { useState } from 'react';
import { useStore } from '../store/useStore';
import { CITY_CENTERS } from '../data/seed';

interface Props {
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export function SearchBar({ onOpenFilters, activeFilterCount }: Props) {
  const query = useStore((s) => s.query);
  const setQuery = useStore((s) => s.setQuery);
  const runSearch = useStore((s) => s.runSearch);
  const recentSearches = useStore((s) => s.recentSearches);
  const loading = useStore((s) => s.loading);

  const [location, setLocation] = useState(query.location);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery({ location });
    runSearch();
  };

  return (
    <form className="searchbar" onSubmit={submit}>
      <label className="field field-location">
        <span className="field-label">Where</span>
        <input
          type="text"
          list="tipi-locations"
          placeholder="Search a destination"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Location"
        />
        <datalist id="tipi-locations">
          {CITY_CENTERS.map((c) => (
            <option key={c.city} value={c.city} />
          ))}
          {recentSearches.map((r) => (
            <option key={`recent-${r}`} value={r} />
          ))}
        </datalist>
      </label>

      <div className="field-divider" />

      <label className="field">
        <span className="field-label">Check in</span>
        <input
          type="date"
          value={query.checkIn ?? ''}
          onChange={(e) => setQuery({ checkIn: e.target.value || null })}
          aria-label="Check-in date"
        />
      </label>

      <div className="field-divider" />

      <label className="field">
        <span className="field-label">Check out</span>
        <input
          type="date"
          value={query.checkOut ?? ''}
          min={query.checkIn ?? undefined}
          onChange={(e) => setQuery({ checkOut: e.target.value || null })}
          aria-label="Check-out date"
        />
      </label>

      <div className="field-divider" />

      <label className="field field-guests">
        <span className="field-label">Guests</span>
        <div className="stepper">
          <button
            type="button"
            onClick={() => setQuery({ guests: Math.max(1, query.guests - 1) })}
            aria-label="Fewer guests"
          >
            –
          </button>
          <span>{query.guests}</span>
          <button
            type="button"
            onClick={() => setQuery({ guests: query.guests + 1 })}
            aria-label="More guests"
          >
            +
          </button>
        </div>
      </label>

      <button
        type="button"
        className={`filters-btn ${activeFilterCount ? 'has-active' : ''}`}
        onClick={onOpenFilters}
      >
        Filters{activeFilterCount ? ` · ${activeFilterCount}` : ''}
      </button>

      <button type="submit" className="search-btn" disabled={loading}>
        {loading ? 'Searching…' : 'Search'}
      </button>
    </form>
  );
}
