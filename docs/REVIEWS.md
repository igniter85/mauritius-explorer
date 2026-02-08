# 📸 Enhanced Google Places Data — Reviews + Photos + Details

## Updated Data Types

Add these to `src/data/locations.ts`:

```typescript
export interface ReviewData {
  author: string;
  rating: number;
  text: string;
  timeAgo: string;
  profilePhoto?: string;
  googleMapsAuthorUrl?: string;
}

export interface PlacePhoto {
  url: string;       // proxied URL built at build time
  attribution: string;
  width: number;
  height: number;
}

export interface PlaceEnrichment {
  googleRating?: number;
  totalReviews?: number;
  googleMapsUrl?: string;
  editorialSummary?: string;
  priceLevel?: string;
  currentlyOpen?: boolean;
  reviews: ReviewData[];
  photos: PlacePhoto[];
}
```

---

## Updated `scripts/fetch-reviews.ts`

Replace the entire file with this enhanced version:

```typescript
import * as fs from "fs";
import * as path from "path";

// ─── Config ───
const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACES_URL = "https://places.googleapis.com/v1/places";
const OUTPUT_FILE = path.join(process.cwd(), "src", "data", "places-data.json");

// Photo settings
const PHOTO_MAX_WIDTH = 800;  // good balance of quality vs size
const PHOTO_MAX_HEIGHT = 600;
const MAX_PHOTOS = 5;         // per place (API returns up to 10)

// All place IDs
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

// ─── Types ───

interface GoogleReview {
  authorAttribution: {
    displayName: string;
    photoUri?: string;
    uri?: string;
  };
  rating: number;
  text?: { text: string };
  originalText?: { text: string };
  relativePublishTimeDescription: string;
}

interface GooglePhoto {
  name: string; // e.g. "places/ChIJ.../photos/abc123"
  widthPx: number;
  heightPx: number;
  authorAttributions: { displayName: string; uri?: string }[];
}

interface ReviewOutput {
  author: string;
  rating: number;
  text: string;
  timeAgo: string;
  profilePhoto?: string;
  googleMapsAuthorUrl?: string;
}

interface PhotoOutput {
  url: string;
  attribution: string;
  width: number;
  height: number;
}

interface PlaceOutput {
  googleRating?: number;
  totalReviews?: number;
  googleMapsUrl?: string;
  editorialSummary?: string;
  priceLevel?: string;
  reviews: ReviewOutput[];
  photos: PhotoOutput[];
}

// ─── Helpers ───

function buildPhotoUrl(photoName: string): string {
  // Places API (New) photo URL format
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${PHOTO_MAX_WIDTH}&maxHeightPx=${PHOTO_MAX_HEIGHT}&key=${API_KEY}`;
}

function priceLevelToString(level: string | undefined): string | undefined {
  const map: Record<string, string> = {
    PRICE_LEVEL_FREE: "Free",
    PRICE_LEVEL_INEXPENSIVE: "$",
    PRICE_LEVEL_MODERATE: "$$",
    PRICE_LEVEL_EXPENSIVE: "$$$",
    PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
  };
  return level ? map[level] : undefined;
}

// ─── Fetch ───

async function fetchPlaceData(placeId: string): Promise<PlaceOutput> {
  const url = `${PLACES_URL}/${placeId}`;

  const fieldMask = [
    "rating",
    "userRatingCount",
    "googleMapsUri",
    "editorialSummary",
    "priceLevel",
    "reviews",
    "photos",
  ].join(",");

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": fieldMask,
    },
  });

  if (!res.ok) {
    console.error(`  ✗ HTTP ${res.status}`);
    return { reviews: [], photos: [] };
  }

  const data = await res.json();

  // ── Parse reviews ──
  const reviews: ReviewOutput[] = (data.reviews ?? []).map(
    (r: GoogleReview) => ({
      author: r.authorAttribution.displayName,
      rating: r.rating,
      text: r.text?.text ?? r.originalText?.text ?? "",
      timeAgo: r.relativePublishTimeDescription,
      profilePhoto: r.authorAttribution.photoUri,
      googleMapsAuthorUrl: r.authorAttribution.uri,
    })
  );

  // ── Parse photos ──
  const rawPhotos: GooglePhoto[] = (data.photos ?? []).slice(0, MAX_PHOTOS);
  const photos: PhotoOutput[] = rawPhotos.map((p) => ({
    url: buildPhotoUrl(p.name),
    attribution:
      p.authorAttributions?.[0]?.displayName ?? "Google Maps contributor",
    width: p.widthPx,
    height: p.heightPx,
  }));

  return {
    googleRating: data.rating,
    totalReviews: data.userRatingCount,
    googleMapsUrl: data.googleMapsUri,
    editorialSummary: data.editorialSummary?.text,
    priceLevel: priceLevelToString(data.priceLevel),
    reviews,
    photos,
  };
}

