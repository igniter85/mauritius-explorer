import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { locations as locationData } from "../src/data/locations";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const sql = postgres(url);
  const db = drizzle(sql, { schema });

  console.log(`Seeding ${locationData.length} locations...`);

  const rows = locationData.map((loc) => ({
    name: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    category: loc.category as (typeof schema.categoryEnum.enumValues)[number],
    mobility: loc.mobility as (typeof schema.mobilityEnum.enumValues)[number],
    rating: loc.rating ?? null,
    notes: loc.notes,
    hours: loc.hours ?? null,
    phone: loc.phone ?? null,
    website: loc.website ?? null,
    placeId: loc.placeId ?? null,
  }));

  await db
    .insert(schema.locations)
    .values(rows)
    .onConflictDoUpdate({
      target: schema.locations.name,
      set: {
        lat: schema.locations.lat,
        lng: schema.locations.lng,
        category: schema.locations.category,
        mobility: schema.locations.mobility,
        rating: schema.locations.rating,
        notes: schema.locations.notes,
        hours: schema.locations.hours,
        phone: schema.locations.phone,
        website: schema.locations.website,
        placeId: schema.locations.placeId,
      },
    });

  console.log("Done!");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
