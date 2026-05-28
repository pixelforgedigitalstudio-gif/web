import { useStore } from '../store/useStore';
import { ALL_SOURCES } from '../data/types';

interface Props {
  onClose: () => void;
}

const AMENITIES = ['WiFi', 'Pool', 'Hot tub', 'Free parking', 'Pet friendly', 'EV charger', 'Workspace', 'Beach access'];

export function FilterModal({ onClose }: Props) {
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const resetFilters = useStore((s) => s.resetFilters);

  const toggleSource = (src: (typeof ALL_SOURCES)[number]) => {
    const has = filters.sources.includes(src);
    setFilters({
      sources: has ? filters.sources.filter((s) => s !== src) : [...filters.sources, src],
    });
  };

  const toggleAmenity = (a: string) => {
    const has = filters.amenities.includes(a);
    setFilters({
      amenities: has ? filters.amenities.filter((x) => x !== a) : [...filters.amenities, a],
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Filters">
        <div className="modal-head">
          <h2>Filters</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close filters">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <section className="filter-group">
            <h3>Sources <span className="muted">(no hotels)</span></h3>
            <div className="chips">
              {ALL_SOURCES.map((src) => (
                <button
                  key={src}
                  className={`chip ${filters.sources.includes(src) ? 'chip-on' : ''}`}
                  onClick={() => toggleSource(src)}
                >
                  {src}
                </button>
              ))}
            </div>
          </section>

          <section className="filter-group">
            <h3>Price per night</h3>
            <div className="range-row">
              <label>
                Min
                <input
                  type="number"
                  min={0}
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ minPrice: Number(e.target.value) })}
                />
              </label>
              <label>
                Max
                <input
                  type="number"
                  min={0}
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ maxPrice: Number(e.target.value) })}
                />
              </label>
            </div>
          </section>

          <section className="filter-group">
            <h3>
              Minimum TiPi score <strong className="score-inline">{filters.minScore.toFixed(1)}</strong>
            </h3>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={filters.minScore}
              onChange={(e) => setFilters({ minScore: Number(e.target.value) })}
            />
          </section>

          <section className="filter-group">
            <h3>Bedrooms</h3>
            <div className="chips">
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  className={`chip ${filters.minBedrooms === n ? 'chip-on' : ''}`}
                  onClick={() => setFilters({ minBedrooms: n })}
                >
                  {n === 0 ? 'Any' : `${n}+`}
                </button>
              ))}
            </div>
          </section>

          <section className="filter-group">
            <h3>Amenities</h3>
            <div className="chips">
              {AMENITIES.map((a) => (
                <button
                  key={a}
                  className={`chip ${filters.amenities.includes(a) ? 'chip-on' : ''}`}
                  onClick={() => toggleAmenity(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </section>

          <section className="filter-group">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={filters.instantBookOnly}
                onChange={(e) => setFilters({ instantBookOnly: e.target.checked })}
              />
              Instant Book only
            </label>
          </section>
        </div>

        <div className="modal-foot">
          <button className="link-btn" onClick={resetFilters}>
            Reset all
          </button>
          <button className="search-btn" onClick={onClose}>
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}
