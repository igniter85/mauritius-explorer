# Adding Google Reviews to Your Mauritius Map

## Overview

We'll use the **Google Places API (New)** to fetch up to 5 reviews per location
at **build time**, then bake them into your static site. This means:

- No API calls from the browser (no key exposure)
- No cost at runtime
- Reviews update whenever you rebuild/redeploy
- Stays within Google's ToS (reviews displayed with attribution)

## Cost

Google gives **$200/month free credit**. The Place Details (New) request costs
~$0.02 per call. For 23 locations, that's ~$0.46 per build. You could rebuild
daily for years and never pay a cent.

---

## Step 1: Get a Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "mauritius-map")
3. Enable the **Places API (New)**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Restrict the key to **Places API (New)** only
6. Copy the key

## Step 2: Add Place IDs to Your Locations Data

Update `src/data/locations.ts` — add a `placeId` field to each location.
Here are all the Google Place IDs from our earlier search:

```typescript
// Add this field to your Location interface:
export interface Location {
  name: string;
  lat: number;
  lng: number;
  category: LocationCategory;
  rating?: number;
  notes: string;
  hours?: string;
  phone?: string;
  website?: string;
  placeId?: string;        // ← add this
  reviews?: ReviewData[];  // ← add this
}

export interface ReviewData {
  author: string;
  rating: number;
  text: string;
  timeAgo: string;
  profilePhoto?: string;
}
```

Add these Place IDs to each location in your `locations` array:

```typescript
// Nature & Landscapes
{ name: "Black River Gorges National Park", placeId: "ChIJt8DLt5hofCERPkIVoGc3sbQ", ... },
{ name: "Le Morne Brabant (UNESCO)", placeId: "ChIJUbKvu_psfCER8_n3Y6TuK5k", ... },
{ name: "Seven Coloured Earths", placeId: "ChIJOSVA3qdufCER1eqGkmZqZz8", ... },
{ name: "Chamarel Waterfall", placeId: "ChIJbzVmhbpufCERivQiEa2ZfVI", ... },
{ name: "Trou aux Cerfs Crater", placeId: "ChIJfR7_gPZcfCERQNErP59DJ5w", ... },

// Beaches & Islands
{ name: "Île aux Cerfs", placeId: "ChIJWROevgzwfCERgS45v3_lbRM", ... },
{ name: "Trou aux Biches Beach", placeId: "ChIJs5FkQaSsfSERbH9Y1RR_noc", ... },
{ name: "Flic en Flac Beach", placeId: "ChIJJzYqH3xBfCERVSO2RZTiJp4", ... },
{ name: "Blue Bay Marine Park", placeId: "ChIJ16w1WRKLfCER5ydjhXmMOWY", ... },
{ name: "Le Morne Beach", placeId: "ChIJlZsRYeRsfCERq8EO0pSv-g8", ... },
{ name: "Crystal Rock", placeId: "ChIJzdte40JrfCERdFULlc7NxhA", ... },

// Water
{ name: "Île aux Aigrettes", placeId: "ChIJm7SNNVWLfCERwNVhniqvuDE", ... },

// Culture & History
{ name: "Port Louis Central Market", placeId: "ChIJT4oHW6tRfCERNzHolp3ATAE", ... },
{ name: "Caudan Waterfront", placeId: "ChIJWQHWQUlQfCERUuLoViCAENE", ... },
{ name: "Aapravasi Ghat (UNESCO)", placeId: "ChIJPR5dhatRfCERzCZ6gB1QwCE", ... },
{ name: "Cap Malheureux Church", placeId: "ChIJQTut9heqfSERXKUeE-z0S9c", ... },
{ name: "Pamplemousses Botanical Garden", placeId: "ChIJB0u1o0NUfCERozS9H8g9EbM", ... },
{ name: "Flacq Market", placeId: "ChIJZXVqU2b5fCERD7lqSqgrKhk", ... },

// Food & Drink
{ name: "Bois Chéri Tea Factory", placeId: "ChIJtY-hmuZmfCERXHQHiB1gUSM", ... },
{ name: "Rhumerie de Chamarel", placeId: "ChIJ_zudTjZpfCERrM6aNE6Tb54", ... },

// Adventure
{ name: "Casela Nature Park", placeId: "ChIJnyzvaKNDfCERqB8AG6IxUxo", ... },
{ name: "La Vanille Nature Park", placeId: "ChIJ9XjfW4VjfCERDOuuTXuQI1w", ... },
{ name: "Grand Baie", placeId: "ChIJ2269OXerfSERcd_ausyqcLQ", ... },
```

## Step 3: Create the Review Fetcher Script

Create `scripts/fetch-reviews.ts`:

