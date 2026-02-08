# 🗓️ Day Planner + 🌤️ Weather Widget — Implementation Guide

## New Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities leaflet-routing-machine
npm install -D @types/leaflet-routing-machine
```

## Updated Project Structure

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css          ← updated (new styles)
├── components/
│   ├── MauritiusMap.tsx      ← updated (integrates everything)
│   ├── DayPlanner.tsx        ← NEW
│   ├── DayRoute.tsx          ← NEW (draws route on map)
│   ├── WeatherWidget.tsx     ← NEW
│   └── DraggableLocation.tsx ← NEW
└── data/
    ├── locations.ts
    └── reviews.json
```

---

## File 1: `src/components/DayPlanner.tsx`

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  locations,
  categoryConfig,
  type Location,
  type LocationCategory,
} from "@/data/locations";

// ─── Types ───

export interface DayPlan {
  id: string;
  label: string;
  locationNames: string[];
}

export interface RouteInfo {
  dayId: string;
  totalDistance: number; // km
  totalTime: number; // minutes
  legs: { from: string; to: string; distance: number; time: number }[];
}

interface DayPlannerProps {
  days: DayPlan[];
  onDaysChange: (days: DayPlan[]) => void;
  activeDayId: string | null;
  onActiveDayChange: (dayId: string | null) => void;
  routeInfos: Record<string, RouteInfo>;
}

// ─── Persistence ───

const STORAGE_KEY = "mauritius-day-plans";

export function loadDays(): DayPlan[] {
  if (typeof window === "undefined") return getDefaultDays();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return getDefaultDays();
}

export function saveDays(days: DayPlan[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  } catch {}
}

function getDefaultDays(): DayPlan[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `day-${i + 1}`,
    label: `Day ${i + 1}`,
    locationNames: [],
  }));
}

// ─── Sortable Location Item ───

function SortableLocationItem({
  name,
  dayId,
  onRemove,
}: {
  name: string;
  dayId: string;
  onRemove: () => void;
}) {
  const loc = locations.find((l) => l.name === name);
  const config = loc ? categoryConfig[loc.category] : null;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `${dayId}::${name}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-stone-200
                 hover:border-stone-300 transition-colors group"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500 flex-shrink-0"
        title="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>
      {config && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
      )}
      <span className="text-xs text-stone-700 truncate flex-1">{name}</span>
      <button
        onClick={onRemove}
        className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        title="Remove"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Unassigned Location (source list) ───

function UnassignedItem({ name }: { name: string }) {
  const loc = locations.find((l) => l.name === name);
  const config = loc ? categoryConfig[loc.category] : null;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `unassigned::${name}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-md
                 cursor-grab active:cursor-grabbing hover:bg-stone-100 transition-colors"
    >
      {config && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.color }}
        />
      )}
      <span className="text-[11px] text-stone-600 truncate">{name}</span>
    </div>
  );
}

// ─── Day Card ───

