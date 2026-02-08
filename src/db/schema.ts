import {
  pgTable,
  serial,
  text,
  real,
  jsonb,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const categoryEnum = pgEnum("location_category", [
  "nature",
  "beach",
  "water",
  "culture",
  "food",
  "adventure",
  "hotel",
]);

export const mobilityEnum = pgEnum("mobility_level", [
  "easy",
  "moderate",
  "challenging",
]);

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  category: categoryEnum("category").notNull(),
  mobility: mobilityEnum("mobility").notNull(),
  rating: real("rating"),
  notes: text("notes").notNull(),
  hours: text("hours"),
  phone: text("phone"),
  website: text("website"),
  placeId: text("place_id"),
});

export const userPlans = pgTable("user_plans", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull().unique(),
  plans: jsonb("plans").notNull().default("[]"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userLocations = pgTable(
  "user_locations",
  {
    id: serial("id").primaryKey(),
    userName: text("user_name").notNull(),
    name: text("name").notNull(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    category: categoryEnum("category").notNull(),
    mobility: mobilityEnum("mobility").notNull().default("easy"),
    rating: real("rating"),
    notes: text("notes").notNull(),
    hours: text("hours"),
    phone: text("phone"),
    website: text("website"),
    placeId: text("place_id"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("user_locations_user_name_name_unique").on(table.userName, table.name),
  ]
);
