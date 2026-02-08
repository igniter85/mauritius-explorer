# 🗺️ Mauritius Interactive Map — Next.js Project Guide

## 1. Create the Project

```bash
npx create-next-app@latest mauritius-map --typescript --tailwind --app --src-dir --use-npm
cd mauritius-map
```

Accept the defaults (ESLint yes, App Router yes, Turbopack whatever you prefer).

## 2. Install Dependencies

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

## 3. Project Structure

After setup, you only need to create/edit these files:

```
src/
├── app/
│   ├── layout.tsx        ← edit (add fonts + metadata)
│   ├── page.tsx          ← replace entirely
│   └── globals.css       ← replace entirely
├── components/
│   └── MauritiusMap.tsx  ← create (main map component)
└── data/
    └── locations.ts      ← create (all location data)
```

## 4. Files to Create/Edit

---

### `src/data/locations.ts`

```typescript
export type LocationCategory =
  | "nature"
  | "beach"
  | "water"
  | "culture"
  | "food"
  | "adventure";

export interface Location {
  name: string;
  lat: number;
  lng: number;
  category: LocationCategory;
  rating?: number;
  notes: string;
  hours?: string;
  phone?: string;
  website?: string;
}

export const categoryConfig: Record<
  LocationCategory,
  { label: string; color: string; emoji: string }
> = {
  nature: { label: "Nature & Landscapes", color: "#16a34a", emoji: "🌿" },
  beach: { label: "Beaches & Islands", color: "#0ea5e9", emoji: "🏖️" },
  water: { label: "Water Activities", color: "#6366f1", emoji: "🤿" },
  culture: { label: "Culture & History", color: "#d97706", emoji: "🏛️" },
  food: { label: "Food & Drink", color: "#e11d48", emoji: "🍽️" },
  adventure: { label: "Adventure", color: "#7c3aed", emoji: "🦁" },
};

export const locations: Location[] = [
  // ── Nature & Landscapes ──
  {
    name: "Black River Gorges National Park",
    lat: -20.4264,
    lng: 57.4509,
    category: "nature",
    rating: 4.6,
    notes:
      "Largest national park — lush rainforest, endemic birds, gorge viewpoints. Half-day hike.",
    hours: "Daily 6 AM – 6 PM",
    phone: "+230 464 4053",
  },
  {
    name: "Le Morne Brabant (UNESCO)",
    lat: -20.45,
    lng: 57.3167,
    category: "nature",
    rating: 4.8,
    notes:
      "556m UNESCO mountain with panoramic ocean views. Guided hike recommended — start before 6 AM!",
  },
  {
    name: "Seven Coloured Earths",
    lat: -20.4401,
    lng: 57.3732,
    category: "nature",
    rating: 4.3,
    notes:
      "Geological marvel — multi-colored sand dunes + giant tortoises. Entry ~750 MUR.",
    hours: "Daily 8:30 AM – 5 PM",
    phone: "+230 483 4298",
  },
  {
    name: "Chamarel Waterfall",
    lat: -20.4432,
    lng: 57.3858,
    category: "nature",
    rating: 4.5,
    notes:
      "Tallest single-drop waterfall in Mauritius (~100m). Included in Seven Coloured Earths ticket.",
    hours: "Daily 8:30 AM – 5 PM",
  },
  {
    name: "Trou aux Cerfs Crater",
    lat: -20.315,
    lng: 57.505,
    category: "nature",
    rating: 4.2,
    notes:
      "Extinct volcanic crater in Curepipe. 360° island panorama. Free entry, quick stop.",
  },

  // ── Beaches & Islands ──
  {
    name: "Île aux Cerfs",
    lat: -20.2724,
    lng: 57.8041,
    category: "beach",
    rating: 4.4,
    notes:
      "Famous island paradise — white sand, turquoise water, water sports, BBQ lunch on catamaran.",
  },
  {
    name: "Trou aux Biches Beach",
    lat: -20.035,
    lng: 57.545,
    category: "beach",
    rating: 4.5,
    notes:
      "Top-rated beach in the north — excellent snorkeling right from shore. Calm, clear water.",
  },
  {
    name: "Flic en Flac Beach",
    lat: -20.2995,
    lng: 57.3634,
    category: "beach",
    rating: 4.4,
    notes:
      "8km beach on the west coast — legendary sunsets. Dolphin-watching departures nearby.",
  },
  {
    name: "Blue Bay Marine Park",
    lat: -20.4448,
    lng: 57.7098,
    category: "beach",
    rating: 4.5,
    notes:
      "Best snorkeling in Mauritius — protected marine park with vibrant coral. Glass-bottom boats available.",
    hours: "Daily 8:30 AM – 4 PM",
  },
  {
    name: "Le Morne Beach",
    lat: -20.4525,
    lng: 57.3127,
    category: "beach",
    rating: 4.6,
    notes:
      "Stunning beach with Le Morne mountain backdrop. World-class kitesurfing & incredible sunsets.",
  },
  {
    name: "Crystal Rock",
    lat: -20.4143,
    lng: 57.3376,
    category: "beach",
    rating: 4.6,
    notes:
      "Iconic rock formation in the turquoise lagoon — great snorkeling & photo spot. Boat access only.",
  },

  // ── Water Activities ──
  {
    name: "Île aux Aigrettes",
    lat: -20.4205,
    lng: 57.7325,
    category: "water",
    rating: 4.7,
    notes:
      "Conservation island — pink pigeons, giant tortoises, endemic species. Guided tours only, book ahead.",
  },

  // ── Culture & History ──
  {
    name: "Port Louis Central Market",
    lat: -20.1607,
    lng: 57.503,
    category: "culture",
    rating: 4.0,
    notes:
      "Spices, street food, souvenirs. Try dholl puri at Maraz stall. Haggle for souvenirs upstairs!",
    hours: "Mon–Sat 5 AM – 5:30 PM, Sun 5 – 11:30 AM",
  },
  {
    name: "Caudan Waterfront",
    lat: -20.1609,
    lng: 57.4981,
    category: "culture",
    rating: 4.3,
    notes:
      "Modern waterfront with shops, restaurants, Umbrella Street, cinema & casino. Nice evening stroll.",
    hours: "Daily ~9 AM – 7 PM",
    phone: "+230 211 9500",
    website: "https://www.caudan.com",
  },
  {
    name: "Aapravasi Ghat (UNESCO)",
    lat: -20.1586,
    lng: 57.503,
    category: "culture",
    rating: 4.5,
    notes:
      "Historic immigration depot — free entry. Powerful museum about indentured labour history.",
    hours: "Mon–Fri 9 AM – 4 PM, Sat 9 AM – 12 PM",
    phone: "+230 217 7770",
  },
  {
    name: "Cap Malheureux Church",
    lat: -19.9866,
    lng: 57.6222,
    category: "culture",
    rating: 4.6,
    notes:
      "Iconic red-roofed church with stunning ocean backdrop. One of the most photographed spots in Mauritius.",
    hours: "Daily 9:30 AM – 6 PM",
  },
  {
    name: "Pamplemousses Botanical Garden",
    lat: -20.1047,
    lng: 57.5803,
    category: "culture",
    rating: 4.3,
    notes:
      "Giant water lilies, spice trees, 300+ years of history. Entry 300 MUR. Bring mosquito repellent!",
    hours: "Daily 8:30 AM – 5 PM",
    phone: "+230 243 9401",
  },
  {
    name: "Flacq Market",
    lat: -20.1891,
    lng: 57.7257,
    category: "culture",
    rating: 4.1,
    notes:
      "Largest open-air market — authentic local vibe, fresh produce, spices. Only open Wed & Sun!",
    hours: "Wed & Sun 6 AM – 5 PM",
  },

  // ── Food & Drink ──
  {
    name: "Bois Chéri Tea Factory",
    lat: -20.4263,
    lng: 57.5257,
    category: "food",
    rating: 4.3,
    notes:
      "Tea plantation tour + generous tasting with hilltop views. Last morning tour at 11:30. ~650 MUR.",
    hours: "Mon–Fri 9 AM – 5 PM, Sat 9 – 11:30 AM, Sun 9 AM – 4 PM",
    phone: "+230 617 9109",
  },
  {
    name: "Rhumerie de Chamarel",
    lat: -20.4279,
    lng: 57.3963,
    category: "food",
    rating: 4.5,
    notes:
      "Rum distillery tour + tasting of ~12 varieties. Free tour with lunch reservation. Closed Sundays.",
    hours: "Mon–Sat 9:30 AM – 4:30 PM",
    phone: "+230 483 4980",
    website: "https://www.rhumeriedechamarel.com",
  },

  // ── Adventure ──
  {
    name: "Casela Nature Park",
    lat: -20.2908,
    lng: 57.404,
    category: "adventure",
    rating: 4.2,
    notes:
      "Safari, ziplines, walk with lions, quad biking. Full day recommended. Great for families.",
    hours: "Daily 9 AM – 5 PM",
    phone: "+230 401 6500",
    website: "https://caselaparks.com",
  },
  {
    name: "La Vanille Nature Park",
    lat: -20.4992,
    lng: 57.5633,
    category: "adventure",
    rating: 4.4,
    notes:
      "World's largest captive Aldabra tortoise collection + crocodiles. Feeding at 11 AM! ~975 MUR.",
    hours: "Daily 9 AM – 5 PM",
    phone: "+230 626 2503",
    website: "https://www.lavanillenaturepark.com",
  },
  {
    name: "Grand Baie",
    lat: -20.0089,
    lng: 57.5816,
    category: "adventure",
    rating: undefined,
    notes:
      "Lively tourist hub in the north — restaurants, nightlife, catamaran & dolphin trip departure point.",
  },
];
```