function DayCard({
  day,
  isActive,
  onActivate,
  onRemoveLocation,
  routeInfo,
}: {
  day: DayPlan;
  isActive: boolean;
  onActivate: () => void;
  onRemoveLocation: (name: string) => void;
  routeInfo?: RouteInfo;
}) {
  const { setNodeRef } = useSortable({ id: day.id, disabled: true });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 transition-all ${
        isActive
          ? "border-blue-400 bg-blue-50/50 shadow-sm"
          : "border-stone-200 bg-white hover:border-stone-300"
      }`}
    >
      <button
        onClick={onActivate}
        className="w-full flex items-center justify-between px-4 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-800">{day.label}</span>
          <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">
            {day.locationNames.length} stops
          </span>
        </div>
        {routeInfo && routeInfo.totalTime > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <span>🚗 {Math.round(routeInfo.totalTime)} min</span>
            <span>· {routeInfo.totalDistance.toFixed(1)} km</span>
          </div>
        )}
      </button>

      {/* Drop zone + sorted items */}
      <SortableContext
        items={day.locationNames.map((n) => `${day.id}::${n}`)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`px-3 pb-3 flex flex-col gap-1.5 min-h-[40px] ${
            day.locationNames.length === 0 ? "items-center justify-center" : ""
          }`}
        >
          {day.locationNames.length === 0 ? (
            <p className="text-[10px] text-stone-400 italic py-2">
              Drag locations here
            </p>
          ) : (
            day.locationNames.map((name) => (
              <SortableLocationItem
                key={`${day.id}::${name}`}
                name={name}
                dayId={day.id}
                onRemove={() => onRemoveLocation(name)}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Per-leg breakdown when active */}
      {isActive && routeInfo && routeInfo.legs.length > 0 && (
        <div className="px-4 pb-3 border-t border-blue-100 pt-2">
          <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-1.5">
            Driving segments
          </p>
          {routeInfo.legs.map((leg, i) => (
            <div key={i} className="flex items-center gap-1 text-[11px] text-stone-500 py-0.5">
              <span className="text-stone-700 truncate max-w-[100px]">{leg.from}</span>
              <span className="text-stone-300">→</span>
              <span className="text-stone-700 truncate max-w-[100px]">{leg.to}</span>
              <span className="ml-auto text-stone-400 flex-shrink-0">
                {Math.round(leg.time)} min · {leg.distance.toFixed(1)} km
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Day Planner ───

export default function DayPlanner({
  days,
  onDaysChange,
  activeDayId,
  onActiveDayChange,
  routeInfos,
}: DayPlannerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Compute unassigned locations
  const assignedNames = new Set(days.flatMap((d) => d.locationNames));
  const unassigned = locations.filter((l) => !assignedNames.has(l.name));

  // Group unassigned by category
  const unassignedByCategory = unassigned.reduce(
    (acc, loc) => {
      if (!acc[loc.category]) acc[loc.category] = [];
      acc[loc.category].push(loc);
      return acc;
    },
    {} as Record<LocationCategory, Location[]>
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeStr = active.id as string;
    const overStr = over.id as string;

    // Parse source
    const [activeDayOrPool, activeName] = activeStr.includes("::")
      ? activeStr.split("::")
      : [null, null];

    // Parse target
    const [overDayOrPool, overName] = overStr.includes("::")
      ? overStr.split("::")
      : [overStr, null]; // could be a day card id

    const isFromUnassigned = activeDayOrPool === "unassigned";
    const isDroppingOnDay = overStr.startsWith("day-") && !overStr.includes("::");

    const newDays = days.map((d) => ({ ...d, locationNames: [...d.locationNames] }));

    if (isFromUnassigned && activeName) {
      // Dragging from unassigned pool into a day
      const targetDayId = isDroppingOnDay ? overStr : overDayOrPool;
      const targetDay = newDays.find((d) => d.id === targetDayId);
      if (targetDay && !targetDay.locationNames.includes(activeName)) {
        if (overName) {
          // Insert at specific position
          const overIndex = targetDay.locationNames.indexOf(overName);
          targetDay.locationNames.splice(overIndex, 0, activeName);
        } else {
          targetDay.locationNames.push(activeName);
        }
        onDaysChange(newDays);
      }
    } else if (activeDayOrPool && activeName) {
      // Reordering within same day or moving between days
      const sourceDay = newDays.find((d) => d.id === activeDayOrPool);
      const targetDayId = isDroppingOnDay ? overStr : overDayOrPool;
      const targetDay = newDays.find((d) => d.id === targetDayId);

      if (sourceDay && targetDay) {
        // Remove from source
        sourceDay.locationNames = sourceDay.locationNames.filter((n) => n !== activeName);

        if (sourceDay.id === targetDay.id && overName) {
          // Reorder within same day
          const items = [...sourceDay.locationNames];
          // activeName was already removed, insert at overName position
          const overIndex = items.indexOf(overName);
          items.splice(overIndex >= 0 ? overIndex : items.length, 0, activeName);
          sourceDay.locationNames = items;
        } else {
          // Move to different day
          if (overName) {
            const overIndex = targetDay.locationNames.indexOf(overName);
            targetDay.locationNames.splice(overIndex, 0, activeName);
          } else {
            targetDay.locationNames.push(activeName);
          }
        }
        onDaysChange(newDays);
      }
    }
  }

  function removeFromDay(dayId: string, name: string) {
    const newDays = days.map((d) =>
      d.id === dayId
        ? { ...d, locationNames: d.locationNames.filter((n) => n !== name) }
        : d
    );
    onDaysChange(newDays);
  }

  function resetAll() {
    if (confirm("Remove all locations from all days?")) {
      onDaysChange(getDefaultDays());
    }
  }

  // ─── Render ───

  const activeItemName = activeId?.includes("::") ? activeId.split("::")[1] : null;
  const activeLoc = activeItemName ? locations.find((l) => l.name === activeItemName) : null;

  const totalDrivingTime = Object.values(routeInfos).reduce(
    (sum, r) => sum + r.totalTime,
    0
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-stone-800">🗓️ Day Planner</h2>
            <button
              onClick={resetAll}
              className="text-[10px] text-red-500 hover:text-red-700 font-medium"
            >
              Reset all
            </button>
          </div>
          {totalDrivingTime > 0 && (
            <p className="text-[11px] text-stone-400">
              Total driving: ~{Math.round(totalDrivingTime)} min across all days
            </p>
          )}
        </div>

        {/* Day cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              isActive={activeDayId === day.id}
              onActivate={() =>
                onActiveDayChange(activeDayId === day.id ? null : day.id)
              }
              onRemoveLocation={(name) => removeFromDay(day.id, name)}
              routeInfo={routeInfos[day.id]}
            />
          ))}
        </div>

        {/* Unassigned pool */}
        {unassigned.length > 0 && (
          <div className="border-t border-stone-200 bg-stone-50/80">
            <div className="px-4 py-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400">
                Unassigned ({unassigned.length})
              </span>
            </div>
            <div className="px-3 pb-3 max-h-[200px] overflow-y-auto space-y-3">
              <SortableContext
                items={unassigned.map((l) => `unassigned::${l.name}`)}
                strategy={verticalListSortingStrategy}
              >
                {(Object.entries(unassignedByCategory) as [LocationCategory, Location[]][]).map(
                  ([cat, locs]) => (
                    <div key={cat}>
                      <p className="text-[10px] text-stone-400 font-medium mb-1 px-1">
                        {categoryConfig[cat].emoji} {categoryConfig[cat].label}
                      </p>
                      <div className="space-y-1">
                        {locs.map((loc) => (
                          <UnassignedItem key={loc.name} name={loc.name} />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </SortableContext>
            </div>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeLoc && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border-2 border-blue-400 shadow-lg">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: categoryConfig[activeLoc.category].color }}
            />
            <span className="text-xs text-stone-700">{activeLoc.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

---

## File 2: `src/components/DayRoute.tsx`

This component draws the driving route on the map when a day is active.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import { locations } from "@/data/locations";
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

    if (!day || day.locationNames.length < 2) {
      // If only 1 stop, report zero driving
      if (day && day.locationNames.length <= 1) {
        onRouteCalculated({
          dayId: day.id,
          totalDistance: 0,
          totalTime: 0,
          legs: [],
        });
      }
      return;
    }

    const waypoints = day.locationNames
      .map((name) => {
        const loc = locations.find((l) => l.name === name);
        return loc ? L.latLng(loc.lat, loc.lng) : null;
      })
      .filter(Boolean) as L.LatLng[];

    if (waypoints.length < 2) return;

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
      show: false, // hide the text directions panel
      addWaypoints: false,
      fitSelectedRoutes: true,
      routeWhileDragging: false,
    });

    // @ts-ignore — leaflet-routing-machine types are incomplete
    control.on("routesfound", (e: { routes: any[] }) => {
      const route = e.routes[0];
      if (!route) return;

      const legs = route.legs?.map((leg: any, i: number) => ({
        from: day.locationNames[i],
        to: day.locationNames[i + 1],
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

  return null; // this is a map control, no visual component
}
```

---

## File 3: `src/components/WeatherWidget.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  current: {
    temp: number;
    feels_like: number;
    description: string;
    icon: string;
    humidity: number;
    wind_speed: number;
    uvi: number;
  };
  forecast: {
    date: string;
    dayName: string;
    high: number;
    low: number;
    icon: string;
    description: string;
    pop: number; // probability of precipitation
  }[];
}

