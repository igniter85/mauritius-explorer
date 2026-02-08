import { NextResponse } from "next/server";
import { validateToken } from "@/lib/auth-server";

export async function POST(request: Request) {
  const { valid } = validateToken(request);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Discover service not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { lat, lng, radius, includedTypes } = body;

    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      typeof radius !== "number" ||
      !Array.isArray(includedTypes) ||
      includedTypes.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.photos",
        },
        body: JSON.stringify({
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius: radius * 1000, // km → meters
            },
          },
          includedTypes,
          maxResultCount: 20,
          rankPreference: "DISTANCE",
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Google Places error:", res.status, text);
      return NextResponse.json(
        { error: "Upstream search failed" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const rawPlaces = data.places ?? [];

    const places = rawPlaces.map(
      (p: {
        id: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        rating?: number;
        userRatingCount?: number;
        types?: string[];
        photos?: { name?: string }[];
      }) => {
        let photoUri: string | undefined;
        const photoRef = p.photos?.[0]?.name;
        if (photoRef) {
          photoUri = `https://places.googleapis.com/v1/${photoRef}/media?maxHeightPx=200&maxWidthPx=200&key=${apiKey}`;
        }

        return {
          id: p.id,
          name: p.displayName?.text ?? "Unknown",
          address: p.formattedAddress ?? "",
          lat: p.location?.latitude ?? 0,
          lng: p.location?.longitude ?? 0,
          rating: p.rating,
          userRatingCount: p.userRatingCount,
          types: p.types ?? [],
          photoUri,
        };
      }
    );

    return NextResponse.json(
      { places },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to search nearby places" },
      { status: 500 }
    );
  }
}
