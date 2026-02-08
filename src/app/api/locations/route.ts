import { db } from "@/db";
import { locations } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(locations);
  const result = rows.map(({ id, ...row }) => ({
    ...row,
    rating: row.rating ?? undefined,
    hours: row.hours ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    placeId: row.placeId ?? undefined,
  }));
  return Response.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
