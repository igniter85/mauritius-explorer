import { NextResponse } from "next/server";
import { validateToken } from "@/lib/auth-server";
import { db } from "@/db";
import { userPlans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request) {
  const { valid } = validateToken(request);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userName, plans } = await request.json();

    if (!userName || !Array.isArray(plans)) {
      return NextResponse.json(
        { error: "userName and plans required" },
        { status: 400 }
      );
    }

    const normalizedName = userName.trim().toLowerCase();

    await db
      .insert(userPlans)
      .values({
        userName: normalizedName,
        plans,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPlans.userName,
        set: {
          plans,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Plans save error:", err);
    return NextResponse.json(
      { error: "Failed to save plans" },
      { status: 500 }
    );
  }
}
