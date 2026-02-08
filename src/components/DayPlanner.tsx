"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { GripVertical, X, RotateCcw, Car, Plus, Star, MapPinned, LayoutGrid, Info } from "lucide-react";
import {
  categoryConfig,
  mobilityConfig,
  type Location,
  type LocationCategory,
  type PlaceEnrichment,
} from "@/data/locations";
import { haversine } from "@/lib/haversine";
import CategoryIcon from "./CategoryIcon";
import placesData from "@/data/places-data.json";

const enrichedData: Record<string, PlaceEnrichment> =
  placesData as unknown as Record<string, PlaceEnrichment>;

// ─── Types ───

export interface DayPlan {
  id: string;
  label: string;
  locationNames: string[];
}

export interface RouteInfo {
  dayId: string;
  totalDistance: number;
  totalTime: number;
  legs: { from: string; to: string; distance: number; time: number }[];
}

interface DayPlannerProps {
  allLocations: Location[];
  days: DayPlan[];
  onDaysChange: (days: DayPlan[]) => void;
  activeDayId: string | null;
  onActiveDayChange: (dayId: string | null) => void;
  routeInfos: Record<string, RouteInfo>;
  compact?: boolean;
  onHoverLocation?: (name: string | null) => void;
}

type GroupMode = "region" | "category";

// ─── Persistence ───

const STORAGE_KEY = "mauritius-day-plans";

export function getDefaultDays(): DayPlan[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: `day-${i + 1}`,
    label: `Day ${i + 1}`,
    locationNames: [],
  }));
}

export function loadDays(): DayPlan[] {
  if (typeof window === "undefined") return getDefaultDays();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return getDefaultDays();
}

export function saveDays(days: DayPlan[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
  } catch {
    // ignore
  }
}

// ─── Distance Utilities ───

const HOTEL_NAME = "C Mauritius (Hotel)";

function nearestDistance(loc: Location, refs: Location[]): number {
  let min = Infinity;
  for (const ref of refs) {
    const d = haversine(loc.lat, loc.lng, ref.lat, ref.lng) * 1.3;
    if (d < min) min = d;
  }
  return min;
}

// ─── Geographic Regions ───

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
  // Port Louis cluster
  if (lat > -20.17 && lat < -20.14 && lng < 57.55) return "port-louis";
  // North
  if (lat > -20.14) return "north";
  // East coast (near hotel)
  if (lng > 57.7 && lat > -20.35) return "east";
  // Southwest (Le Morne / Chamarel / Black River corridor)
  if (lat < -20.38 && lng < 57.46) return "southwest";
  // West coast
  if (lng < 57.46 && lat > -20.38) return "west";
  // South & Central (everything else)
  return "south";
}

// ─── Hover Preview (desktop only) ───

