import { NextResponse } from "next/server";
import { validateToken } from "@/lib/auth-server";
import { db } from "@/db";
import { userLocations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { discoverToLocation } from "@/lib/discover-to-location";
import type { Location } from "@/data/locations";

export async function GET(request: Request) {
  const { valid } = validateToken(request);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userName = searchParams.get("userName")?.trim().toLowerCase();

  if (!userName) {
    return NextResponse.json(
      { error: "userName required" },
      { status: 400 }
    );
  }

  try {
    const rows = await db
      .select()
      .from(userLocations)
      .where(eq(userLocations.userName, userName));

    const locations: Location[] = rows.map(({ id, userName: _u, createdAt: _c, ...row }) => ({
      ...row,
      rating: row.rating ?? undefined,
      hours: row.hours ?? undefined,
      phone: row.phone ?? undefined,
      website: row.website ?? undefined,
      placeId: row.placeId ?? undefined,
      isUserAdded: true,
    }));

    return NextResponse.json(locations);
  } catch (err) {
    console.error("User locations GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user locations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { valid } = validateToken(request);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userName, place, details } = await request.json();

    if (!userName || !place) {
      return NextResponse.json(
        { error: "userName and place required" },
        { status: 400 }
      );
    }

    const normalizedName = userName.trim().toLowerCase();
    const location = discoverToLocation(place, details);

    await db
      .insert(userLocations)
      .values({
        userName: normalizedName,
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        category: location.category,
        mobility: location.mobility,
        rating: location.rating ?? null,
        notes: location.notes,
        hours: location.hours ?? null,
        phone: location.phone ?? null,
        website: location.website ?? null,
        placeId: location.placeId ?? null,
      })
      .onConflictDoUpdate({
        target: [userLocations.userName, userLocations.name],
        set: {
          lat: location.lat,
          lng: location.lng,
          category: location.category,
          rating: location.rating ?? null,
          notes: location.notes,
          hours: location.hours ?? null,
          phone: location.phone ?? null,
          website: location.website ?? null,
          placeId: location.placeId ?? null,
        },
      });

    return NextResponse.json({ location });
  } catch (err) {
    console.error("User locations POST error:", err);
    return NextResponse.json(
      { error: "Failed to save location" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const { valid } = validateToken(request);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userName, locationName } = await request.json();

    if (!userName || !locationName) {
      return NextResponse.json(
        { error: "userName and locationName required" },
        { status: 400 }
      );
    }

    const normalizedName = userName.trim().toLowerCase();

    await db
      .delete(userLocations)
      .where(
        and(
          eq(userLocations.userName, normalizedName),
          eq(userLocations.name, locationName)
        )
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("User locations DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}
