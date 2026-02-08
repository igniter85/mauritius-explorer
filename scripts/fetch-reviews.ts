import * as fs from "fs";
import * as path from "path";
import { locations } from "../src/data/locations";

// ─── Config ───
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_URL = "https://places.googleapis.com/v1/places";
const OUTPUT_FILE = path.join(process.cwd(), "src", "data", "places-data.json");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");

// Photo settings
const PHOTO_MAX_WIDTH = 800;
const PHOTO_MAX_HEIGHT = 600;
const MAX_PHOTOS = 5;
const PHOTO_TIMEOUT_MS = 10000;

// Derive place IDs from locations.ts — single source of truth
const PLACE_IDS: Record<string, string> = Object.fromEntries(
  locations
    .filter((loc): loc is typeof loc & { placeId: string } => !!loc.placeId)
    .map((loc) => [loc.name, loc.placeId])
);

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
  name: string;
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

interface AccessibilityOptions {
  wheelchairAccessibleParking?: boolean;
  wheelchairAccessibleEntrance?: boolean;
  wheelchairAccessibleRestroom?: boolean;
  wheelchairAccessibleSeating?: boolean;
}

interface PlaceOutput {
  googleRating?: number;
  totalReviews?: number;
  googleMapsUrl?: string;
  editorialSummary?: string;
  priceLevel?: string;
  accessibilityOptions?: AccessibilityOptions;
  reviews: ReviewOutput[];
  photos: PhotoOutput[];
}

// ─── Helpers ───

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
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

async function downloadPhoto(
  photoName: string,
  slug: string,
  index: number
): Promise<string | null> {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${PHOTO_MAX_WIDTH}&maxHeightPx=${PHOTO_MAX_HEIGHT}&key=${API_KEY}`;
  const filename = `${slug}-${index}.jpg`;
  const outPath = path.join(PHOTOS_DIR, filename);

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn(`\n    ⚠ Photo ${index} HTTP ${res.status} — skipping`);
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
    return `/photos/${filename}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`\n    ⚠ Photo ${index} failed: ${msg} — skipping`);
    return null;
  }
}

// ─── Fetch ───

async function fetchPlaceData(
  name: string,
  placeId: string
): Promise<PlaceOutput> {
  const url = `${PLACES_URL}/${placeId}`;
  const slug = slugify(name);

  const fieldMask = [
    "rating",
    "userRatingCount",
    "googleMapsUri",
    "editorialSummary",
    "priceLevel",
    "reviews",
    "photos",
    "accessibilityOptions",
  ].join(",");

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": API_KEY!,
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

  // ── Download photos ──
  const rawPhotos: GooglePhoto[] = (data.photos ?? []).slice(0, MAX_PHOTOS);
  const photos: PhotoOutput[] = [];

  for (let i = 0; i < rawPhotos.length; i++) {
    const p = rawPhotos[i];
    const localUrl = await downloadPhoto(p.name, slug, i);
    if (localUrl) {
      photos.push({
        url: localUrl,
        attribution:
          p.authorAttributions?.[0]?.displayName ?? "Google Maps contributor",
        width: p.widthPx,
        height: p.heightPx,
      });
    }
  }

  return {
    googleRating: data.rating,
    totalReviews: data.userRatingCount,
    googleMapsUrl: data.googleMapsUri,
    editorialSummary: data.editorialSummary?.text,
    priceLevel: priceLevelToString(data.priceLevel),
    accessibilityOptions: data.accessibilityOptions,
    reviews,
    photos,
  };
}

// ─── Main ───

async function main() {
  const forceAll = process.argv.includes("--force");

  if (!API_KEY) {
    console.warn(
      "⚠ GOOGLE_PLACES_API_KEY not set — skipping places data fetch, keeping existing places-data.json"
    );
    process.exit(0);
  }

  // Ensure photos directory exists
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }

  // Load existing data to skip locations we already have
  let existing: Record<string, PlaceOutput> = {};
  if (!forceAll && fs.existsSync(OUTPUT_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
    } catch {
      // corrupted file — refetch everything
    }
  }

  const toFetch = Object.entries(PLACE_IDS).filter(
    ([name]) => forceAll || !existing[name]
  );

  if (toFetch.length === 0) {
    console.log("✅ All locations already have data — nothing to fetch.");
    console.log("   Use --force to re-fetch everything.");
    process.exit(0);
  }

  const total = Object.keys(PLACE_IDS).length;
  const skipped = total - toFetch.length;
  console.log(
    `🗺️  Fetching enriched data for ${toFetch.length} new location(s)` +
      (skipped > 0 ? ` (${skipped} cached, skipped)` : "") +
      `...\n`
  );

  const allData: Record<string, PlaceOutput> = { ...existing };
  let totalReviews = 0;
  let totalPhotos = 0;

  for (const [name, placeId] of toFetch) {
    process.stdout.write(`  📍 ${name}...`);
    const data = await fetchPlaceData(name, placeId);
    allData[name] = data;
    totalReviews += data.reviews.length;
    totalPhotos += data.photos.length;
    console.log(
      ` ${data.reviews.length} reviews, ${data.photos.length} photos` +
        (data.googleRating ? ` (★ ${data.googleRating})` : "")
    );

    // Rate limit: small delay between requests
    await new Promise((r) => setTimeout(r, 200));
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2));
  console.log(`\n✅ Saved to ${OUTPUT_FILE}`);
  console.log(
    `   Fetched: ${totalReviews} reviews + ${totalPhotos} photos from ${toFetch.length} location(s)`
  );

  // Cost estimate (only for fetched locations)
  const costPerCall = 0.025;
  console.log(
    `   Estimated API cost: ~$${(toFetch.length * costPerCall).toFixed(2)}`
  );
}

main();
