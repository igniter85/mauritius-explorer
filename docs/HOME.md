# 🏨 Home Base + Round-Trip Route Planner

## Overview

Your hotel (C Mauritius, Palmar — east coast) becomes the **start and end point**
for every day in the planner. When you activate a day, the route shows:

```
🏨 Hotel → ① Le Morne → ② Chamarel → ③ Rhumerie → 🏨 Hotel
   25 min      22 min       8 min        55 min     = 1h50 total driving
```

This is especially useful since C Mauritius is on the east coast and many
attractions are in the south/southwest — that last reviewer wasn't kidding
about the drive times!

---

## Step 1: Add Home Base to `src/data/locations.ts`

Add this at the **top** of the `locations` array:

```typescript
export const HOME_BASE: Location = {
  name: "C Mauritius (Hotel)",
  lat: -20.2117,
  lng: 57.7918,
  category: "beach",  // closest category
  rating: 4.7,
  notes:
    "Your home base! 4-star hotel on Palmar beach, east coast. Buffet restaurants, 3 pools, beach toys. Beautiful beach with 2km walk.",
  hours: "Open 24 hours",
  phone: "+230 401 6100",
  placeId: "ChIJ-f5QyBr7fCER5jWXRJt0kJE",
};
```

---

## Step 2: Updated `src/components/DayRoute.tsx`

The key change: every route starts and ends at the hotel.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import { locations, HOME_BASE } from "@/data/locations";
import type { DayPlan, RouteInfo } from "./DayPlanner";

interface DayRouteProps {
  day: DayPlan | null;
  onRouteCalculated: (info: RouteInfo) => void;
}

export default function DayRoute({ day, onRouteCalculated }: DayRouteProps) {
  const map = useMap();
  const routingRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    // Clean up previous route
    if (routingRef.current) {
      map.removeControl(routingRef.current);
      routingRef.current = null;
    }

    if (!day || day.locationNames.length === 0) {
      if (day) {
        onRouteCalculated({
          dayId: day.id,
          totalDistance: 0,
          totalTime: 0,
          legs: [],
        });
      }
      return;
    }

    // Build waypoints: Hotel → Stop 1 → Stop 2 → ... → Hotel
    const stopCoords = day.locationNames
      .map((name) => {
        const loc = locations.find((l) => l.name === name);
        return loc ? L.latLng(loc.lat, loc.lng) : null;
      })
      .filter(Boolean) as L.LatLng[];

    const hotelLatLng = L.latLng(HOME_BASE.lat, HOME_BASE.lng);

    // Even for a single stop, we show: Hotel → Stop → Hotel
    const waypoints = [hotelLatLng, ...stopCoords, hotelLatLng];

    const control = L.Routing.control({
      waypoints,
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
        profile: "driving",
      }),
      lineOptions: {
        styles: [
          { color: "#3b82f6", weight: 5, opacity: 0.8 },
          { color: "#60a5fa", weight: 3, opacity: 0.5 },
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 100,
      },
      show: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      routeWhileDragging: false,
    });

    // @ts-ignore
    control.on("routesfound", (e: { routes: any[] }) => {
      const route = e.routes[0];
      if (!route) return;

      // Build leg labels: Hotel→Stop1, Stop1→Stop2, ..., StopN→Hotel
      const allStopNames = [
        HOME_BASE.name,
        ...day.locationNames,
        HOME_BASE.name,
      ];

      const legs =
        route.legs?.map((leg: any, i: number) => ({
          from: allStopNames[i],
          to: allStopNames[i + 1],
          distance: (leg.distance || 0) / 1000,
          time: (leg.time || 0) / 60,
        })) ?? [];

      onRouteCalculated({
        dayId: day.id,
        totalDistance: (route.summary?.totalDistance || 0) / 1000,
        totalTime: (route.summary?.totalTime || 0) / 60,
        legs,
      });
    });

    control.addTo(map);
    routingRef.current = control;

    return () => {
      if (routingRef.current) {
        map.removeControl(routingRef.current);
        routingRef.current = null;
      }
    };
  }, [day, map]);

  return null;
}
```

---

## Step 3: Add Hotel Marker to `MauritiusMap.tsx`

Add a special hotel marker that's always visible on the map:

```tsx
import { locations, categoryConfig, HOME_BASE, type Location, type LocationCategory } from "@/data/locations";

// ─── Hotel marker icon (house/pin shape) ───

function createHotelIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="#f97316" stroke="#fff" stroke-width="2"/>
      <text x="12" y="12" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold"
            font-family="system-ui">🏨</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "custom-marker hotel-marker",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
  });
}

// Then inside the MapContainer, add this marker (always visible):

<Marker
  position={[HOME_BASE.lat, HOME_BASE.lng]}
  icon={createHotelIcon()}
  zIndexOffset={1000}  // always on top
>
  <Popup maxWidth={320}>
    <LocationCard location={HOME_BASE} />
  </Popup>