---

### `src/components/MauritiusMap.tsx`

```tsx
"use client";

import { useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  locations,
  categoryConfig,
  type LocationCategory,
  type Location,
} from "@/data/locations";

// Custom colored marker using SVG
function createIcon(color: string, isActive: boolean) {
  const size = isActive ? 36 : 28;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="3" fill="#fff" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.3;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${rating} stars`}>
      {"★".repeat(full)}
      {half && "½"}
      <span className="text-xs text-stone-400 ml-1 font-medium">{rating}</span>
    </span>
  );
}

function LocationCard({
  location,
  onClose,
}: {
  location: Location;
  onClose: () => void;
}) {
  const config = categoryConfig[location.category];
  return (
    <div className="min-w-[260px] max-w-[300px]">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-stone-900 text-sm leading-tight">
          {config.emoji} {location.name}
        </h3>
      </div>

      <span
        className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mb-2"
        style={{
          backgroundColor: config.color + "18",
          color: config.color,
        }}
      >
        {config.label}
      </span>

      {location.rating && (
        <div className="mb-2">
          <StarRating rating={location.rating} />
        </div>
      )}

      <p className="text-xs text-stone-600 leading-relaxed mb-2">
        {location.notes}
      </p>

      {location.hours && (
        <p className="text-[11px] text-stone-500">
          <span className="font-medium">🕐</span> {location.hours}
        </p>
      )}
      {location.phone && (
        <p className="text-[11px] text-stone-500">
          <span className="font-medium">📞</span>{" "}
          <a href={`tel:${location.phone}`} className="underline">
            {location.phone}
          </a>
        </p>
      )}
      {location.website && (
        <p className="text-[11px] text-stone-500">
          <span className="font-medium">🌐</span>{" "}
          <a
            href={location.website}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600"
          >
            Website
          </a>
        </p>
      )}
    </div>
  );
}

