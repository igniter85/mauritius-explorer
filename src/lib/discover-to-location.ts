import type { Location, LocationCategory } from "@/data/locations";
import type { DiscoveredPlace, PlaceDetails } from "@/lib/discover-types";

const TYPE_TO_CATEGORY: Record<string, LocationCategory> = {
  restaurant: "food",
  cafe: "food",
  bakery: "food",
  bar: "food",
  ice_cream_shop: "food",
  tourist_attraction: "culture",
  museum: "culture",
  park: "nature",
};

function mapCategory(types: string[]): LocationCategory {
  for (const t of types) {
    if (TYPE_TO_CATEGORY[t]) return TYPE_TO_CATEGORY[t];
  }
  return "adventure";
}

export function discoverToLocation(
  place: DiscoveredPlace,
  details?: PlaceDetails | null
): Location {
  // Strip "places/" prefix from Google Place IDs
  const placeId = place.id.startsWith("places/")
    ? place.id.slice("places/".length)
    : place.id;

  return {
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    category: mapCategory(place.types),
    mobility: "easy",
    rating: place.rating,
    notes:
      details?.editorialSummary ??
      place.address ??
      "Discovered via Google Places",
    hours: details?.weekdayHours?.join("; "),
    phone: details?.phone,
    website: details?.website,
    placeId,
    isUserAdded: true,
  };
}
