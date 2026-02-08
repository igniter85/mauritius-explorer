import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Routing service not configured" },
      { status: 503 }
    );
  }

  try {
    const { coordinates } = await request.json();

    // coordinates: [[lng, lat], [lng, lat], ...] — ORS expects [lng, lat] order
    // radiuses: snap each waypoint to nearest road within 5km
    // (handles offshore points like Crystal Rock, trailheads, etc.)
    const radiuses = coordinates.map(() => 5000);

    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({ coordinates, radiuses }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("ORS error:", res.status, text);
      return NextResponse.json(
        { error: "Routing request failed" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) {
      return NextResponse.json(
        { error: "No route found" },
        { status: 404 }
      );
    }

    // Transform to what DayRoute needs
    // ORS GeoJSON coordinates are [lng, lat] — convert to [lat, lng] for Leaflet
    const routeCoords: [number, number][] = feature.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );

    const summary = feature.properties.summary;
    const segments: { distance: number; duration: number }[] =
      feature.properties.segments ?? [];

    return NextResponse.json(
      {
        coordinates: routeCoords,
        totalDistance: (summary?.distance ?? 0) / 1000, // km
        totalTime: (summary?.duration ?? 0) / 60, // minutes
        segments: segments.map((s) => ({
          distance: s.distance / 1000, // km
          time: s.duration / 60, // minutes
        })),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to calculate route" },
      { status: 500 }
    );
  }
}
