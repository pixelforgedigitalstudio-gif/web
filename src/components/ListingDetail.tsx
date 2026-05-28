import { useState } from 'react';
import type { Listing } from '../data/types';
import { getScore } from '../scoring/score';
import { useStore } from '../store/useStore';
import { ScoreBadge } from './ScoreBadge';

interface Props {
  listing: Listing;
  onClose: () => void;
}

const ATTR_INFO: Record<string, string> = {
  Location: 'How desirable the spot is — proximity to the action plus premium features like beach, mountain views or a pool.',
  'Price for area': 'This nightly price compared to the median for similar stays in the same city. Below median scores higher.',
  Reviews: 'Based on the rating, but only trusted once there are more than 5 reviews. (4★ with enough reviews ≈ a score of 8.)',
  Description: 'How thorough and informative the listing text is — concrete details, structure and length.',
};

export function ListingDetail({ listing, onClose }: Props) {
  const favorites = useStore((s) => s.favorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const aiScored = useStore((s) => s.aiDescScores[listing.id] !== undefined);
  const [photo, setPhoto] = useState(0);

  const { total, breakdown } = getScore(listing);
  const isFav = favorites.includes(listing.id);
  const photos = listing.photos;

  const rows: [string, number][] = [
    ['Location', breakdown.location],
    ['Price for area', breakdown.priceForLocation],
    ['Reviews', breakdown.reviews],
    ['Description', breakdown.description],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="detail" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={listing.title}>
        <button className="detail-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="detail-gallery">
          <img src={photos[photo]} alt={`${listing.title} — photo ${photo + 1}`} />
          {photos.length > 1 && (
            <>
              <button
                className="gal-nav prev"
                onClick={() => setPhoto((p) => (p - 1 + photos.length) % photos.length)}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                className="gal-nav next"
                onClick={() => setPhoto((p) => (p + 1) % photos.length)}
                aria-label="Next photo"
              >
                ›
              </button>
              <div className="gal-dots">
                {photos.map((_, i) => (
                  <span key={i} className={i === photo ? 'on' : ''} onClick={() => setPhoto(i)} />
                ))}
              </div>
            </>
          )}
          <span className="card-source detail-source">{listing.source}</span>
          <button
            className={`fav-btn detail-fav ${isFav ? 'on' : ''}`}
            onClick={() => toggleFavorite(listing.id)}
            aria-label={isFav ? 'Remove from saved' : 'Save listing'}
          >
            {isFav ? '♥' : '♡'}
          </button>
        </div>

        <div className="detail-body">
          <div className="detail-head">
            <div>
              <h2>{listing.title}</h2>
              <p className="card-area">
                {listing.area} · {listing.city}
              </p>
            </div>
            <ScoreBadge score={total} size="lg" />
          </div>

          <p className="detail-stats">
            ★ {listing.rating.toFixed(2)} <span className="muted">({listing.reviewCount} reviews)</span>
            &nbsp;·&nbsp; {listing.bedrooms} bd · {listing.beds} beds · {listing.bathrooms} ba · up to{' '}
            {listing.maxGuests} guests
          </p>

          <p className="detail-desc">{listing.description}</p>

          <h3 className="detail-sub">Amenities</h3>
          <div className="amenity-grid">
            {listing.amenities.map((a) => (
              <span key={a} className="amenity">
                {a}
              </span>
            ))}
          </div>

          <h3 className="detail-sub">
            Why this scores {total.toFixed(1)}
            {aiScored && <span className="ai-tag">AI-graded</span>}
          </h3>
          <div className="score-breakdown detail-breakdown">
            {rows.map(([label, val]) => (
              <div className="bd-row" key={label} title={ATTR_INFO[label]}>
                <span className="bd-label">{label}</span>
                <span className="bd-bar">
                  <span className="bd-fill" style={{ width: `${val * 10}%` }} />
                </span>
                <span className="bd-val">{val.toFixed(1)}</span>
              </div>
            ))}
          </div>

          <div className="detail-foot">
            <span className="card-price">
              <strong>${listing.pricePerNight}</strong> / night
            </span>
            <a href={listing.url} target="_blank" rel="noopener noreferrer" className="search-btn detail-cta">
              View on {listing.source}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
