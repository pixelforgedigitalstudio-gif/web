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

### AI-graded descriptions (optional)

The **Description** attribute can be graded by Claude instead of the built-in
heuristic. It's **off by default** so the beta spends zero tokens.

To turn it on:

```bash
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
# restart: npm run dev
```

How it stays cheap:

- Uses **Claude Haiku 4.5** (the cheapest model) via a server-side dev endpoint
  (`vite-plugin-ai-score.ts`) — the key lives on the server and is **never sent
  to the browser**.
- Listings are **batched** into one request, the rubric system prompt is
  **prompt-cached**, and every score is cached in `localStorage`, so each
  listing is graded **at most once, ever** (survives restarts).
- No key? The endpoint returns 503 and TiPi silently falls back to the
  heuristic — nothing breaks.

> Note: the endpoint runs in the Vite dev server. A production static deploy
> would move the same logic into a serverless function (identical request shape).

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