function LocationPreview({
  name,
  onHover,
  allLocations,
}: {
  name: string;
  onHover?: (name: string | null) => void;
  allLocations: Location[];
}) {
  const loc = allLocations.find((l) => l.name === name);
  const enrichment = enrichedData[name];
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  if (!loc) return null;

  const photo = enrichment?.photos?.[0];
  const summary = enrichment?.editorialSummary || loc.notes;
  const rating = enrichment?.googleRating ?? loc.rating;

  return (
    <>
      {/* Invisible hover sensor that triggers the preview */}
      <div
        ref={ref}
        className="absolute inset-0 z-10 max-md:hidden"
        onMouseEnter={() => {
          if (!ref.current) return;
          const rect = ref.current.getBoundingClientRect();
          setPos({
            top: Math.min(rect.top, window.innerHeight - 260),
            left: rect.right + 12,
          });
          onHover?.(name);
        }}
        onMouseLeave={() => {
          setPos(null);
          onHover?.(null);
        }}
      />
      {pos &&
        createPortal(
          <div
            className="fixed z-[9999] w-64 bg-white rounded-xl shadow-lg border border-brand-border overflow-hidden pointer-events-none animate-fade-in-up"
            style={{ top: pos.top, left: pos.left }}
          >
            {photo && (
              <img
                src={photo.url}
                alt={name}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
            )}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-heading font-bold text-brand-text truncate">
                  {name}
                </span>
              </div>
              {rating && (
                <div className="flex items-center gap-1 mb-1.5">
                  <Star
                    size={12}
                    className="text-amber-400 fill-amber-400"
                  />
                  <span className="text-xs font-medium text-brand-text/70">
                    {rating.toFixed(1)}
                  </span>
                  {enrichment?.totalReviews && (
                    <span className="text-xs text-brand-text/40">
                      ({enrichment.totalReviews})
                    </span>
                  )}
                </div>
              )}
              {(() => {
                const mob = mobilityConfig[loc.mobility];
                return (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1.5"
                    style={{
                      backgroundColor: mob.color + "18",
                      color: mob.color,
                    }}
                  >
                    <CategoryIcon name={mob.icon} size={10} style={{ color: mob.color }} />
                    {mob.label}
                  </span>
                );
              })()}
              <p className="text-xs text-brand-text/60 leading-relaxed line-clamp-3">
                {summary}
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ─── Mobile Preview Card ───

function MobilePreviewCard({
  name,
  onClose,
  allLocations,
}: {
  name: string;
  onClose: () => void;
  allLocations: Location[];
}) {
  const loc = allLocations.find((l) => l.name === name);
  const enrichment = enrichedData[name];

  if (!loc) return null;

  const photo = enrichment?.photos?.[0];
  const summary = enrichment?.editorialSummary || loc.notes;
  const rating = enrichment?.googleRating ?? loc.rating;
  const mob = mobilityConfig[loc.mobility];
  const config = categoryConfig[loc.category];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center md:hidden"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {photo && (
          <img
            src={photo.url}
            alt={name}
            className="w-full h-44 object-cover"
            loading="lazy"
          />
        )}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CategoryIcon
              name={config.icon}
              size={16}
              style={{ color: config.color }}
            />
            <span className="text-sm font-heading font-bold text-brand-text truncate">
              {name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {rating && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-text/70">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                {rating.toFixed(1)}
                {enrichment?.totalReviews && (
                  <span className="text-brand-text/40">
                    ({enrichment.totalReviews.toLocaleString()})
                  </span>
                )}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: mob.color + "18", color: mob.color }}
            >
              <CategoryIcon name={mob.icon} size={10} style={{ color: mob.color }} />
              {mob.label}
            </span>
          </div>
          <p className="text-xs text-brand-text/60 leading-relaxed mb-3">
            {summary}
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-brand-text/60 bg-brand-bg rounded-xl cursor-pointer active:bg-brand-border transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Sortable Location Item ───

function SortableLocationItem({
  name,
  dayId,
  onRemove,
  onHover,
  onShowPreview,
  allLocations,
}: {
  name: string;
  dayId: string;
  onRemove: () => void;
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
  } = useSortable({ id: `${dayId}::${name}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex items-center gap-2.5 px-2.5 py-2.5 bg-white rounded-xl border border-brand-border
                 hover:border-brand-primary/30 active:bg-brand-bg/50 transition-colors touch-manipulation group"
    >
      <button
        {...attributes}
        {...listeners}
        className="relative z-20 cursor-grab active:cursor-grabbing text-brand-text/30 hover:text-brand-text/50 flex-shrink-0 p-2 -m-1"
        aria-label={`Reorder ${name}`}
      >
        <GripVertical size={16} />
      </button>
      {config && (
        <CategoryIcon
          name={config.icon}
          size={14}
          style={{ color: config.color }}
          className="flex-shrink-0"
        />
      )}
      <span className="text-[13px] text-brand-text truncate flex-1">
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
          onClick={() => onShowPreview(name)}
          className="relative z-20 text-brand-text/30 hover:text-brand-primary active:text-brand-primary/80 transition-colors flex-shrink-0 cursor-pointer p-2 -m-1 md:hidden"
          aria-label={`Preview ${name}`}
        >
          <Info size={14} />
        </button>
      )}
      <button
        onClick={onRemove}
        className="relative z-20 text-brand-text/30 hover:text-red-500 active:text-red-600 transition-colors flex-shrink-0 cursor-pointer p-2 -m-1"
        aria-label={`Remove ${name}`}
      >
        <X size={14} />
      </button>
      <LocationPreview name={name} onHover={onHover} allLocations={allLocations} />
    </div>
  );
}

// ─── Unassigned Location ───

function UnassignedItem({
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
      className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors touch-manipulation group ${
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

// ─── Day Card ───

function DayCard({
  day,
  isActive,
  onActivate,
  onRemoveLocation,
  routeInfo,
  onHoverLocation,
  onShowPreview,
  allLocations,
}: {
  day: DayPlan;
  isActive: boolean;
  onActivate: () => void;
  onRemoveLocation: (name: string) => void;
  routeInfo?: RouteInfo;
  onHoverLocation?: (name: string | null) => void;
  onShowPreview?: (name: string) => void;
  allLocations: Location[];
}) {
  const { setNodeRef } = useSortable({ id: day.id, disabled: true });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 transition-all ${
        isActive
          ? "border-brand-primary/50 bg-brand-bg shadow-sm"
          : "border-brand-border bg-white hover:border-brand-primary/20"
      }`}
    >
      <button
        onClick={onActivate}
        className="w-full flex items-center justify-between px-3 py-3 cursor-pointer touch-manipulation"
        aria-label={`${day.label}: ${day.locationNames.length} stops${routeInfo && routeInfo.totalTime > 0 ? `, ${Math.round(routeInfo.totalTime)} minutes driving` : ""}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-heading font-bold text-brand-text">
            {day.label}
          </span>
          <span className="text-xs bg-brand-border text-brand-text/60 px-2 py-0.5 rounded-full">
            {day.locationNames.length} stops
          </span>
        </div>
        {routeInfo && routeInfo.totalTime > 0 && (
          <div className="flex items-center gap-1 text-xs text-brand-text/50">
            <Car size={12} />
            <span>
              {Math.round(routeInfo.totalTime)} min &middot;{" "}
              {routeInfo.totalDistance.toFixed(1)} km
            </span>
          </div>
        )}
      </button>

      <SortableContext
        items={day.locationNames.map((n) => `${day.id}::${n}`)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`px-2.5 pb-2.5 flex flex-col gap-1.5 min-h-[40px] ${
            day.locationNames.length === 0
              ? "items-center justify-center"
              : ""
          }`}
        >
          {day.locationNames.length === 0 ? (
            <p className="text-xs text-brand-text/60 italic py-1">
              Tap a suggestion below or drag here
            </p>
          ) : (
            day.locationNames.map((name) => (
              <SortableLocationItem
                key={`${day.id}::${name}`}
                name={name}
                dayId={day.id}
                onRemove={() => onRemoveLocation(name)}
                onHover={onHoverLocation}
                onShowPreview={onShowPreview}
                allLocations={allLocations}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Per-leg breakdown when active */}
      {isActive && routeInfo && routeInfo.legs.length > 0 && (
        <div className="px-3 pb-3 border-t border-brand-primary/10 pt-2">
          <p className="text-[11px] uppercase tracking-wider text-brand-primary/60 font-semibold mb-1.5">
            Round-trip from hotel
          </p>
          {routeInfo.legs.map((leg, i) => {
            const isHotelLeg =
              leg.from === "C Mauritius (Hotel)" ||
              leg.to === "C Mauritius (Hotel)";
            const displayFrom =
              leg.from === "C Mauritius (Hotel)" ? "Hotel" : leg.from;
            const displayTo =
              leg.to === "C Mauritius (Hotel)" ? "Hotel" : leg.to;
            return (
              <div
                key={i}
                className={`flex items-center gap-1.5 text-xs py-0.5 ${
                  isHotelLeg
                    ? "text-[#f43f5e]/80"
                    : "text-brand-text/60"
                }`}
              >
                <span className="truncate max-w-[100px] font-medium">
                  {displayFrom}
                </span>
                <span className="text-brand-text/50 flex-shrink-0">&rarr;</span>
                <span className="truncate max-w-[100px] font-medium">
                  {displayTo}
                </span>
                <span className="ml-auto text-brand-text/40 flex-shrink-0 tabular-nums">
                  {leg.distance.toFixed(1)} km &middot; {Math.round(leg.time)} min
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Day Planner ───

export default function DayPlanner({
  allLocations,
  days,
  onDaysChange,
  activeDayId,
  onActiveDayChange,
  routeInfos,
  compact,
  onHoverLocation,
}: DayPlannerProps) {
  const hotelLoc = allLocations.find((l) => l.name === HOTEL_NAME);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>("region");
  const [previewLocation, setPreviewLocation] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Auto-activate Day 1 in compact mode if nothing is active
  const effectiveActiveDayId =
    compact && !activeDayId ? days[0]?.id ?? null : activeDayId;

  // Compute unassigned locations (exclude hotel — route always starts/ends there)
  const assignedNames = new Set(days.flatMap((d) => d.locationNames));
  const unassigned = allLocations.filter(
    (l) => !assignedNames.has(l.name) && l.category !== "hotel"
  );

  // Reference locations for distance suggestions
  const activeDay = days.find((d) => d.id === effectiveActiveDayId);
  const activeDayLocs = (activeDay?.locationNames ?? [])
    .map((n) => allLocations.find((l) => l.name === n))
    .filter(Boolean) as Location[];

  // When day is empty but active, use hotel as reference
  const referenceLocations =
    activeDayLocs.length > 0
      ? activeDayLocs
      : effectiveActiveDayId && hotelLoc
        ? [hotelLoc]
        : [];

  const hasReferences = referenceLocations.length > 0;

  // Distance from each unassigned location to nearest reference
  const distanceMap = new Map<string, number>();
  if (hasReferences) {
    for (const loc of unassigned) {
      distanceMap.set(loc.name, nearestDistance(loc, referenceLocations));
    }
  }

  // Top 5 nearest as suggestions
  const nearbyItems = hasReferences
    ? [...unassigned].sort(
        (a, b) =>
          (distanceMap.get(a.name) ?? 0) - (distanceMap.get(b.name) ?? 0)
      ).slice(0, 5)
    : [];
  const nearbyNames = new Set(nearbyItems.map((l) => l.name));

  // Remaining items grouped by geographic region or category
  const remainingUnassigned = unassigned.filter(
    (l) => !nearbyNames.has(l.name)
  );
  const remainingByRegion = remainingUnassigned.reduce(
    (acc, loc) => {
      const region = getRegion(loc.lat, loc.lng);
      if (!acc[region]) acc[region] = [];
      acc[region]!.push(loc);
      return acc;
    },
    {} as Partial<Record<Region, Location[]>>
  );
  const remainingByCategory = remainingUnassigned.reduce(
    (acc, loc) => {
      if (!acc[loc.category]) acc[loc.category] = [];
      acc[loc.category]!.push(loc);
      return acc;
    },
    {} as Partial<Record<LocationCategory, Location[]>>
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
      : [overStr, null];

    const isFromUnassigned = activeDayOrPool === "unassigned";
    const isDroppingOnDay =
      overStr.startsWith("day-") && !overStr.includes("::");

    const newDays = days.map((d) => ({
      ...d,
      locationNames: [...d.locationNames],
    }));

    if (isFromUnassigned && activeName) {
      const targetDayId = isDroppingOnDay ? overStr : overDayOrPool;
      const targetDay = newDays.find((d) => d.id === targetDayId);
      if (targetDay && !targetDay.locationNames.includes(activeName)) {
        if (overName) {
          const overIndex = targetDay.locationNames.indexOf(overName);
          targetDay.locationNames.splice(overIndex, 0, activeName);
        } else {
          targetDay.locationNames.push(activeName);
        }
        onDaysChange(newDays);
        if (targetDayId) onActiveDayChange(targetDayId);
      }
    } else if (activeDayOrPool && activeName) {
      const sourceDay = newDays.find((d) => d.id === activeDayOrPool);
      const targetDayId = isDroppingOnDay ? overStr : overDayOrPool;
      const targetDay = newDays.find((d) => d.id === targetDayId);

      if (sourceDay && targetDay) {
        sourceDay.locationNames = sourceDay.locationNames.filter(
          (n) => n !== activeName
        );

        if (sourceDay.id === targetDay.id && overName) {
          const items = [...sourceDay.locationNames];
          const overIndex = items.indexOf(overName);
          items.splice(
            overIndex >= 0 ? overIndex : items.length,
            0,
            activeName
          );
          sourceDay.locationNames = items;
        } else {
          if (overName) {
            const overIndex = targetDay.locationNames.indexOf(overName);
            targetDay.locationNames.splice(overIndex, 0, activeName);
          } else {
            targetDay.locationNames.push(activeName);
          }
        }
        onDaysChange(newDays);
        if (targetDayId) onActiveDayChange(targetDayId);
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

  function addToActiveDay(name: string) {
    const targetId = compact ? effectiveActiveDayId : activeDayId;
    if (!targetId) return;
    const newDays = days.map((d) =>
      d.id === targetId && !d.locationNames.includes(name)
        ? { ...d, locationNames: [...d.locationNames, name] }
        : d
    );
    onDaysChange(newDays);
    // In compact mode, ensure the day is activated
    if (compact && !activeDayId) onActiveDayChange(targetId);
  }

  function resetAll() {
    if (confirm("Remove all locations from all days?")) {
      onDaysChange(getDefaultDays());
    }
  }

  // Drag overlay item
  const activeItemName = activeId?.includes("::")
    ? activeId.split("::")[1]
    : null;
  const activeLoc = activeItemName
    ? allLocations.find((l) => l.name === activeItemName)
    : null;

  const compactActiveDay = days.find((d) => d.id === effectiveActiveDayId);
  const compactRouteInfo = effectiveActiveDayId
    ? routeInfos[effectiveActiveDayId]
    : undefined;

  // Shared unassigned pool renderer
  const unassignedPool = unassigned.length > 0 && (
    <SortableContext
      items={unassigned.map((l) => `unassigned::${l.name}`)}
      strategy={verticalListSortingStrategy}
    >
      {/* Nearby suggestions */}
      {nearbyItems.length > 0 && (
        <div>
          <div className="px-4 py-2.5">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary/60">
              {activeDayLocs.length > 0
                ? "Nearby your stops"
                : "Closest to hotel"}
            </span>
          </div>
          <div className="px-3 pb-2.5 space-y-1.5">
            {nearbyItems.map((loc) => (
              <UnassignedItem
                key={loc.name}
                name={loc.name}
                distance={distanceMap.get(loc.name)}
                onAdd={() => addToActiveDay(loc.name)}
                highlighted
                onHover={onHoverLocation}
                onShowPreview={setPreviewLocation}
                allLocations={allLocations}
              />
            ))}
          </div>
        </div>
      )}

      {/* Remaining by region or category */}
      {remainingUnassigned.length > 0 && (
        <div
          className={
            nearbyItems.length > 0 ? "border-t border-brand-border" : ""
          }
        >
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-text/40">
              {hasReferences
                ? `All locations (${remainingUnassigned.length})`
                : `Unassigned (${unassigned.length})`}
            </span>
            <div className="flex bg-brand-bg rounded-md p-0.5">
              <button
                onClick={() => setGroupMode("region")}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer touch-manipulation ${
                  groupMode === "region"
                    ? "bg-white shadow-sm text-brand-text"
                    : "text-brand-text/40"
                }`}
                aria-label="Group by region"
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
                aria-label="Group by category"
              >
                <LayoutGrid size={10} />
                Category
              </button>
            </div>
          </div>
          <div className={`px-3 pb-4 space-y-3 ${compact ? "" : "max-h-[250px] overflow-y-auto"}`}>
            {groupMode === "region"
              ? REGION_ORDER.filter((r) => remainingByRegion[r]).map(
                  (region) => (
                    <div key={region}>
                      <p className="text-xs text-brand-text/40 font-medium mb-1.5 px-1">
                        {regionConfig[region].icon}{" "}
                        {regionConfig[region].label}
                        <span className="text-brand-text/50 ml-1">
                          ({remainingByRegion[region]!.length})
                        </span>
                      </p>
                      <div className="space-y-1.5">
                        {remainingByRegion[region]!.map((loc) => (
                          <UnassignedItem
                            key={loc.name}
                            name={loc.name}
                            distance={distanceMap.get(loc.name)}
                            onAdd={
                              activeDayId ||
                              (compact && effectiveActiveDayId)
                                ? () => addToActiveDay(loc.name)
                                : undefined
                            }
                            onHover={onHoverLocation}
                            onShowPreview={setPreviewLocation}
                            allLocations={allLocations}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )
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
                        <UnassignedItem
                          key={loc.name}
                          name={loc.name}
                          distance={distanceMap.get(loc.name)}
                          onAdd={
                            activeDayId ||
                            (compact && effectiveActiveDayId)
                              ? () => addToActiveDay(loc.name)
                              : undefined
                          }
                          onHover={onHoverLocation}
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
  );

  // Drag overlay (shared)
  const dragOverlay = (
    <DragOverlay>
      {activeLoc && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border-2 border-brand-primary shadow-lg">
          <CategoryIcon
            name={categoryConfig[activeLoc.category].icon}
            size={12}
            style={{
              color: categoryConfig[activeLoc.category].color,
            }}
          />
          <span className="text-xs text-brand-text">{activeLoc.name}</span>
        </div>
      )}
    </DragOverlay>
  );

  // ─── Compact layout (mobile bottom sheet) ───
  // Parent (BottomSheet) owns the scroll; we use sticky tabs.
  if (compact) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Header + sticky day tabs */}
        <div className="sticky top-0 z-10 bg-white border-b border-brand-border/50">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary/60">
              7-Day Planner
            </span>
            <button
              onClick={resetAll}
              className="text-xs text-brand-text/40 hover:text-red-500 active:text-red-600 font-medium flex items-center gap-1 cursor-pointer p-2 -m-1 py-1.5 touch-manipulation"
              aria-label="Reset all days"
            >
              <RotateCcw size={12} />
              Reset
            </button>
          </div>

          {/* Horizontal day tabs */}
          <div className="flex gap-2 px-4 pb-2.5 overflow-x-auto">
            {days.map((day, i) => {
              const isActive = effectiveActiveDayId === day.id;
              const hasStops = day.locationNames.length > 0;
              return (
                <button
                  key={day.id}
                  onClick={() => onActiveDayChange(day.id)}
                  aria-label={`Day ${i + 1}: ${day.locationNames.length} stops`}
                  aria-pressed={isActive}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all cursor-pointer touch-manipulation ${
                    isActive
                      ? "bg-brand-primary text-white shadow-sm"
                      : hasStops
                        ? "bg-brand-bg text-brand-text border border-brand-border"
                        : "bg-brand-bg/50 text-brand-text/50 border border-transparent"
                  }`}
                >
                  D{i + 1}
                  {hasStops && (
                    <span
                      className={`text-[11px] min-w-[18px] text-center px-1 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-brand-border text-brand-text/60"
                      }`}
                    >
                      {day.locationNames.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active day content */}
        {compactActiveDay && (
          <div className="px-3 py-2">
            <SortableContext
              items={compactActiveDay.locationNames.map(
                (n) => `${compactActiveDay.id}::${n}`
              )}
              strategy={verticalListSortingStrategy}
            >
              <div
                className={`flex flex-col gap-1.5 min-h-[44px] ${
                  compactActiveDay.locationNames.length === 0
                    ? "items-center justify-center"
                    : ""
                }`}
              >
                {compactActiveDay.locationNames.length === 0 ? (
                  <p className="text-[13px] text-brand-text/60 italic py-3">
                    Tap a suggestion below to add stops
                  </p>
                ) : (
                  compactActiveDay.locationNames.map((name) => (
                    <SortableLocationItem
                      key={`${compactActiveDay.id}::${name}`}
                      name={name}
                      dayId={compactActiveDay.id}
                      onRemove={() =>
                        removeFromDay(compactActiveDay.id, name)
                      }
                      onHover={onHoverLocation}
                      onShowPreview={setPreviewLocation}
                      allLocations={allLocations}
                    />
                  ))
                )}
              </div>
            </SortableContext>

            {/* Route info summary */}
            {compactRouteInfo && compactRouteInfo.totalTime > 0 && (
              <div className="mt-3 pt-2.5 border-t border-brand-primary/10">
                {compactRouteInfo.legs.map((leg, i) => {
                  const isHotelLeg =
                    leg.from === HOTEL_NAME || leg.to === HOTEL_NAME;
                  const displayFrom =
                    leg.from === HOTEL_NAME ? "Hotel" : leg.from;
                  const displayTo =
                    leg.to === HOTEL_NAME ? "Hotel" : leg.to;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-1.5 text-xs py-0.5 ${
                        isHotelLeg
                          ? "text-[#f43f5e]/80"
                          : "text-brand-text/60"
                      }`}
                    >
                      <span className="truncate max-w-[100px] font-medium">
                        {displayFrom}
                      </span>
                      <span className="text-brand-text/50 flex-shrink-0">
                        &rarr;
                      </span>
                      <span className="truncate max-w-[100px] font-medium">
                        {displayTo}
                      </span>
                      <span className="ml-auto text-brand-text/40 flex-shrink-0 tabular-nums">
                        {leg.distance.toFixed(1)} km &middot; {Math.round(leg.time)} min
                      </span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-primary/10 text-[13px] font-medium text-brand-primary">
                  <span className="flex items-center gap-1.5">
                    <Car size={13} /> Round-trip
                  </span>
                  <span>
                    {Math.round(compactRouteInfo.totalTime)} min &middot;{" "}
                    {compactRouteInfo.totalDistance.toFixed(1)} km
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suggestions + unassigned pool */}
        {unassigned.length > 0 && (
          <div className="border-t border-brand-border bg-brand-bg/50">
            {unassignedPool}
          </div>
        )}

        {dragOverlay}
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

  // ─── Desktop layout (sidebar) ───
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-primary/60">
            7-Day Planner
          </span>
          <button
            onClick={resetAll}
            className="text-xs text-brand-text/40 hover:text-red-500 font-medium flex items-center gap-1 cursor-pointer p-2 -m-1 py-1.5 touch-manipulation"
            aria-label="Reset all days"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>

        {/* Day cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
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
              onHoverLocation={onHoverLocation}
              onShowPreview={setPreviewLocation}
              allLocations={allLocations}
            />
          ))}
        </div>

        {/* Unassigned pool */}
        {unassigned.length > 0 && (
          <div className="border-t border-brand-border bg-brand-bg/50">
            {unassignedPool}
          </div>
        )}
      </div>

      {dragOverlay}
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