```typescript
import * as fs from "fs";
import * as path from "path";

// ─── Config ───
const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACES_URL = "https://places.googleapis.com/v1/places";
const OUTPUT_FILE = path.join(
  process.cwd(),
  "src",
  "data",
  "reviews.json"
);

// All place IDs from our locations
const PLACE_IDS: Record<string, string> = {
  "Black River Gorges National Park": "ChIJt8DLt5hofCERPkIVoGc3sbQ",
  "Le Morne Brabant (UNESCO)": "ChIJUbKvu_psfCER8_n3Y6TuK5k",
  "Seven Coloured Earths": "ChIJOSVA3qdufCER1eqGkmZqZz8",
  "Chamarel Waterfall": "ChIJbzVmhbpufCERivQiEa2ZfVI",
  "Trou aux Cerfs Crater": "ChIJfR7_gPZcfCERQNErP59DJ5w",
  "Île aux Cerfs": "ChIJWROevgzwfCERgS45v3_lbRM",
  "Trou aux Biches Beach": "ChIJs5FkQaSsfSERbH9Y1RR_noc",
  "Flic en Flac Beach": "ChIJJzYqH3xBfCERVSO2RZTiJp4",
  "Blue Bay Marine Park": "ChIJ16w1WRKLfCER5ydjhXmMOWY",
  "Le Morne Beach": "ChIJlZsRYeRsfCERq8EO0pSv-g8",
  "Crystal Rock": "ChIJzdte40JrfCERdFULlc7NxhA",
  "Île aux Aigrettes": "ChIJm7SNNVWLfCERwNVhniqvuDE",
  "Port Louis Central Market": "ChIJT4oHW6tRfCERNzHolp3ATAE",
  "Caudan Waterfront": "ChIJWQHWQUlQfCERUuLoViCAENE",
  "Aapravasi Ghat (UNESCO)": "ChIJPR5dhatRfCERzCZ6gB1QwCE",
  "Cap Malheureux Church": "ChIJQTut9heqfSERXKUeE-z0S9c",
  "Pamplemousses Botanical Garden": "ChIJB0u1o0NUfCERozS9H8g9EbM",
  "Flacq Market": "ChIJZXVqU2b5fCERD7lqSqgrKhk",
  "Bois Chéri Tea Factory": "ChIJtY-hmuZmfCERXHQHiB1gUSM",
  "Rhumerie de Chamarel": "ChIJ_zudTjZpfCERrM6aNE6Tb54",
  "Casela Nature Park": "ChIJnyzvaKNDfCERqB8AG6IxUxo",
  "La Vanille Nature Park": "ChIJ9XjfW4VjfCERDOuuTXuQI1w",
  "Grand Baie": "ChIJ2269OXerfSERcd_ausyqcLQ",
};

interface GoogleReview {
  authorAttribution: {
    displayName: string;
    photoUri?: string;
  };
  rating: number;
  text?: { text: string };
  relativePublishTimeDescription: string;
}

interface ReviewOutput {
  author: string;
  rating: number;
  text: string;
  timeAgo: string;
  profilePhoto?: string;
}

async function fetchPlaceReviews(
  placeId: string
): Promise<ReviewOutput[]> {
  const url = `${PLACES_URL}/${placeId}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "reviews",
    },
  });

  if (!res.ok) {
    console.error(`  ✗ HTTP ${res.status} for ${placeId}`);
    return [];
  }

  const data = await res.json();
  const reviews: GoogleReview[] = data.reviews ?? [];

  return reviews.map((r) => ({
    author: r.authorAttribution.displayName,
    rating: r.rating,
    text: r.text?.text ?? "",
    timeAgo: r.relativePublishTimeDescription,
    profilePhoto: r.authorAttribution.photoUri,
  }));
}