export default function MauritiusMap() {
  const [activeCategories, setActiveCategories] = useState<
    Set<LocationCategory>
  >(new Set(Object.keys(categoryConfig) as LocationCategory[]));
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredLocations = useMemo(
    () => locations.filter((loc) => activeCategories.has(loc.category)),
    [activeCategories]
  );

  function toggleCategory(cat: LocationCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  function toggleAll() {
    if (activeCategories.size === Object.keys(categoryConfig).length) {
      setActiveCategories(new Set());
    } else {
      setActiveCategories(
        new Set(Object.keys(categoryConfig) as LocationCategory[])
      );
    }
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-stone-100">
      {/* Sidebar */}
      <aside
        className={`
          ${sidebarOpen ? "w-[340px]" : "w-0"} 
          transition-all duration-300 ease-in-out overflow-hidden
          bg-white border-r border-stone-200 flex-shrink-0 flex flex-col
        `}
      >
        <div className="p-5 border-b border-stone-100">
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">
            🇲🇺 Mauritius Explorer
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {filteredLocations.length} of {locations.length} locations
          </p>
        </div>

        {/* Category Filters */}
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400">
              Filter
            </span>
            <button
              onClick={toggleAll}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
            >
              {activeCategories.size ===
              Object.keys(categoryConfig).length
                ? "Hide all"
                : "Show all"}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              Object.entries(categoryConfig) as [
                LocationCategory,
                (typeof categoryConfig)[LocationCategory]
              ][]
            ).map(([key, config]) => {
              const active = activeCategories.has(key);
              const count = locations.filter(
                (l) => l.category === key
              ).length;
              return (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={`
                    inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-150
                    ${
                      active
                        ? "text-white shadow-sm"
                        : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                    }
                  `}
                  style={
                    active ? { backgroundColor: config.color } : undefined
                  }
                >
                  {config.emoji} {config.label}
                  <span
                    className={`text-[10px] ${active ? "opacity-75" : ""}`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location List */}
        <div className="flex-1 overflow-y-auto">
          {filteredLocations.map((loc) => {
            const config = categoryConfig[loc.category];
            const isSelected = selectedLocation === loc.name;
            return (
              <button
                key={loc.name}
                onClick={() =>
                  setSelectedLocation(isSelected ? null : loc.name)
                }
                className={`
                  w-full text-left px-4 py-3 border-b border-stone-50
                  hover:bg-stone-50 transition-colors
                  ${isSelected ? "bg-stone-50 ring-inset ring-2" : ""}
                `}
                style={
                  isSelected
                    ? { ringColor: config.color }
                    : undefined
                }
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-sm font-medium text-stone-800 truncate">
                    {loc.name}
                  </span>
                  {loc.rating && (
                    <span className="text-[11px] text-amber-600 flex-shrink-0 ml-auto">
                      ★ {loc.rating}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 pl-[18px]">
                  {loc.notes}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Toggle sidebar button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-3 left-3 z-[1000] bg-white shadow-lg rounded-lg p-2 hover:bg-stone-50 transition-colors"
        style={sidebarOpen ? { left: "348px" } : { left: "12px" }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {sidebarOpen ? (
            <>
              <path d="M15 18l-6-6 6-6" />
            </>
          ) : (
            <>
              <path d="M3 12h18M3 6h18M3 18h18" />
            </>
          )}
        </svg>
      </button>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[-20.25, 57.55]}
          zoom={10}
          zoomControl={false}
          className="h-full w-full"
          style={{ background: "#e8f4f8" }}
        >
          <ZoomControl position="topright" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {filteredLocations.map((loc) => {
            const config = categoryConfig[loc.category];
            const isSelected = selectedLocation === loc.name;
            return (
              <Marker
                key={loc.name}
                position={[loc.lat, loc.lng]}
                icon={createIcon(config.color, isSelected)}
                eventHandlers={{
                  click: () => setSelectedLocation(loc.name),
                }}
              >
                <Popup maxWidth={320} closeButton={true}>
                  <LocationCard
                    location={loc}
                    onClose={() => setSelectedLocation(null)}
                  />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
```

---

### `src/app/globals.css`

```css
@import "tailwindcss";

/* Leaflet popup overrides */
.leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.15),
    0 4px 6px -2px rgba(0, 0, 0, 0.08) !important;
  padding: 0 !important;
}

.leaflet-popup-content {
  margin: 14px 16px !important;
  font-family: inherit !important;
}

.leaflet-popup-tip {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12) !important;
}

.custom-marker {
  background: none !important;
  border: none !important;
}

/* Smooth scrollbar */
aside::-webkit-scrollbar {
  width: 4px;
}
aside::-webkit-scrollbar-track {
  background: transparent;
}
aside::-webkit-scrollbar-thumb {
  background: #d6d3d1;
  border-radius: 4px;
}
```

---

### `src/app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Mauritius Explorer — Interactive Trip Map",
  description:
    "23 must-visit locations across Mauritius: beaches, nature, culture, food & adventure.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

---

### `src/app/page.tsx`

```tsx
import dynamic from "next/dynamic";

// Leaflet must be loaded client-side only (no SSR)
const MauritiusMap = dynamic(() => import("@/components/MauritiusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-stone-100">
      <div className="text-center">
        <div className="text-4xl mb-3">🇲🇺</div>
        <p className="text-stone-500 text-sm">Loading map…</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <MauritiusMap />;
}
```

## 5. Configure Static Export (optional)

If you want to deploy to GitHub Pages, Cloudflare Pages, or any static host, edit `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

Then build with:

```bash
npm run build
```

The static site will be in the `out/` folder — upload that anywhere.

## 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 7. Deploy

**Vercel (easiest, no config needed):**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# Upload the `out/` folder via Netlify dashboard or CLI
```

**GitHub Pages:**
1. Add `output: "export"` as shown above
2. Push to GitHub
3. Use GitHub Actions to build & deploy to Pages

---

## What You Get

- 🗺️ Full-screen interactive map with CARTO Voyager tiles (free, no API key)
- 📍 23 color-coded markers by category (nature, beach, culture, food, adventure)
- 🔍 Sidebar with category filters + location list
- 💬 Click any marker for popup with details, ratings, hours, phone, website
- 📱 Collapsible sidebar for mobile-friendly viewing
- ⚡ Static export compatible — works on any hosting