</Marker>
```

---

## Step 4: Update DayPlanner Leg Display

In the `DayCard` component, update the leg breakdown to style hotel legs differently:

```tsx
{/* Per-leg breakdown when active */}
{isActive && routeInfo && routeInfo.legs.length > 0 && (
  <div className="px-4 pb-3 border-t border-blue-100 pt-2">
    <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-1.5">
      Round-trip from hotel
    </p>
    {routeInfo.legs.map((leg, i) => {
      const isHotelLeg =
        leg.from === HOME_BASE.name || leg.to === HOME_BASE.name;
      return (
        <div
          key={i}
          className={`flex items-center gap-1 text-[11px] py-0.5 ${
            isHotelLeg ? "text-orange-600" : "text-stone-500"
          }`}
        >
          <span className="truncate max-w-[110px]">
            {leg.from === HOME_BASE.name ? "🏨 Hotel" : leg.from}
          </span>
          <span className="text-stone-300">→</span>
          <span className="truncate max-w-[110px]">
            {leg.to === HOME_BASE.name ? "🏨 Hotel" : leg.to}
          </span>
          <span className="ml-auto text-stone-400 flex-shrink-0">
            {Math.round(leg.time)} min · {leg.distance.toFixed(1)} km
          </span>
        </div>
      );
    })}

    {/* Summary */}
    <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-50
                    text-xs font-medium text-blue-700">
      <span>🚗 Total round-trip</span>
      <span>
        {Math.round(routeInfo.totalTime)} min · {routeInfo.totalDistance.toFixed(1)} km
      </span>
    </div>
  </div>
)}
```

---

## Step 5: Add to `globals.css`

```css
/* Hotel marker pulse animation */
.hotel-marker {
  animation: hotel-pulse 2s ease-in-out infinite;
}

@keyframes hotel-pulse {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.4)); }
  50% { filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.7)); }
}
```

---

## What It Looks Like

### Day Planner (sidebar)

```
┌──────────────────────────────────────┐
│ 🗓️ Day Planner                      │
│ Total driving: ~4h 20min across 7 days│
├──────────────────────────────────────┤
│                                      │
│ Day 1 — Southwest          🚗 2h 10m │
│  ├─ Le Morne Brabant      ①         │
│  ├─ Chamarel + 7 Earths   ②         │
│  └─ Rhumerie de Chamarel  ③         │
│                                      │
│  Round-trip from hotel               │
│  🏨 Hotel → Le Morne       55 min   │
│  Le Morne → Chamarel       22 min   │
│  Chamarel → Rhumerie        8 min   │
│  Rhumerie → 🏨 Hotel       45 min   │
│  ─────────────────────────────       │
│  🚗 Total round-trip   2h10 · 98 km │
│                                      │
│ Day 2 — North              🚗 1h 25m │
│  ├─ Cap Malheureux         ①         │
│  ├─ Pamplemousses          ②         │
│  └─ Grand Baie             ③         │
│  ...                                 │
└──────────────────────────────────────┘
```

### Map (when Day 1 is active)

```
┌──────────────────────────────────────┐
│                    🌤️ 28°C           │
│                                      │
│           ③ Rhumerie                 │
│          ② Chamarel  ╲              │
│         ╱              ╲             │
│   ① Le Morne            ╲           │
│      ╲                    ╲          │
│       ╲    (blue route     ╲         │
│        ╲    polyline)       ╲        │
│         ╲                    🏨      │
│          ╲                  Hotel    │
│           ╲────────────────╱         │
│                                      │
│  Routing by OSRM · Reviews by Google │
└──────────────────────────────────────┘
```

---

## Practical Insight: Drive Times from C Mauritius

Based on the hotel's east-coast location at Palmar, here are the approximate
drive times to each area (useful for planning which days to combine):

| Area | Drive Time | Locations |
|------|-----------|-----------|
| **Nearby (< 20 min)** | 5–15 min | Île aux Cerfs (boat from Trou d'Eau Douce), Flacq Market |
| **North (30–45 min)** | 30–45 min | Grand Baie, Cap Malheureux, Trou aux Biches, Pamplemousses |
| **Central (25–35 min)** | 25–35 min | Trou aux Cerfs, Port Louis |
| **West coast (50–60 min)** | 50–65 min | Flic en Flac, Casela, Tamarin |
| **Southwest (55–75 min)** | 55–75 min | Le Morne, Chamarel, Black River Gorges, Rhumerie |
| **South (40–55 min)** | 40–55 min | Blue Bay, La Vanille, Bois Chéri, Eau Bleue |

### Suggested Day Groupings (optimized from hotel)

**Day 1 — Nearby + East:** Île aux Cerfs catamaran, Flacq Market (Wed/Sun only)
**Day 2 — North loop:** Cap Malheureux → Pamplemousses → Grand Baie → Trou aux Biches
**Day 3 — Southwest (long day):** Le Morne hike (6AM) → Le Morne Beach → Chamarel → Rhumerie
**Day 4 — South:** Blue Bay snorkeling → Île aux Aigrettes → La Vanille → Bois Chéri tea
**Day 5 — West coast:** Tamarin dolphins (6AM) → Flic en Flac → Casela
**Day 6 — Port Louis + Central:** Aapravasi Ghat → Central Market → Caudan → Trou aux Cerfs
**Day 7 — Chill:** Hotel beach day, Eau Bleue waterfall (30 min), Savinia Beach
