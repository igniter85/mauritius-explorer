export interface UserLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

export type DiscoverRadius = 2 | 5 | 10;

export type DiscoverCategory = "food" | "attractions" | "practical";

export const discoverCategoryConfig: Record<
  DiscoverCategory,
  { label: string; color: string; icon: string; types: string[] }
> = {
  food: {
    label: "Food & Drink",
    color: "#e11d48",
    icon: "UtensilsCrossed",
    types: ["restaurant", "cafe", "bakery", "bar", "ice_cream_shop"],
  },
  attractions: {
    label: "Attractions",
    color: "#0ea5e9",
    icon: "Landmark",
    types: ["tourist_attraction", "park", "museum"],
  },
  practical: {
    label: "Practical",
    color: "#6366f1",
    icon: "Compass",
    types: ["gas_station", "pharmacy", "supermarket", "shopping_mall"],
  },
};

export const ALL_DISCOVER_TYPES: string[] = Object.values(
  discoverCategoryConfig
).flatMap((c) => c.types);

export interface DiscoveredPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
  types: string[];
  photoUri?: string;
  distanceKm?: number;
}

export interface DiscoverResponse {
  places: DiscoveredPlace[];
}

export function getDiscoverCategory(
  types: string[]
): DiscoverCategory | null {
  for (const [cat, config] of Object.entries(discoverCategoryConfig)) {
    if (config.types.some((t) => types.includes(t))) {
      return cat as DiscoverCategory;
    }
  }
  return null;
}

const TYPE_LABELS: Record<string, string> = {
  restaurant: "Restaurant",
  cafe: "Cafe",
  bakery: "Bakery",
  bar: "Bar",
  ice_cream_shop: "Ice Cream",
  tourist_attraction: "Attraction",
  park: "Park",
  museum: "Museum",
  gas_station: "Gas Station",
  pharmacy: "Pharmacy",
  supermarket: "Supermarket",
  shopping_mall: "Shopping",
};

export function getTypeBadgeLabel(types: string[]): string {
  for (const t of types) {
    if (TYPE_LABELS[t]) return TYPE_LABELS[t];
  }
  return "Place";
}

export interface PlaceReview {
  author: string;
  authorPhotoUri?: string;
  authorUri?: string;
  rating: number;
  text?: string;
  timeAgo: string;
}

export interface PlaceDetails {
  editorialSummary?: string;
  reviews: PlaceReview[];
  phone?: string;
  website?: string;
  openNow?: boolean;
  weekdayHours?: string[];
  priceLevel?: string;
  googleMapsUrl?: string;
}
