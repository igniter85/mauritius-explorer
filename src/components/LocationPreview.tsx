"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Star } from "lucide-react";
import {
  categoryConfig,
  mobilityConfig,
  type Location,
  type PlaceEnrichment,
} from "@/data/locations";
import CategoryIcon from "./CategoryIcon";
import placesData from "@/data/places-data.json";

const enrichedData: Record<string, PlaceEnrichment> =
  placesData as unknown as Record<string, PlaceEnrichment>;

// ─── Desktop Hover Preview ───

export function LocationPreview({
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
          // Position to the right, or left if not enough space
          const leftPos = rect.right + 12;
          const fitsRight = leftPos + 260 < window.innerWidth;
          setPos({
            top: Math.min(rect.top, window.innerHeight - 260),
            left: fitsRight ? leftPos : rect.left - 260 - 12,
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

export function MobilePreviewCard({
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
