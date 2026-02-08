"use client";

import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Car, Hotel, Star, ChevronDown, Info } from "lucide-react";
import {
  categoryConfig,
  mobilityConfig,
  type Location,
  type PlaceEnrichment,
} from "@/data/locations";
import CategoryIcon from "./CategoryIcon";
import { LocationPreview } from "./LocationPreview";
import type { RouteInfo } from "./DayPlanner";
import placesData from "@/data/places-data.json";

const enrichedData: Record<string, PlaceEnrichment> =
  placesData as unknown as Record<string, PlaceEnrichment>;

const HOTEL_NAME = "C Mauritius (Hotel)";

// ─── Sortable Stop Card ───

function SortableStopCard({
  name,
  index,
  dayId,
  onRemove,
  onHover,
  onShowPreview,
  allLocations,
}: {
  name: string;
  index: number;
  dayId: string;
  onRemove: () => void;
  onHover?: (name: string | null) => void;
  onShowPreview?: (name: string) => void;
  allLocations: Location[];
}) {
  const loc = allLocations.find((l) => l.name === name);
  const config = loc ? categoryConfig[loc.category] : null;
  const enrichment = enrichedData[name];
  const [expanded, setExpanded] = useState(false);

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

  const photo = enrichment?.photos?.[0];
  const summary = enrichment?.editorialSummary || loc?.notes;
  const rating = enrichment?.googleRating ?? loc?.rating;

  return (
    <div ref={setNodeRef} style={style} className="relative flex items-start gap-0">
      {/* Numbered circle on the timeline */}
      <div className="flex-shrink-0 w-10 flex justify-center pt-3 relative z-10">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
          style={{ backgroundColor: config?.color ?? "#6b7280" }}
        >
          {index + 1}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
        <div className="relative z-20 flex items-center gap-2 px-3 py-2.5">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-brand-text/30 hover:text-brand-text/50 flex-shrink-0 p-1 -m-0.5 touch-manipulation"
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

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer touch-manipulation"
          >
            <span className="text-[13px] font-medium text-brand-text truncate">
              {name}
            </span>
            <ChevronDown
              size={12}
              className={`text-brand-text/30 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>

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
              className="text-brand-text/30 hover:text-brand-primary active:text-brand-primary/80 transition-colors flex-shrink-0 cursor-pointer p-1.5 -m-1 touch-manipulation md:hidden"
              aria-label={`Preview ${name}`}
            >
              <Info size={14} />
            </button>
          )}

          <button
            onClick={onRemove}
            className="text-brand-text/30 hover:text-red-500 active:text-red-600 transition-colors flex-shrink-0 cursor-pointer p-1.5 -m-1 touch-manipulation"
            aria-label={`Remove ${name}`}
          >
            <X size={14} />
          </button>
        </div>

        {/* Expandable detail */}
        {expanded && (
          <div className="px-3 pb-3 border-t border-brand-border/50">
            {photo && (
              <img
                src={photo.url}
                alt={name}
                className="w-full h-32 object-cover rounded-lg mt-2"
                loading="lazy"
              />
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
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
            </div>
            {summary && (
              <p className="text-xs text-brand-text/60 leading-relaxed mt-1.5">
                {summary}
              </p>
            )}
          </div>
        )}

        {/* Desktop hover preview */}
        <LocationPreview name={name} onHover={onHover} allLocations={allLocations} />
      </div>
    </div>
  );
}

// ─── Hotel Bookend ───

function HotelBookend({ label }: { label: string }) {
  return (
    <div className="relative flex items-center gap-0">
      <div className="flex-shrink-0 w-10 flex justify-center relative z-10">
        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#f43f5e] shadow-sm">
          <Hotel size={14} className="text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium text-brand-text/50">{label}</span>
      </div>
    </div>
  );
}

// ─── Route Leg Connector ───

function RouteLegConnector({ distance, time }: { distance: number; time: number }) {
  return (
    <div className="relative flex items-center gap-0 py-0.5">
      <div className="flex-shrink-0 w-10 flex justify-center relative z-10">
        <div className="w-0 h-full" />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-brand-text/40 pl-1">
        <Car size={11} />
        <span className="tabular-nums">{distance.toFixed(1)} km</span>
        <span>&middot;</span>
        <span className="tabular-nums">~{Math.round(time)} min</span>
      </div>
    </div>
  );
}

// ─── Main Timeline ───

interface ItineraryTimelineProps {
  dayId: string;
  locationNames: string[];
  allLocations: Location[];
  routeInfo: RouteInfo | null;
  onRemoveLocation: (name: string) => void;
  onHoverLocation?: (name: string | null) => void;
  onShowPreview?: (name: string) => void;
}

export default function ItineraryTimeline({
  dayId,
  locationNames,
  allLocations,
  routeInfo,
  onRemoveLocation,
  onHoverLocation,
  onShowPreview,
}: ItineraryTimelineProps) {
  const hotelLabel = HOTEL_NAME.replace(" (Hotel)", "");

  // Build leg lookup: leg[i] is the leg from waypoint i to waypoint i+1
  // Waypoints: Hotel, stop0, stop1, ..., Hotel
  const legMap: Record<string, { distance: number; time: number }> = {};
  if (routeInfo?.legs) {
    routeInfo.legs.forEach((leg) => {
      legMap[`${leg.from}→${leg.to}`] = { distance: leg.distance, time: leg.time };
    });
  }

  // Waypoints in order: Hotel, ...stops, Hotel
  const waypoints = [HOTEL_NAME, ...locationNames, HOTEL_NAME];

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div
        className="absolute left-5 top-3 bottom-3 w-px border-l-2 border-dashed border-brand-border"
        style={{ transform: "translateX(-1px)" }}
      />

      <SortableContext
        items={locationNames.map((n) => `${dayId}::${n}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-0.5">
          {/* Hotel start */}
          <HotelBookend label={hotelLabel} />

          {/* Stops with route legs between them */}
          {locationNames.map((name, i) => {
            const legKey = `${waypoints[i]}→${waypoints[i + 1]}`;
            const leg = legMap[legKey];
            return (
              <div key={`${dayId}::${name}`}>
                {leg && <RouteLegConnector distance={leg.distance} time={leg.time} />}
                <SortableStopCard
                  name={name}
                  index={i}
                  dayId={dayId}
                  onRemove={() => onRemoveLocation(name)}
                  onHover={onHoverLocation}
                  onShowPreview={onShowPreview}
                  allLocations={allLocations}
                />
              </div>
            );
          })}

          {/* Last leg + Hotel end */}
          {locationNames.length > 0 && (() => {
            const lastLegKey = `${waypoints[waypoints.length - 2]}→${waypoints[waypoints.length - 1]}`;
            const lastLeg = legMap[lastLegKey];
            return lastLeg ? <RouteLegConnector distance={lastLeg.distance} time={lastLeg.time} /> : null;
          })()}
          <HotelBookend label={hotelLabel} />
        </div>
      </SortableContext>

      {/* Empty state */}
      {locationNames.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-sm text-brand-text/50 italic">
            No stops yet. Add locations below.
          </p>
        </div>
      )}
    </div>
  );
}