// ─── Main ───

async function main() {
  if (!API_KEY) {
    console.error("Error: Set GOOGLE_PLACES_API_KEY env variable");
    process.exit(1);
  }

  const count = Object.keys(PLACE_IDS).length;
  console.log(`🗺️  Fetching enriched data for ${count} locations...\n`);

  const allData: Record<string, PlaceOutput> = {};
  let totalReviews = 0;
  let totalPhotos = 0;

  for (const [name, placeId] of Object.entries(PLACE_IDS)) {
    process.stdout.write(`  📍 ${name}...`);
    const data = await fetchPlaceData(placeId);
    allData[name] = data;
    totalReviews += data.reviews.length;
    totalPhotos += data.photos.length;
    console.log(
      ` ${data.reviews.length} reviews, ${data.photos.length} photos` +
        (data.googleRating ? ` (★ ${data.googleRating})` : "")
    );

    // Rate limit
    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
  console.log(`\n✅ Saved to ${OUTPUT_FILE}`);
  console.log(`   ${totalReviews} reviews + ${totalPhotos} photos across ${count} locations`);

  // Cost estimate
  const costPerCall = 0.02;
  console.log(`   Estimated API cost: ~$${(count * costPerCall).toFixed(2)}`);
}

main();
```

Update `package.json` script:

```json
"fetch-reviews": "npx tsx scripts/fetch-reviews.ts",
"prebuild": "npx tsx scripts/fetch-reviews.ts"
```

---

## Updated LocationCard with Photos + Reviews

Replace the `LocationCard` in `MauritiusMap.tsx`:

```tsx
import placesData from "@/data/places-data.json";

// Type assertion for the imported JSON
const enrichedData: Record<string, PlaceEnrichment> = placesData as any;

function LocationCard({ location }: { location: Location }) {
  const config = categoryConfig[location.category];
  const enrichment = enrichedData[location.name];
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  const photos = enrichment?.photos ?? [];
  const reviews = enrichment?.reviews ?? [];
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  return (
    <div className="min-w-[280px] max-w-[320px]">
      {/* ── Photo carousel ── */}
      {photos.length > 0 && (
        <div className="relative -mx-4 -mt-3.5 mb-3 rounded-t-xl overflow-hidden">
          <img
            src={photos[activePhoto].url}
            alt={location.name}
            className="w-full h-[160px] object-cover"
            loading="lazy"
          />
          {/* Photo navigation dots */}
          {photos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === activePhoto
                      ? "bg-white scale-110"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          )}
          {/* Photo arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActivePhoto((activePhoto - 1 + photos.length) % photos.length)
                }
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60
                           text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setActivePhoto((activePhoto + 1) % photos.length)
                }
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60
                           text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
              >
                ›
              </button>
            </>
          )}
          {/* Attribution */}
          <span className="absolute bottom-2 right-2 text-[8px] text-white/70 bg-black/30 px-1 rounded">
            📷 {photos[activePhoto].attribution}
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <h3 className="font-semibold text-stone-900 text-sm leading-tight mb-1.5">
        {config.emoji} {location.name}
      </h3>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span
          className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: config.color + "18", color: config.color }}
        >
          {config.label}
        </span>
        {enrichment?.priceLevel && (
          <span className="text-[11px] text-stone-500 font-medium">
            {enrichment.priceLevel}
          </span>
        )}
      </div>

      {/* ── Rating from Google ── */}
      {enrichment?.googleRating && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-amber-500 text-sm">
            {"★".repeat(Math.floor(enrichment.googleRating))}
            {enrichment.googleRating % 1 >= 0.3 && "½"}
          </span>
          <span className="text-xs text-stone-500">
            {enrichment.googleRating}
          </span>
          {enrichment.totalReviews && (
            <span className="text-[11px] text-stone-400">
              ({enrichment.totalReviews.toLocaleString()} reviews)
            </span>
          )}
        </div>
      )}

      {/* ── Editorial summary from Google ── */}
      {enrichment?.editorialSummary && (
        <p className="text-xs text-stone-600 italic mb-2 leading-relaxed">
          "{enrichment.editorialSummary}"
        </p>
      )}

      {/* ── Your notes ── */}
      <p className="text-xs text-stone-600 leading-relaxed mb-2">
        {location.notes}
      </p>

      {/* ── Practical info ── */}
      <div className="space-y-0.5">
        {location.hours && (
          <p className="text-[11px] text-stone-500">🕐 {location.hours}</p>
        )}
        {location.phone && (
          <p className="text-[11px] text-stone-500">
            📞{" "}
            <a href={`tel:${location.phone}`} className="underline">
              {location.phone}
            </a>
          </p>
        )}
        {location.website && (
          <p className="text-[11px] text-stone-500">
            🌐{" "}
            <a
              href={location.website}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              Website
            </a>
          </p>
        )}
        {enrichment?.googleMapsUrl && (
          <p className="text-[11px] text-stone-500">
            📍{" "}
            <a
              href={enrichment.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600"
            >
              Open in Google Maps
            </a>
          </p>
        )}
      </div>

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <div className="mt-3 pt-2 border-t border-stone-100">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
            Google Reviews
          </span>

          {displayedReviews.map((review, i) => (
            <div key={i} className="border-t border-stone-50 pt-2 mt-2">
              <div className="flex items-center gap-2 mb-1">
                {review.profilePhoto && (
                  <img
                    src={review.profilePhoto}
                    alt=""
                    className="w-5 h-5 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                )}
                <a
                  href={review.googleMapsAuthorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-stone-700 hover:underline"
                >
                  {review.author}
                </a>
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
          ))}

          {reviews.length > 2 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="text-[11px] text-blue-600 hover:text-blue-800 mt-2 font-medium"
            >
              {showAllReviews
                ? "Show less"
                : `Show all ${reviews.length} reviews`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Add to `globals.css`

```css
/* Photo carousel in popups */
.leaflet-popup-content-wrapper {
  padding: 0 !important;
  overflow: hidden !important;
}

.leaflet-popup-content {
  margin: 14px 16px !important;
  margin-top: 0 !important;
  font-family: inherit !important;
}

.leaflet-popup-content img {
  margin: 0 !important; /* override leaflet default img margins */
}
```

---

## What Each Place Gets (example output)

After running `npm run fetch-reviews`, your `places-data.json` will look like:

```json
{
  "Le Morne Brabant (UNESCO)": {
    "googleRating": 4.8,
    "totalReviews": 3412,
    "googleMapsUrl": "https://maps.google.com/?cid=...",
    "editorialSummary": "Dramatic basalt mountain on a peninsula, known for its history as a refuge for escaped slaves.",
    "priceLevel": null,
    "reviews": [
      {
        "author": "John D.",
        "rating": 5,
        "text": "Absolutely breathtaking hike! Started at 5:30 AM and reached the summit by 8. The views are...",
        "timeAgo": "2 months ago",
        "profilePhoto": "https://lh3.googleusercontent.com/...",
        "googleMapsAuthorUrl": "https://www.google.com/maps/contrib/..."
      }
    ],
    "photos": [
      {
        "url": "https://places.googleapis.com/v1/places/.../photos/.../media?maxWidthPx=800&maxHeightPx=600&key=...",
        "attribution": "Sarah M.",
        "width": 4032,
        "height": 3024
      }
    ]
  }
}
```

---

## API Cost Summary

| Field | Cost per call | Calls | Total |
|-------|--------------|-------|-------|
| Place Details (reviews, rating, summary) | ~$0.025 | 23 | $0.58 |
| Photos (included in same call) | $0 extra | — | — |
| **Total per build** | | | **~$0.58** |

With $200/month free credit, you could rebuild **345 times/month** before paying anything.

---

## Important: Photo URL Caching Caveat

The photo URLs contain your API key. Two options:

**Option A (simple, fine for internal use):**
Use the URLs directly as shown above. Since this is a private app for your
friend group, the key exposure is low risk. Just restrict the key to Places API
only and set an HTTP referrer restriction to your domain.

**Option B (production-grade):**
Download photos at build time and save them as static assets:

```typescript
// Add to fetch-reviews.ts — download photos to public/photos/
import https from "https";

async function downloadPhoto(url: string, filename: string): Promise<string> {
  const outDir = path.join(process.cwd(), "public", "photos");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, filename);

  return new Promise((resolve, reject) => {
    // Follow redirect to actual image
    https.get(url, (res) => {
      if (res.statusCode === 302 && res.headers.location) {
        https.get(res.headers.location, (imgRes) => {
          const stream = fs.createWriteStream(outPath);
          imgRes.pipe(stream);
          stream.on("finish", () => resolve(`/photos/${filename}`));
          stream.on("error", reject);
        });
      } else {
        const stream = fs.createWriteStream(outPath);
        res.pipe(stream);
        stream.on("finish", () => resolve(`/photos/${filename}`));
        stream.on("error", reject);
      }
    });
  });
}
```

This way the final static site has no API key references at all. I'd recommend
Option B if you ever make this public.
