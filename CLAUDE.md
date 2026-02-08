# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mauritius Explorer — a mobile-first interactive map web app showcasing 30 curated locations across Mauritius (nature, beaches, water activities, culture, food, adventure). Deployed on Vercel. Personal/internal tool.

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript, `src/` directory)
- **Styling:** Tailwind CSS
- **Mapping:** Leaflet + react-leaflet (loaded client-side only via `next/dynamic` with `ssr: false`)
- **Font:** DM Sans (Google Fonts)
- **Map tiles:** CARTO Voyager (free, no API key)
- **Google Reviews:** Fetched at build time via Google Places API (New), stored in `src/data/reviews.json`
- **Deployment:** Vercel (standard Next.js build, no static export)

## Commands

```bash
npm run dev              # Start dev server at localhost:3000
npm run build            # Build (runs prebuild review fetch first)
npm run fetch-reviews    # Fetch Google reviews: npx tsx scripts/fetch-reviews.ts
```

The `fetch-reviews` script requires `GOOGLE_PLACES_API_KEY` env var (set in `.env.local` or CI).

## Architecture

### Mobile-First Layout
- **Mobile (default):** Full-screen map with a bottom sheet (draggable, 3 states: peek/half/full) for filters and location list. Map always visible.
- **Desktop (breakpoint up):** 340px sidebar alongside the map.

### Data Flow
- Location data lives in `src/data/locations.ts` — 30 typed `Location` objects with coordinates, categories, ratings, placeIds
- Some locations are activity-based pins (no `placeId`, no `rating`) — these are excluded from Google Reviews fetch
- Google reviews fetched at build time by `scripts/fetch-reviews.ts`, written to `src/data/reviews.json` — no runtime API calls
- Reviews refresh weekly via GitHub Actions cron

### Key Patterns
- **Leaflet SSR avoidance:** Map component must be loaded with `next/dynamic({ ssr: false })` since Leaflet requires `window`
- **Custom SVG markers:** Color-coded by category using `L.divIcon` with inline SVG — larger tap targets on mobile
- **Category system:** 6 categories (nature, beach, water, culture, food, adventure) defined in `categoryConfig` with label, color, and emoji

### File Structure (key files)
```
src/
├── app/
│   ├── layout.tsx          # Root layout with DM Sans font
│   ├── page.tsx            # Dynamic import of map (SSR disabled)
│   └── globals.css         # Tailwind + Leaflet popup overrides
├── components/
│   └── MauritiusMap.tsx    # Main map component (bottom sheet + sidebar + map)
├── data/
│   ├── locations.ts        # Location data with types and category config
│   └── reviews.json        # Build-time generated Google reviews
scripts/
└── fetch-reviews.ts        # Google Places API fetcher (build-time only)
docs/
├── PRD.md                  # Reference implementation for components
├── GOOGLE_REVIEWS.md       # Google Reviews integration guide
├── locations.ts            # Canonical location data (30 locations, use this over PRD)
└── places.ts               # Google Place ID mapping for fetch-reviews script
```

## Important Notes

- **`docs/locations.ts` is the canonical location data** — it supersedes the locations in `docs/PRD.md` (more locations, updated notes, category changes)
- **`docs/places.ts`** has the PLACE_IDS mapping for the review fetcher — not all locations have placeIds (activity pins and hidden gems are excluded)
- `docs/PRD.md` remains the reference for component structure and styling, but the layout must be adapted for mobile-first (bottom sheet on mobile, sidebar on desktop)
- `docs/GOOGLE_REVIEWS.md` has the full Google Reviews integration guide
- Location ratings in `locations.ts` are static/editorial; Google review ratings come separately from the API
