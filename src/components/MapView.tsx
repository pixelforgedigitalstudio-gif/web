import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import type { Listing } from '../data/types';
import { getScore, scoreTier } from '../scoring/score';
import { useStore } from '../store/useStore';
import { ListingCard } from './ListingCard';

interface Props {
  listings: Listing[];
}

/** Build the divIcon pin: a price + TiPi-score pill colored by tier. */
function makeIcon(l: Listing, selected: boolean): L.DivIcon {
  const score = getScore(l).total;
  const tier = scoreTier(score);
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin pin-${tier} ${selected ? 'pin-selected' : ''}">
        <span class="pin-price">$${l.pricePerNight}</span>
        <span class="pin-score">${score.toFixed(1)}</span>
      </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/** Re-frames the map to fit the current result set whenever it changes. */
function FitBounds({ listings }: Props) {
  const map = useMap();
  const searchAsMove = useStore((s) => s.searchAsMove);
  useEffect(() => {
    // When the user is driving the map ("search as I move"), don't yank it around.
    if (searchAsMove || !listings.length) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number]));
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 14, duration: 0.8 });
  }, [listings, map, searchAsMove]);
  return null;
}

/** Reports the visible viewport to the store so the list can sync to it. */
function BoundsReporter() {
  const setMapBounds = useStore((s) => s.setMapBounds);
  const report = (map: L.Map) => {
    const b = map.getBounds();
    setMapBounds({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
  };
  const map = useMapEvents({ moveend: () => report(map), zoomend: () => report(map) });
  useEffect(() => report(map), [map]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export function MapView({ listings }: Props) {
  const selectedId = useStore((s) => s.selectedId);
  const setSelected = useStore((s) => s.setSelected);
  const setHovered = useStore((s) => s.setHovered);
  // Subscribe so pins re-render (and recolor) when AI scores rebake.
  useStore((s) => s.scoreVersion);

  const center = useMemo<[number, number]>(() => {
    if (!listings.length) return [25.7617, -80.1918];
    const lat = listings.reduce((a, l) => a + l.lat, 0) / listings.length;
    const lng = listings.reduce((a, l) => a + l.lng, 0) / listings.length;
    return [lat, lng];
  }, [listings]);

  return (
    <MapContainer center={center} zoom={12} className="map" scrollWheelZoom zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitBounds listings={listings} />
      <BoundsReporter />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={48} showCoverageOnHover={false}>
        {listings.map((l) => (
          <Marker
            key={l.id}
            position={[l.lat, l.lng]}
            icon={makeIcon(l, selectedId === l.id)}
            zIndexOffset={selectedId === l.id ? 1000 : 0}
            eventHandlers={{
              mouseover: (e) => {
                setHovered(l.id);
                e.target.openPopup();
              },
              click: () => setSelected(l.id),
              popupclose: () => setHovered(null),
            }}
          >
            <Popup closeButton={false} autoPan={false} className="listing-popup" minWidth={260} maxWidth={260}>
              <ListingCard listing={l} compact />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
