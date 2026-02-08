import { NextResponse } from "next/server";
import { db } from "@/db";
import { userPlans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { name, token } = await request.json();

    if (!name || !token) {
      return NextResponse.json(
        { valid: false, error: "Name and token required" },
        { status: 400 }
      );
    }

    if (token !== process.env.AUTH_TOKEN) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const normalizedName = name.trim().toLowerCase();

    // Upsert: find or create user
    const existing = await db
      .select()
      .from(userPlans)
      .where(eq(userPlans.userName, normalizedName))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({
        valid: true,
        plans: existing[0].plans,
      });
    }

    // Create new user with empty plans
    await db.insert(userPlans).values({
      userName: normalizedName,
      plans: [],
    });

    return NextResponse.json({ valid: true, plans: [] });
  } catch (err) {
    console.error("Auth validate error:", err);
    return NextResponse.json(
      { valid: false, error: "Server error" },
      { status: 500 }
    );
  }
}
