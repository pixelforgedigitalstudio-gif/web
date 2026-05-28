# TiPi 🛖

Live vacation-rental availability, scored **1–10** — like SeatGeek, but for stays.
Aggregates rentals from Airbnb, Vrbo, Booking.com & Expedia (**no hotels**) and
ranks them with a transparent, math-based TiPi score.

> **Beta status:** real listing feeds from those platforms are partner-gated
> (no open public APIs), so this beta runs on a realistic **mock dataset** behind
> a swappable provider interface. When a partner API key lands, you implement one
> interface (`src/data/providers/`) and the whole app lights up with live data —
> no other changes needed.

## Run it (instant hot-reload, no compile step)

```bash
npm install      # one time
npm run dev      # starts the dev server at http://localhost:5173
```

Edit any file under `src/` and the browser updates instantly (Vite HMR).
There is **no build/compile step while developing** — just save and see it.

Other commands:

```bash
npm run build    # type-check + production bundle (for deploying)
npm run preview  # preview the production build locally
```

## How the TiPi score works

Each listing gets a 1–10 score, the **average of four attributes** (`src/scoring/score.ts`):

| Attribute            | How it's measured                                                        |
| -------------------- | ------------------------------------------------------------------------ |
| **Location**         | Desirability of the spot (+ bonus for beach/mountain/pool)               |
| **Price-for-area**   | Nightly price vs. the median price of comparable listings in that city    |
| **Reviews**          | Only trusted once there are **>5 reviews**; then 4★ → a score of **8**    |
| **Description**      | How thorough/informative the listing text is                             |

Scores are **cached per listing**, so panning/zooming the map never recomputes.

### Adding AI scoring later (optional)

The description-quality attribute has a dormant **AI slot** (`src/scoring/aiScorer.ts`).
To keep data usage minimal it's off by default. When you want AI-graded
descriptions, implement the `AiScorer` interface (e.g. a Claude API call), set
`activeAiScorer`, and results are cached + batched so token usage stays low.

## Tech

- **Vite + React + TypeScript** — instant HMR dev loop
- **Leaflet + OpenStreetMap** map tiles — free, no API key, no billing
- **Zustand + localStorage** — no logins; searches, filters & favorites persist
  across browser restarts

## Project structure

```
src/
  components/   Splash, SearchBar, FilterModal, MapView, ListingCard, ScoreBadge
  data/         types, seed dataset, providers/ (swappable data sources)
  scoring/      score.ts (the TiPi math), aiScorer.ts (future AI slot)
  store/        useStore.ts (persisted Zustand store)
```