async function main() {
  if (!API_KEY) {
    console.error("Error: Set GOOGLE_PLACES_API_KEY env variable");
    process.exit(1);
  }

  console.log("🗺️  Fetching reviews for", Object.keys(PLACE_IDS).length, "locations...\n");

  const allReviews: Record<string, ReviewOutput[]> = {};

  for (const [name, placeId] of Object.entries(PLACE_IDS)) {
    process.stdout.write(`  ${name}...`);
    const reviews = await fetchPlaceReviews(placeId);
    allReviews[name] = reviews;
    console.log(` ${reviews.length} reviews`);

    // Rate limit: small delay between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allReviews, null, 2));
  console.log(`\n✅ Saved to ${OUTPUT_FILE}`);

  const total = Object.values(allReviews).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  console.log(`   ${total} total reviews across all locations`);
}

main();
```

## Step 4: Add the Script to package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "fetch-reviews": "npx tsx scripts/fetch-reviews.ts",
    "prebuild": "npx tsx scripts/fetch-reviews.ts"
  }
}
```

Install `tsx` for running TypeScript scripts:

```bash
npm install -D tsx
```

## Step 5: Create `.env.local`

```
GOOGLE_PLACES_API_KEY=your_api_key_here
```

Add `.env.local` to your `.gitignore` (it should already be there).

For deployment (Vercel/Netlify), add this as an environment variable in their dashboard.

## Step 6: Run It

```bash
# Fetch reviews manually
GOOGLE_PLACES_API_KEY=your_key npm run fetch-reviews

# Or just build (prebuild hook runs automatically)
npm run build
```

This creates `src/data/reviews.json` with all reviews.

## Step 7: Display Reviews in the Map Component

Update the `LocationCard` in `MauritiusMap.tsx` to show reviews:

```tsx
// At the top of MauritiusMap.tsx, import reviews
import reviewsData from "@/data/reviews.json";

const reviews: Record<string, ReviewData[]> = reviewsData;

// ─── New component: ReviewCard ───
function ReviewCard({ review }: { review: ReviewData }) {
  return (
    <div className="border-t border-stone-100 pt-2 mt-2">
      <div className="flex items-center gap-2 mb-1">
        {review.profilePhoto && (
          <img
            src={review.profilePhoto}
            alt=""
            className="w-5 h-5 rounded-full"
            referrerPolicy="no-referrer"
          />
        )}
        <span className="text-[11px] font-medium text-stone-700">
          {review.author}
        </span>
        <span className="text-[10px] text-stone-400 ml-auto">
          {review.timeAgo}
        </span>
      </div>
      <div className="text-[11px] text-amber-500 mb-1">
        {"★".repeat(review.rating)}
        {"☆".repeat(5 - review.rating)}
      </div>
      <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-3">
        {review.text}
      </p>
    </div>
  );
}

// ─── Updated LocationCard with reviews ───
function LocationCard({
  location,
  onClose,
}: {
  location: Location;
  onClose: () => void;
}) {
  const config = categoryConfig[location.category];
  const locationReviews = reviews[location.name] ?? [];
  const [showAllReviews, setShowAllReviews] = useState(false);
  const displayedReviews = showAllReviews
    ? locationReviews
    : locationReviews.slice(0, 2);

  return (
    <div className="min-w-[260px] max-w-[300px]">
      {/* ... existing header, badge, rating, notes, hours, phone, website ... */}

      {/* Reviews section */}
      {locationReviews.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
              Reviews ({locationReviews.length})
            </span>
            <span className="text-[9px] text-stone-300">
              via Google
            </span>
          </div>
          {displayedReviews.map((review, i) => (
            <ReviewCard key={i} review={review} />
          ))}
          {locationReviews.length > 2 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="text-[11px] text-blue-600 hover:text-blue-800 mt-2 font-medium"
            >
              {showAllReviews
                ? "Show less"
                : `Show all ${locationReviews.length} reviews`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

## Step 8: Google Attribution (Required by ToS)

Add this to the bottom of your map or sidebar. Google requires you display
their logo when showing Places data:

```tsx
<div className="absolute bottom-2 left-2 z-[1000] bg-white/80 backdrop-blur rounded px-2 py-1">
  <span className="text-[9px] text-stone-400">
    Reviews powered by Google
  </span>
</div>
```

---

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│               Build Time                     │
│                                              │
│  scripts/fetch-reviews.ts                    │
│       │                                      │
│       ▼ (Google Places API)                  │
│                                              │
│  src/data/reviews.json  ← cached reviews     │
│       │                                      │
│       ▼                                      │
│  next build → static HTML + JSON             │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│             Runtime (Static Site)             │
│                                              │
│  No API calls. Reviews baked into the JS     │
│  bundle. Zero cost. Fast loading.            │
└─────────────────────────────────────────────┘
```

## Keeping Reviews Fresh

**Option A — Manual:** Run `npm run fetch-reviews` before deploying.

**Option B — CI/CD cron (recommended):**

For Vercel, add a GitHub Action `.github/workflows/refresh-reviews.yml`:

```yaml
name: Refresh Reviews

on:
  schedule:
    - cron: "0 6 * * 1"  # Every Monday at 6 AM UTC
  workflow_dispatch:       # Manual trigger

jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx tsx scripts/fetch-reviews.ts
        env:
          GOOGLE_PLACES_API_KEY: ${{ secrets.GOOGLE_PLACES_API_KEY }}
      - name: Commit updated reviews
        run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add src/data/reviews.json
          git diff --cached --quiet || git commit -m "chore: refresh Google reviews"
          git push
```

This commits fresh reviews weekly, which triggers a Vercel redeploy automatically.
