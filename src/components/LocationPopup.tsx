"use client";

import { useState, useRef, useCallback } from "react";
import {
  Clock,
  Phone,
  Globe,
  MessageCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Navigation,
  Accessibility,
} from "lucide-react";
import {
  categoryConfig,
  mobilityConfig,
  type Location,
  type ReviewData,
  type PlaceEnrichment,
  type AccessibilityOptions,
} from "@/data/locations";
import CategoryIcon from "./CategoryIcon";
import placesData from "@/data/places-data.json";

const enrichedData: Record<string, PlaceEnrichment> =
  placesData as unknown as Record<string, PlaceEnrichment>;

function StarRating({
  rating,
  totalReviews,
}: {
  rating: number;
  totalReviews?: number;
}) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.3;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} stars`}
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={`f${i}`}
          size={12}
          className="text-amber-500"
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
      {hasHalf && (
        <span
          className="relative inline-block"
          style={{ width: 12, height: 12 }}
        >
          <Star
            size={12}
            className="text-brand-border absolute"
            fill="currentColor"
            strokeWidth={0}
          />
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: "50%" }}
          >
            <Star
              size={12}
              className="text-amber-500"
              fill="currentColor"
              strokeWidth={0}
            />
          </span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star
          key={`e${i}`}
          size={12}
          className="text-brand-border"
          fill="currentColor"
          strokeWidth={0}
        />
      ))}
      <span className="text-xs text-brand-text/60 ml-1 font-medium">
        {rating}
      </span>
      {totalReviews != null && (
        <span className="text-[11px] text-brand-text/40 ml-0.5">
          ({totalReviews.toLocaleString()})
        </span>
      )}
    </span>
  );
}

function PhotoCarousel({
  photos,
  locationName,
  variant = "popup",
}: {
  photos: PlaceEnrichment["photos"];
  locationName: string;
  variant?: "popup" | "sheet";
}) {
  const [activePhoto, setActivePhoto] = useState(0);
  const isSheet = variant === "sheet";

  // Touch swipe support
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    swiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStart.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
    // Lock horizontal swipe once detected (prevents drawer from capturing)
    if (dx > 10 && dx > dy) {
      swiping.current = true;
      e.stopPropagation();
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current || photos.length <= 1) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      if (Math.abs(dx) > 40) {
        if (dx < 0) {
          setActivePhoto((p) => (p + 1) % photos.length);
        } else {
          setActivePhoto((p) => (p - 1 + photos.length) % photos.length);
        }
      }
      touchStart.current = null;
      swiping.current = false;
    },
    [photos.length]
  );

  return (
    <div
      className={`relative mb-3 overflow-hidden ${
        isSheet ? "-mx-4" : "-mx-4 -mt-[14px]"
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img
        src={photos[activePhoto].url}
        alt={`${locationName} — photo ${activePhoto + 1} of ${photos.length}`}
        className={`w-full object-cover select-none ${
          isSheet ? "h-[260px]" : "h-[160px]"
        }`}
        draggable={false}
        loading="lazy"
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={() =>
              setActivePhoto(
                (activePhoto - 1 + photos.length) % photos.length
              )
            }
            className={`absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer touch-manipulation ${
              isSheet ? "w-9 h-9" : "w-7 h-7"
            }`}
            aria-label="Previous photo"
          >
            <ChevronLeft size={isSheet ? 20 : 16} />
          </button>
          <button
            onClick={() =>
              setActivePhoto((activePhoto + 1) % photos.length)
            }
            className={`absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center cursor-pointer touch-manipulation ${
              isSheet ? "w-9 h-9" : "w-7 h-7"
            }`}
            aria-label="Next photo"
          >
            <ChevronRight size={isSheet ? 20 : 16} />
          </button>
          {/* Photo counter (sheet) or dot indicators (popup) */}
          {isSheet ? (
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
              {activePhoto + 1} / {photos.length}
            </span>
          ) : (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`rounded-full transition-all cursor-pointer w-1.5 h-1.5 ${
                    i === activePhoto
                      ? "bg-white scale-125"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
      <span className="absolute bottom-2 right-2 text-[8px] text-white/70 bg-black/30 px-1.5 py-0.5 rounded">
        {photos[activePhoto].attribution}
      </span>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewData }) {
  return (
    <div className="border-t border-brand-border pt-2 mt-2">
      <div className="flex items-center gap-2 mb-1">
        {review.profilePhoto ? (
          <img
            src={review.profilePhoto}
            alt=""
            className="w-5 h-5 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: "#0EA5E9" }}
          >
            {review.author.charAt(0).toUpperCase()}
          </div>
        )}
        {review.googleMapsAuthorUrl ? (
          <a
            href={review.googleMapsAuthorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-medium text-brand-text hover:underline"
          >
            {review.author}
          </a>
        ) : (
          <span className="text-[11px] font-medium text-brand-text">
            {review.author}
          </span>
        )}
        <span className="text-[10px] text-brand-text/40 ml-auto">
          {review.timeAgo}
        </span>
      </div>
      <div className="flex items-center gap-0.5 mb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={10}
            className={
              i < review.rating ? "text-amber-500" : "text-brand-border"
            }
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </div>
      {review.text && (
        <p className="text-[11px] text-brand-text/50 leading-relaxed line-clamp-3">
          {review.text}
        </p>
      )}
    </div>
  );
}

const wheelchairLabels: Record<keyof AccessibilityOptions, string> = {
  wheelchairAccessibleEntrance: "Entrance",
  wheelchairAccessibleParking: "Parking",
  wheelchairAccessibleRestroom: "Restroom",
  wheelchairAccessibleSeating: "Seating",
};

function WheelchairBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full">
      <Accessibility size={10} />
      {label}
    </span>
  );
}

export default function LocationPopup({
  location,
  variant = "popup",
}: {
  location: Location;
  variant?: "popup" | "sheet";
}) {
  const config = categoryConfig[location.category];
  const enrichment = enrichedData[location.name];
  const photos = enrichment?.photos ?? [];
  const reviews = enrichment?.reviews ?? [];
  const [showAllReviews, setShowAllReviews] = useState(false);
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  // Use Google rating if available, fall back to editorial rating
  const displayRating = enrichment?.googleRating ?? location.rating;

  return (
    <div
      className={
        variant === "popup"
          ? `min-w-[260px] max-w-[300px]${photos.length === 0 ? " pt-3.5" : ""}`
          : photos.length === 0
            ? "pt-1"
            : ""
      }
    >
      {photos.length > 0 && (
        <PhotoCarousel
          photos={photos}
          locationName={location.name}
          variant={variant}
        />
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-heading font-bold text-brand-text text-sm leading-tight flex items-center gap-1.5">
          <CategoryIcon
            name={config.icon}
            size={16}
            style={{ color: config.color }}
          />
          {location.name}
        </h3>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span
          className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: config.color + "18",
            color: config.color,
          }}
        >
          {config.label}
        </span>
        {(() => {
          const mob = mobilityConfig[location.mobility];
          return (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
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
        {enrichment?.priceLevel && (
          <span className="text-[11px] text-brand-text/50 font-medium">
            {enrichment.priceLevel}
          </span>
        )}
      </div>
      {(() => {
        const mob = mobilityConfig[location.mobility];
        return (
          <p className="text-[11px] text-brand-text/50 mb-2" style={{ color: mob.color }}>
            {mob.description}
          </p>
        );
      })()}
      {enrichment?.accessibilityOptions && (
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {(Object.entries(enrichment.accessibilityOptions) as [keyof AccessibilityOptions, boolean][])
            .filter(([, val]) => val)
            .map(([key]) => (
              <WheelchairBadge key={key} label={wheelchairLabels[key]} />
            ))}
        </div>
      )}

      {displayRating && (
        <div className="mb-2">
          <StarRating
            rating={displayRating}
            totalReviews={enrichment?.totalReviews}
          />
        </div>
      )}

      {enrichment?.editorialSummary && (
        <p className="text-xs text-brand-text/60 italic mb-2 leading-relaxed">
          &ldquo;{enrichment.editorialSummary}&rdquo;
        </p>
      )}

      <p className="text-xs text-brand-text/70 leading-relaxed mb-2">
        {location.notes}
      </p>

      {location.hours && (
        <p className="text-[11px] text-brand-text/60 flex items-center gap-1.5">
          <Clock size={12} className="text-brand-primary flex-shrink-0" />
          {location.hours}
        </p>
      )}
      {location.phone && (
        <p className="text-[11px] text-brand-text/60 flex items-center gap-1.5">
          <Phone size={12} className="text-brand-primary flex-shrink-0" />
          <a
            href={`tel:${location.phone}`}
            className="underline hover:text-brand-primary"
          >
            {location.phone}
          </a>
        </p>
      )}
      {location.website && (
        <p className="text-[11px] text-brand-text/60 flex items-center gap-1.5">
          <Globe size={12} className="text-brand-primary flex-shrink-0" />
          <a
            href={location.website}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-brand-primary hover:text-brand-primary/80"
          >
            Website
          </a>
        </p>
      )}
      {enrichment?.googleMapsUrl && (
        <p className="text-[11px] text-brand-text/60 flex items-center gap-1.5">
          <MapPin size={12} className="text-brand-primary flex-shrink-0" />
          <a
            href={enrichment.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-brand-primary hover:text-brand-primary/80"
          >
            Open in Google Maps
          </a>
        </p>
      )}
      <p className="text-[11px] text-brand-text/60 flex items-center gap-1.5">
        <Navigation size={12} className="text-brand-primary flex-shrink-0" />
        <a
          href={`https://waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-brand-primary hover:text-brand-primary/80"
        >
          Navigate with Waze
        </a>
      </p>

      {reviews.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-text/40 flex items-center gap-1">
              <MessageCircle size={10} />
              Reviews ({reviews.length})
            </span>
            <span className="text-[9px] text-brand-text/30">via Google</span>
          </div>
          {displayedReviews.map((review, i) => (
            <ReviewCard key={i} review={review} />
          ))}
          {reviews.length > 2 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="text-[11px] text-brand-cta hover:text-brand-cta/80 mt-2 font-medium cursor-pointer"
            >
              {showAllReviews
                ? "Show less"
                : `Show all ${reviews.length} reviews`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