// Mauritius center coordinates
const LAT = -20.2;
const LON = 57.5;

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchWeather() {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (!apiKey) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        // Current weather
        const currentRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`
        );
        const currentData = await currentRes.json();

        // 5-day forecast
        const forecastRes = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`
        );
        const forecastData = await forecastRes.json();

        // Process forecast into daily summaries
        const dailyMap = new Map<
          string,
          { temps: number[]; icons: string[]; descs: string[]; pops: number[] }
        >();

        for (const item of forecastData.list) {
          const date = item.dt_txt.split(" ")[0];
          const today = new Date().toISOString().split("T")[0];
          if (date === today) continue; // skip today

          if (!dailyMap.has(date)) {
            dailyMap.set(date, { temps: [], icons: [], descs: [], pops: [] });
          }
          const d = dailyMap.get(date)!;
          d.temps.push(item.main.temp);
          d.icons.push(item.weather[0].icon);
          d.descs.push(item.weather[0].description);
          d.pops.push(item.pop || 0);
        }

        const forecast = Array.from(dailyMap.entries())
          .slice(0, 5)
          .map(([date, d]) => {
            const dt = new Date(date);
            return {
              date,
              dayName: dt.toLocaleDateString("en-US", { weekday: "short" }),
              high: Math.round(Math.max(...d.temps)),
              low: Math.round(Math.min(...d.temps)),
              icon: d.icons[Math.floor(d.icons.length / 2)], // midday icon
              description: d.descs[Math.floor(d.descs.length / 2)],
              pop: Math.round(Math.max(...d.pops) * 100),
            };
          });

        setWeather({
          current: {
            temp: Math.round(currentData.main.temp),
            feels_like: Math.round(currentData.main.feels_like),
            description: currentData.weather[0].description,
            icon: currentData.weather[0].icon,
            humidity: currentData.main.humidity,
            wind_speed: Math.round(currentData.wind.speed * 3.6), // m/s → km/h
            uvi: 0, // not available in free tier
          },
          forecast,
        });
      } catch (e) {
        console.error("Weather fetch failed:", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (error || loading) {
    return (
      <div className="absolute top-3 right-14 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2">
        <span className="text-xs text-stone-400">
          {loading ? "Loading weather…" : "⚠️ Weather unavailable"}
        </span>
      </div>
    );
  }

  if (!weather) return null;

  const iconUrl = (code: string) =>
    `https://openweathermap.org/img/wn/${code}@2x.png`;

  return (
    <div
      className={`absolute top-3 right-14 z-[1000] bg-white/95 backdrop-blur-sm
        rounded-xl shadow-lg transition-all duration-300 ${
          expanded ? "w-[280px]" : "w-auto"
        }`}
    >
      {/* Compact view — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-2 w-full"
      >
        <img
          src={iconUrl(weather.current.icon)}
          alt={weather.current.description}
          className="w-8 h-8 -my-1"
        />
        <span className="text-lg font-semibold text-stone-800">
          {weather.current.temp}°C
        </span>
        <span className="text-[11px] text-stone-500 capitalize hidden sm:inline">
          {weather.current.description}
        </span>
        <svg
          className={`w-3 h-3 text-stone-400 ml-auto transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Expanded view */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-stone-100">
          {/* Current details */}
          <div className="flex gap-4 py-2 text-[11px] text-stone-500">
            <span>Feels {weather.current.feels_like}°C</span>
            <span>💧 {weather.current.humidity}%</span>
            <span>💨 {weather.current.wind_speed} km/h</span>
          </div>

          {/* 5-day forecast */}
          <div className="space-y-1 mt-1">
            {weather.forecast.map((day) => (
              <div
                key={day.date}
                className="flex items-center gap-2 text-[11px]"
              >
                <span className="w-8 font-medium text-stone-600">
                  {day.dayName}
                </span>
                <img
                  src={iconUrl(day.icon)}
                  alt={day.description}
                  className="w-6 h-6"
                />
                <span className="text-stone-800 font-medium">{day.high}°</span>
                <span className="text-stone-400">{day.low}°</span>
                {day.pop > 20 && (
                  <span className="text-blue-500 ml-auto">🌧 {day.pop}%</span>
                )}
              </div>
            ))}
          </div>

          <p className="text-[9px] text-stone-300 mt-2 text-right">
            Mauritius · OpenWeather
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## File 4: Updated `src/components/MauritiusMap.tsx`

Here's what changes in the main map component to integrate both features:

```tsx
"use client";

import { useState, useMemo, useCallback } from "react";
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
import DayPlanner, {
  loadDays,
  saveDays,
  type DayPlan,
  type RouteInfo,
} from "./DayPlanner";
import DayRoute from "./DayRoute";
import WeatherWidget from "./WeatherWidget";

// ─── Custom marker icon (same as before) ───

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

// ─── Numbered marker for day planner ───

function createNumberedIcon(color: string, number: number) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <text x="12" y="12" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold"
            font-family="system-ui">${number}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -28],
  });
}

// ─── Star Rating ───

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.3;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {"★".repeat(full)}
      {half && "½"}
      <span className="text-xs text-stone-400 ml-1 font-medium">{rating}</span>
    </span>
  );
}

// ─── Location Popup ───

function LocationCard({ location }: { location: Location }) {
  const config = categoryConfig[location.category];
  return (
    <div className="min-w-[260px] max-w-[300px]">
      <h3 className="font-semibold text-stone-900 text-sm leading-tight mb-2">
        {config.emoji} {location.name}
      </h3>
      <span
        className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full mb-2"
        style={{ backgroundColor: config.color + "18", color: config.color }}
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
        <p className="text-[11px] text-stone-500">🕐 {location.hours}</p>
      )}
      {location.phone && (
        <p className="text-[11px] text-stone-500">
          📞 <a href={`tel:${location.phone}`} className="underline">{location.phone}</a>
        </p>
      )}
      {location.website && (
        <p className="text-[11px] text-stone-500">
          🌐 <a href={location.website} target="_blank" rel="noopener noreferrer"
                 className="underline text-blue-600">Website</a>
        </p>
      )}
    </div>
  );
}

// ─── Sidebar Tabs ───

type SidebarTab = "explore" | "planner";

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════

export default function MauritiusMap() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("explore");
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Explore tab state
  const [activeCategories, setActiveCategories] = useState<Set<LocationCategory>>(
    new Set(Object.keys(categoryConfig) as LocationCategory[])
  );

  // Planner state
  const [days, setDays] = useState<DayPlan[]>(loadDays);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [routeInfos, setRouteInfos] = useState<Record<string, RouteInfo>>({});

  const filteredLocations = useMemo(
    () => locations.filter((loc) => activeCategories.has(loc.category)),
    [activeCategories]
  );

  const activeDay = useMemo(
    () => days.find((d) => d.id === activeDayId) ?? null,
    [days, activeDayId]
  );

  // Which locations are in the active day (for numbered markers)
  const activeDayLocations = useMemo(() => {
    if (!activeDay) return new Map<string, number>();
    const map = new Map<string, number>();
    activeDay.locationNames.forEach((name, i) => map.set(name, i + 1));
    return map;
  }, [activeDay]);

  function handleDaysChange(newDays: DayPlan[]) {
    setDays(newDays);
    saveDays(newDays);
  }

  const handleRouteCalculated = useCallback((info: RouteInfo) => {
    setRouteInfos((prev) => ({ ...prev, [info.dayId]: info }));
  }, []);

  function toggleCategory(cat: LocationCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  // ─── Determine which markers to show ───
  const visibleLocations =
    sidebarTab === "planner" && activeDay
      ? locations.filter((l) => activeDay.locationNames.includes(l.name))
      : filteredLocations;

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-stone-100">
      {/* ─── Sidebar ─── */}
      <aside
        className={`${sidebarOpen ? "w-[360px]" : "w-0"}
          transition-all duration-300 ease-in-out overflow-hidden
          bg-white border-r border-stone-200 flex-shrink-0 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-100">
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">
            🇲🇺 Mauritius Explorer
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            {locations.length} locations · 7-day trip planner
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-100">
          <button
            onClick={() => setSidebarTab("explore")}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              sidebarTab === "explore"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            📍 Explore
          </button>
          <button
            onClick={() => setSidebarTab("planner")}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              sidebarTab === "planner"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            🗓️ Day Planner
          </button>
        </div>

        {/* Tab content */}
        {sidebarTab === "explore" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category filters */}
            <div className="p-3 border-b border-stone-100">
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(categoryConfig) as [LocationCategory, typeof categoryConfig[LocationCategory]][]).map(
                  ([key, config]) => {
                    const active = activeCategories.has(key);
                    const count = locations.filter((l) => l.category === key).length;
                    return (
                      <button
                        key={key}
                        onClick={() => toggleCategory(key)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium
                          transition-all ${
                            active
                              ? "text-white shadow-sm"
                              : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                          }`}
                        style={active ? { backgroundColor: config.color } : undefined}
                      >
                        {config.emoji} {config.label} ({count})
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Location list */}
            <div className="flex-1 overflow-y-auto">
              {filteredLocations.map((loc) => {
                const config = categoryConfig[loc.category];
                return (
                  <button
                    key={loc.name}
                    onClick={() =>
                      setSelectedLocation(
                        selectedLocation === loc.name ? null : loc.name
                      )
                    }
                    className="w-full text-left px-4 py-3 border-b border-stone-50
                               hover:bg-stone-50 transition-colors"
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
          </div>
        ) : (
          <DayPlanner
            days={days}
            onDaysChange={handleDaysChange}
            activeDayId={activeDayId}
            onActiveDayChange={setActiveDayId}
            routeInfos={routeInfos}
          />
        )}
      </aside>

      {/* ─── Sidebar toggle ─── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-3 left-3 z-[1000] bg-white shadow-lg rounded-lg p-2 hover:bg-stone-50"
        style={sidebarOpen ? { left: "368px" } : { left: "12px" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {sidebarOpen ? <path d="M15 18l-6-6 6-6" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
        </svg>
      </button>

      {/* ─── Map ─── */}
      <div className="flex-1 relative">
        <WeatherWidget />

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

          {/* Route polyline for active day */}
          <DayRoute day={activeDay} onRouteCalculated={handleRouteCalculated} />

          {/* Markers */}
          {visibleLocations.map((loc) => {
            const config = categoryConfig[loc.category];
            const dayNumber = activeDayLocations.get(loc.name);
            const isSelected = selectedLocation === loc.name;

            return (
              <Marker
                key={loc.name}
                position={[loc.lat, loc.lng]}
                icon={
                  dayNumber
                    ? createNumberedIcon(config.color, dayNumber)
                    : createIcon(config.color, isSelected)
                }
                eventHandlers={{
                  click: () => setSelectedLocation(loc.name),
                }}
              >
                <Popup maxWidth={320}>
                  <LocationCard location={loc} />
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Google attribution */}
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/80 backdrop-blur rounded px-2 py-1">
          <span className="text-[9px] text-stone-400">
            Reviews powered by Google · Routing by OSRM
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## File 5: Add to `src/app/globals.css`

Append these styles:

```css
/* ─── Leaflet Routing Machine: hide default UI ─── */
.leaflet-routing-container {
  display: none !important;
}

/* ─── Day planner drag styles ─── */
[data-dnd-dragging="true"] {
  opacity: 0.5;
}
```

---

## Environment Variables

Add to `.env.local`:

```
GOOGLE_PLACES_API_KEY=your_google_key_here
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key_here
```

Note: The weather key needs `NEXT_PUBLIC_` prefix because it's called from the browser.
The Google key does NOT have this prefix — it's only used at build time.

### Getting a free OpenWeather API key

1. Go to [openweathermap.org](https://openweathermap.org/api)
2. Sign up (free)
3. Go to **API keys** tab → copy your key
4. Free tier gives 1,000 calls/day — more than enough (app calls once per 30 min)

---

## How It All Works

```
┌──────────────────────────────────────────────────┐
│                    Sidebar                        │
│                                                   │
│  ┌─── Explore ───┬─── Day Planner ──┐            │
│  │               │                   │            │
│  │ Category      │ Day 1  🚗 47min  │            │
│  │ filters       │  ├─ Le Morne  ①  │            │
│  │               │  ├─ Chamarel  ②  │            │
│  │ Location      │  └─ Rhumerie ③  │            │
│  │ list          │                   │            │
│  │               │ Day 2  🚗 32min  │            │
│  │               │  └─ ...          │            │
│  │               │                   │            │
│  │               │ ── Unassigned ── │            │
│  │               │  Drag items here │            │
│  └───────────────┴──────────────────┘            │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│                     Map                           │
│                                                   │
│  ┌─ Weather ─┐     Numbered markers              │
│  │ 28°C ☀️   │     Route polyline                 │
│  │ 5-day     │     Leg-by-leg times               │
│  └───────────┘                                    │
└──────────────────────────────────────────────────┘
```

**Day Planner flow:**
1. Switch to "Day Planner" tab
2. Drag locations from the unassigned pool into day cards
3. Click a day card to activate it → route draws on map with numbered markers
4. Driving time auto-calculated via OSRM (free, no key needed)
5. Reorder stops by dragging within a day
6. Plans persist in localStorage

**Weather Widget:**
- Compact: shows current temp + icon (top-right of map)
- Click to expand: feels-like, humidity, wind, 5-day forecast with rain probability
- Auto-refreshes every 30 minutes
