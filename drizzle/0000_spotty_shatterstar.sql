CREATE TYPE "public"."location_category" AS ENUM('nature', 'beach', 'water', 'culture', 'food', 'adventure', 'hotel');--> statement-breakpoint
CREATE TYPE "public"."mobility_level" AS ENUM('easy', 'moderate', 'challenging');--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"category" "location_category" NOT NULL,
	"mobility" "mobility_level" NOT NULL,
	"rating" real,
	"notes" text NOT NULL,
	"hours" text,
	"phone" text,
	"website" text,
	"place_id" text,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
