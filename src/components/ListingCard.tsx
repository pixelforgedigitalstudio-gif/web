import type { Listing } from '../data/types';
import { getScore } from '../scoring/score';
import { useStore } from '../store/useStore';
import { ScoreBadge } from './ScoreBadge';

interface Props {
  listing: Listing;
  compact?: boolean;
}

export function ListingCard({ listing, compact }: Props) {
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const setSelected = useStore((s) => s.setSelected);
  const setHovered = useStore((s) => s.setHovered);

  const { total, breakdown } = getScore(listing);
  const isFav = favorites.includes(listing.id);

  return (
    <article
      className={`listing-card ${compact ? 'compact' : ''}`}
      onMouseEnter={() => !compact && setHovered(listing.id)}
      onMouseLeave={() => !compact && setHovered(null)}
      onClick={() => !compact && setSelected(listing.id)}
    >
      <div className="card-media">
        <img src={listing.photos[0]} alt={listing.title} loading="lazy" />
        <span className="card-source">{listing.source}</span>
        <button
          className={`fav-btn ${isFav ? 'on' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(listing.id);
          }}
          aria-label={isFav ? 'Remove from saved' : 'Save listing'}
        >
          {isFav ? '♥' : '♡'}
        </button>
        <ScoreBadge score={total} size={compact ? 'md' : 'lg'} />
      </div>

      <div className="card-body">
        <h3 className="card-title">{listing.title}</h3>
        <p className="card-area">
          {listing.area} · {listing.city}
        </p>
        <p className="card-meta">
          {listing.bedrooms} bd · {listing.beds} beds · {listing.bathrooms} ba · up to {listing.maxGuests} guests
        </p>
        <p className="card-rating">
          ★ {listing.rating.toFixed(2)}{' '}
          <span className="muted">({listing.reviewCount} reviews)</span>
        </p>

        {!compact && (
          <div className="score-breakdown">
            {(
              [
                ['Location', breakdown.location],
                ['Price/area', breakdown.priceForLocation],
                ['Reviews', breakdown.reviews],
                ['Detail', breakdown.description],
              ] as const
            ).map(([label, val]) => (
              <div className="bd-row" key={label}>
                <span className="bd-label">{label}</span>
                <span className="bd-bar">
                  <span className="bd-fill" style={{ width: `${val * 10}%` }} />
                </span>
                <span className="bd-val">{val.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="card-foot">
          <span className="card-price">
            <strong>${listing.pricePerNight}</strong> / night
          </span>
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="view-link"
            onClick={(e) => e.stopPropagation()}
          >
            View on {listing.source}
          </a>
        </div>
      </div>
    </article>
  );
}
