"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Car,
  Plus,
  MapPinned,
  LayoutGrid,
  Info,
} from "lucide-react";
import {
  categoryConfig,
  mobilityConfig,
  type Location,
  type LocationCategory,
} from "@/data/locations";
import { haversine } from "@/lib/haversine";
import CategoryIcon from "./CategoryIcon";
import { LocationPreview, MobilePreviewCard } from "./LocationPreview";
import DayRoute from "./DayRoute";
import ItineraryTimeline from "./ItineraryTimeline";
import {
  loadDays,
  saveDays,
  type DayPlan,
  type RouteInfo,
} from "./DayPlanner";
const HOTEL_NAME = "C Mauritius (Hotel)";

// ─── Map helpers ───

function createNumberedIcon(color: string, number: number) {
  const size = 36;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <defs>
        <filter id="num-shadow-${number}" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="${color}" flood-opacity="0.4"/>
        </filter>
      </defs>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="${color}" stroke="#fff" stroke-width="2" filter="url(#num-shadow-${number})"/>
      <text x="12" y="12" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold"
            font-family="system-ui">${number}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

function createHotelIcon() {
  const size = 44;
  const color = "#f43f5e";
  const svg = `
    <div style="position:relative;width:${size}px;height:${size}px">
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
        <defs>
          <filter id="hotel-shadow" x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${color}" flood-opacity="0.5"/>
          </filter>
        </defs>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              fill="${color}" stroke="#fff" stroke-width="2" filter="url(#hotel-shadow)"/>
        <text x="12" y="11" text-anchor="middle" font-size="8" fill="#fff">★</text>
      </svg>
    </div>`;
  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

function FitBounds({
  locations,
  hotel,
}: {
  locations: Location[];
  hotel: Location | undefined;
}) {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    const points = [...locations];
    if (hotel) points.push(hotel);
    if (points.length === 0 || hasFit.current) return;
    hasFit.current = true;
    const bounds = L.latLngBounds(points.map((l) => [l.lat, l.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [locations, hotel, map]);

  return null;
}

// ─── Geographic regions (reused from DayPlanner) ───

type Region = "north" | "port-louis" | "east" | "west" | "southwest" | "south";

const regionConfig: Record<Region, { label: string; icon: string }> = {
  north: { label: "North", icon: "🏖" },
  "port-louis": { label: "Port Louis", icon: "🏛" },
  east: { label: "East Coast", icon: "🌅" },
  west: { label: "West Coast", icon: "🌊" },
  southwest: { label: "Southwest", icon: "⛰" },
  south: { label: "South & Central", icon: "🌿" },
};

const REGION_ORDER: Region[] = [
  "north",
  "port-louis",
  "east",
  "west",
  "southwest",
  "south",
];

function getRegion(lat: number, lng: number): Region {
  if (lat > -20.17 && lat < -20.14 && lng < 57.55) return "port-louis";
  if (lat > -20.14) return "north";
  if (lng > 57.7 && lat > -20.35) return "east";
  if (lat < -20.38 && lng < 57.46) return "southwest";
  if (lng < 57.46 && lat > -20.38) return "west";
  return "south";
}

function nearestDistance(loc: Location, refs: Location[]): number {
  let min = Infinity;
  for (const ref of refs) {
    const d = haversine(loc.lat, loc.lng, ref.lat, ref.lng) * 1.3;
    if (d < min) min = d;
  }
  return min;
}

// ─── Unassigned Item (pool) ───

function UnassignedPoolItem({
  name,
  distance,
  onAdd,
  highlighted,
  onHover,
  onShowPreview,
  allLocations,
}: {
  name: string;
  distance?: number;
  onAdd?: () => void;
  highlighted?: boolean;
  onHover?: (name: string | null) => void;
  onShowPreview?: (name: string) => void;
  allLocations: Location[];
}) {
  const loc = allLocations.find((l) => l.name === name);
  const config = loc ? categoryConfig[loc.category] : null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `unassigned::${name}` });

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
      role={onAdd ? "button" : undefined}
      aria-label={onAdd ? `Add ${name} to day` : undefined}
      onClick={(e) => {
        if (onAdd) {
          e.preventDefault();
          onAdd();
        }
      }}
      className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors touch-manipulation ${
        highlighted
          ? "bg-brand-primary/5 border border-brand-primary/20 hover:bg-brand-primary/10 active:bg-brand-primary/15 cursor-pointer"
          : onAdd
            ? "bg-brand-bg hover:bg-brand-border/50 active:bg-brand-border cursor-pointer"
            : "bg-brand-bg hover:bg-brand-border/50 cursor-grab active:cursor-grabbing"
      }`}
    >
      {highlighted && (
        <Plus size={12} className="text-brand-primary/60 flex-shrink-0" />
      )}
      {config && (
        <CategoryIcon
          name={config.icon}
          size={14}
          style={{ color: config.color }}
          className="flex-shrink-0"
        />
      )}
      <span className="text-[13px] text-brand-text/70 truncate flex-1">
        {name}
      </span>
      {loc && (() => {
        const mob = mobilityConfig[loc.mobility];
        return (
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
            style={{ backgroundColor: mob.color + "18" }}
            title={`${mob.label} — ${mob.description}`}
          >
            <CategoryIcon name={mob.icon} size={11} style={{ color: mob.color }} />
          </span>
        );
      })()}
      {onShowPreview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShowPreview(name);
          }}
          className="text-brand-text/30 hover:text-brand-primary active:text-brand-primary/80 transition-colors flex-shrink-0 cursor-pointer p-2 -m-1 md:hidden"
          aria-label={`Preview ${name}`}
        >
          <Info size={14} />
        </button>
      )}
      {distance !== undefined && (
        <span className="text-xs text-brand-text/40 flex-shrink-0 tabular-nums">
          ~{Math.round(distance)} km
        </span>
      )}
      <LocationPreview name={name} onHover={onHover} allLocations={allLocations} />
    </div>
  );
}

// ─── Main Component ───

interface DayPlannerPageProps {
  dayId: string;
  allLocations: Location[];
  initialDays: DayPlan[];
  userName: string;
  authToken: string;
}

type GroupMode = "region" | "category";

export default function DayPlannerPage({
  dayId,
  allLocations,
  initialDays,
  userName,
  authToken,
}: DayPlannerPageProps) {
  const [days, setDays] = useState<DayPlan[]>(() =>
    initialDays.length > 0 ? initialDays : loadDays()
  );
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>("region");
  const [previewLocation, setPreviewLocation] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Current day
  const dayIndex = days.findIndex((d) => d.id === dayId);
  const currentDay = days[dayIndex] ?? null;
  const dayNumber = dayIndex + 1;
  const totalDays = days.length;

  const hotel = allLocations.find((l) => l.name === HOTEL_NAME);

  // Stop locations for the embedded map
  const stopLocations = useMemo(() => {
    if (!currentDay) return [];
    return currentDay.locationNames
      .map((n) => allLocations.find((l) => l.name === n))
      .filter(Boolean) as Location[];
  }, [currentDay, allLocations]);

  // Persistence
  const handleDaysChange = useCallback(
    (newDays: DayPlan[]) => {
      setDays(newDays);
      saveDays(newDays);

      if (authToken && userName) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          fetch("/api/plans", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ userName, plans: newDays }),
          }).catch(() => {});
        }, 500);
      }
    },
    [authToken, userName]
  );

  const handleRouteCalculated = useCallback(
    (info: RouteInfo) => {
      if (info.dayId === dayId) {
        setRouteInfo(info);
      }
    },
    [dayId]
  );

  // ─── Unassigned pool ───

  const assignedNames = useMemo(
    () => new Set(days.flatMap((d) => d.locationNames)),
    [days]
  );

  const unassigned = useMemo(
    () => allLocations.filter((l) => !assignedNames.has(l.name) && l.category !== "hotel"),
    [allLocations, assignedNames]
  );

  // Reference locations for distance suggestions
  const referenceLocations = useMemo(() => {
    if (stopLocations.length > 0) return stopLocations;
    if (hotel) return [hotel];
    return [];
  }, [stopLocations, hotel]);

  const distanceMap = useMemo(() => {
    const map = new Map<string, number>();
    if (referenceLocations.length > 0) {
      for (const loc of unassigned) {
        map.set(loc.name, nearestDistance(loc, referenceLocations));
      }
    }
    return map;
  }, [unassigned, referenceLocations]);

  const nearbyItems = useMemo(() => {
    if (referenceLocations.length === 0) return [];
    return [...unassigned]
      .sort((a, b) => (distanceMap.get(a.name) ?? 0) - (distanceMap.get(b.name) ?? 0))
      .slice(0, 5);
  }, [unassigned, distanceMap, referenceLocations]);

  const nearbyNames = useMemo(
    () => new Set(nearbyItems.map((l) => l.name)),
    [nearbyItems]
  );

  const remainingUnassigned = useMemo(
    () => unassigned.filter((l) => !nearbyNames.has(l.name)),
    [unassigned, nearbyNames]
  );

  const remainingByRegion = useMemo(() => {
    return remainingUnassigned.reduce(
      (acc, loc) => {
        const region = getRegion(loc.lat, loc.lng);
        if (!acc[region]) acc[region] = [];
        acc[region]!.push(loc);
        return acc;
      },
      {} as Partial<Record<Region, Location[]>>
    );
  }, [remainingUnassigned]);

  const remainingByCategory = useMemo(() => {
    return remainingUnassigned.reduce(
      (acc, loc) => {
        if (!acc[loc.category]) acc[loc.category] = [];
        acc[loc.category]!.push(loc);
        return acc;
      },
      {} as Partial<Record<LocationCategory, Location[]>>
    );
  }, [remainingUnassigned]);

  // ─── DnD handlers ───

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !currentDay) return;

    const activeStr = active.id as string;
    const overStr = over.id as string;

    const [activeDayOrPool, activeName] = activeStr.includes("::")
      ? activeStr.split("::")
      : [null, null];
    const [overDayOrPool, overName] = overStr.includes("::")
      ? overStr.split("::")
      : [overStr, null];

    const isFromUnassigned = activeDayOrPool === "unassigned";

    const newDays = days.map((d) => ({
      ...d,
      locationNames: [...d.locationNames],
    }));

    const targetDay = newDays.find((d) => d.id === dayId);
    if (!targetDay || !activeName) return;

    if (isFromUnassigned) {
      if (!targetDay.locationNames.includes(activeName)) {
        if (overName && overDayOrPool === dayId) {
          const overIndex = targetDay.locationNames.indexOf(overName);
          targetDay.locationNames.splice(overIndex, 0, activeName);
        } else {
          targetDay.locationNames.push(activeName);
        }
        handleDaysChange(newDays);
      }
    } else if (activeDayOrPool === dayId) {
      // Reorder within current day
      targetDay.locationNames = targetDay.locationNames.filter((n) => n !== activeName);
      if (overName && overDayOrPool === dayId) {
        const overIndex = targetDay.locationNames.indexOf(overName);
        targetDay.locationNames.splice(
          overIndex >= 0 ? overIndex : targetDay.locationNames.length,
          0,
          activeName
        );
      } else {
        targetDay.locationNames.push(activeName);
      }
      handleDaysChange(newDays);
    }
  }

  function removeFromDay(name: string) {
    const newDays = days.map((d) =>
      d.id === dayId
        ? { ...d, locationNames: d.locationNames.filter((n) => n !== name) }
        : d
    );
    handleDaysChange(newDays);
  }

  function addToDay(name: string) {
    const newDays = days.map((d) =>
      d.id === dayId && !d.locationNames.includes(name)
        ? { ...d, locationNames: [...d.locationNames, name] }
        : d
    );
    handleDaysChange(newDays);
  }

  // Drag overlay
  const activeItemName = activeId?.includes("::")
    ? activeId.split("::")[1]
    : null;
  const activeLoc = activeItemName
    ? allLocations.find((l) => l.name === activeItemName)
    : null;

  if (!currentDay) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center">
          <p className="text-brand-text/60 mb-4">Day not found</p>
          <Link href="/" className="text-brand-primary text-sm font-medium hover:underline">
            Back to map
          </Link>
        </div>
      </div>
    );
  }

  const prevDayId = dayIndex > 0 ? days[dayIndex - 1].id : null;
  const nextDayId = dayIndex < totalDays - 1 ? days[dayIndex + 1].id : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-dvh bg-brand-bg">
        {/* ─── Sticky header ─── */}
        <header className="sticky top-0 z-20 bg-white border-b border-brand-border">
          <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-brand-text/60 hover:text-brand-text transition-colors touch-manipulation"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <h1 className="text-sm font-heading font-bold text-brand-text">
              Day {dayNumber} of {totalDays}
            </h1>

            <div className="flex items-center gap-1">
              {prevDayId ? (
                <Link
                  href={`/planner/${prevDayId}`}
                  className="p-2 text-brand-text/50 hover:text-brand-text transition-colors touch-manipulation"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={18} />
                </Link>
              ) : (
                <span className="p-2 text-brand-text/20">
                  <ChevronLeft size={18} />
                </span>
              )}
              {nextDayId ? (
                <Link
                  href={`/planner/${nextDayId}`}
                  className="p-2 text-brand-text/50 hover:text-brand-text transition-colors touch-manipulation"
                  aria-label="Next day"
                >
                  <ChevronRight size={18} />
                </Link>
              ) : (
                <span className="p-2 text-brand-text/20">
                  <ChevronRight size={18} />
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ─── Embedded map ─── */}
        <div className="h-[250px] md:h-[300px] w-full">
          <MapContainer
            center={[-20.25, 57.55]}
            zoom={10}
            zoomControl={false}
            className="h-full w-full"
            style={{ background: "#E0F2FE" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FitBounds locations={stopLocations} hotel={hotel} />
            <DayRoute
              allLocations={allLocations}
              day={currentDay}
              onRouteCalculated={handleRouteCalculated}
            />

            {/* Hotel marker */}
            {hotel && (
              <Marker
                position={[hotel.lat, hotel.lng]}
                icon={createHotelIcon()}
              />
            )}

            {/* Numbered stop markers */}
            {stopLocations.map((loc, i) => {
              const config = categoryConfig[loc.category];
              return (
                <Marker
                  key={loc.name}
                  position={[loc.lat, loc.lng]}
                  icon={createNumberedIcon(config.color, i + 1)}
                />
              );
            })}
          </MapContainer>
        </div>

        {/* ─── Summary bar ─── */}
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3 border-b border-brand-border bg-white">
          <div className="flex items-center gap-1.5 text-sm text-brand-text/70">
            <span className="font-semibold text-brand-text">
              {currentDay.locationNames.length} stops
            </span>
            {routeInfo && routeInfo.totalTime > 0 && (
              <>
                <span className="text-brand-text/30">&middot;</span>
                <span className="flex items-center gap-1 tabular-nums">
                  <Car size={13} />
                  {routeInfo.totalDistance.toFixed(0)} km
                </span>
                <span className="text-brand-text/30">&middot;</span>
                <span className="tabular-nums">~{Math.round(routeInfo.totalTime)} min</span>
              </>
            )}
          </div>
        </div>

        {/* ─── Timeline ─── */}
        <div className="max-w-2xl mx-auto px-4 py-4">
          <ItineraryTimeline
            dayId={dayId}
            locationNames={currentDay.locationNames}
            allLocations={allLocations}
            routeInfo={routeInfo}
            onRemoveLocation={removeFromDay}
            onShowPreview={setPreviewLocation}
          />
        </div>

        {/* ─── Add stops section ─── */}
        {unassigned.length > 0 && (
          <div className="border-t border-brand-border bg-white">
            <div className="max-w-2xl mx-auto">
              <SortableContext
                items={unassigned.map((l) => `unassigned::${l.name}`)}
                strategy={verticalListSortingStrategy}
              >
                {/* Nearby suggestions */}
                {nearbyItems.length > 0 && (
                  <div>
                    <div className="px-4 py-2.5">
                      <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary/60">
                        {stopLocations.length > 0 ? "Nearby your stops" : "Closest to hotel"}
                      </span>
                    </div>
                    <div className="px-3 pb-2.5 space-y-1.5">
                      {nearbyItems.map((loc) => (
                        <UnassignedPoolItem
                          key={loc.name}
                          name={loc.name}
                          distance={distanceMap.get(loc.name)}
                          onAdd={() => addToDay(loc.name)}
                          highlighted
                          onShowPreview={setPreviewLocation}
                          allLocations={allLocations}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Remaining grouped */}
                {remainingUnassigned.length > 0 && (
                  <div className={nearbyItems.length > 0 ? "border-t border-brand-border" : ""}>
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-semibold text-brand-text/40">
                        All locations ({remainingUnassigned.length})
                      </span>
                      <div className="flex bg-brand-bg rounded-md p-0.5">
                        <button
                          onClick={() => setGroupMode("region")}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer touch-manipulation ${
                            groupMode === "region"
                              ? "bg-white shadow-sm text-brand-text"
                              : "text-brand-text/40"
                          }`}
                        >
                          <MapPinned size={10} />
                          Region
                        </button>
                        <button
                          onClick={() => setGroupMode("category")}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer touch-manipulation ${
                            groupMode === "category"
                              ? "bg-white shadow-sm text-brand-text"
                              : "text-brand-text/40"
                          }`}
                        >
                          <LayoutGrid size={10} />
                          Category
                        </button>
                      </div>
                    </div>
                    <div className="px-3 pb-4 space-y-3">
                      {groupMode === "region"
                        ? REGION_ORDER.filter((r) => remainingByRegion[r]).map((region) => (
                            <div key={region}>
                              <p className="text-xs text-brand-text/40 font-medium mb-1.5 px-1">
                                {regionConfig[region].icon} {regionConfig[region].label}
                                <span className="text-brand-text/50 ml-1">
                                  ({remainingByRegion[region]!.length})
                                </span>
                              </p>
                              <div className="space-y-1.5">
                                {remainingByRegion[region]!.map((loc) => (
                                  <UnassignedPoolItem
                                    key={loc.name}
                                    name={loc.name}
                                    distance={distanceMap.get(loc.name)}
                                    onAdd={() => addToDay(loc.name)}
                                    onShowPreview={setPreviewLocation}
                                    allLocations={allLocations}
                                  />
                                ))}
                              </div>
                            </div>
                          ))
                        : (
                            Object.entries(remainingByCategory) as [
                              LocationCategory,
                              Location[],
                            ][]
                          ).map(([cat, locs]) => (
                            <div key={cat}>
                              <p className="text-xs text-brand-text/40 font-medium mb-1.5 px-1 flex items-center gap-1.5">
                                <CategoryIcon
                                  name={categoryConfig[cat].icon}
                                  size={12}
                                  style={{ color: categoryConfig[cat].color }}
                                />
                                {categoryConfig[cat].label}
                                <span className="text-brand-text/50">
                                  ({locs.length})
                                </span>
                              </p>
                              <div className="space-y-1.5">
                                {locs.map((loc) => (
                                  <UnassignedPoolItem
                                    key={loc.name}
                                    name={loc.name}
                                    distance={distanceMap.get(loc.name)}
                                    onAdd={() => addToDay(loc.name)}
                                    onShowPreview={setPreviewLocation}
                                    allLocations={allLocations}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                )}
              </SortableContext>
            </div>
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeLoc && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border-2 border-brand-primary shadow-lg">
            <CategoryIcon
              name={categoryConfig[activeLoc.category].icon}
              size={12}
              style={{ color: categoryConfig[activeLoc.category].color }}
            />
            <span className="text-xs text-brand-text">{activeLoc.name}</span>
          </div>
        )}
      </DragOverlay>

      {/* Mobile preview card */}
      {previewLocation && (
        <MobilePreviewCard
          name={previewLocation}
          onClose={() => setPreviewLocation(null)}
          allLocations={allLocations}
        />
      )}
    </DndContext>
  );
}
