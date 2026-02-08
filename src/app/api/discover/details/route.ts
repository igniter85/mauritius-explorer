import { NextResponse } from "next/server";
import { validateToken } from "@/lib/auth-server";
import type { PlaceDetails, PlaceReview } from "@/lib/discover-types";

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$$",
};

export async function POST(request: Request) {
  const { valid } = validateToken(request);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Service not configured" },
      { status: 503 }
    );
  }

  try {
    const { placeId } = await request.json();
    if (!placeId || typeof placeId !== "string") {
      return NextResponse.json(
        { error: "placeId required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "editorialSummary,reviews,internationalPhoneNumber,websiteUri,currentOpeningHours,priceLevel,googleMapsUri",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Place Details error:", res.status, text);
      return NextResponse.json(
        { error: "Failed to fetch place details" },
        { status: 502 }
      );
    }

    const data = await res.json();

    const reviews: PlaceReview[] = (data.reviews ?? []).map(
      (r: {
        authorAttribution?: {
          displayName?: string;
          photoUri?: string;
          uri?: string;
        };
        rating?: number;
        text?: { text?: string };
        relativePublishTimeDescription?: string;
      }) => ({
        author: r.authorAttribution?.displayName ?? "Anonymous",
        authorPhotoUri: r.authorAttribution?.photoUri,
        authorUri: r.authorAttribution?.uri,
        rating: r.rating ?? 0,
        text: r.text?.text,
        timeAgo: r.relativePublishTimeDescription ?? "",
      })
    );

    const details: PlaceDetails = {
      editorialSummary: data.editorialSummary?.text,
      reviews,
      phone: data.internationalPhoneNumber,
      website: data.websiteUri,
      openNow: data.currentOpeningHours?.openNow,
      weekdayHours: data.currentOpeningHours?.weekdayDescriptions,
      priceLevel: data.priceLevel ? PRICE_LABELS[data.priceLevel] : undefined,
      googleMapsUrl: data.googleMapsUri,
    };

    return NextResponse.json(details, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
