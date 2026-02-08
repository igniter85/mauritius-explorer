"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, RefreshCw, Star, Loader2, ChevronLeft, MapPinned, ExternalLink, Clock, Phone, Globe, MessageCircle, Plus, Check } from "lucide-react";
import {
  type UserLocation,
  type DiscoverRadius,
  type DiscoveredPlace,
  type DiscoverCategory,
  type PlaceDetails,
  type PlaceReview,
  discoverCategoryConfig,
  getDiscoverCategory,
  getTypeBadgeLabel,
} from "@/lib/discover-types";
import { haversine } from "@/lib/haversine";
import {
  categoryConfig,
  mobilityConfig,
  type Location,
} from "@/data/locations";
import CategoryIcon from "./CategoryIcon";

interface DiscoverPanelProps {
  allLocations: Location[];
  userLocation: UserLocation | null;
  userLocationError: string | null;
  userLocationLoading: boolean;
  onRequestLocation: () => void;
  radius: DiscoverRadius;
  onRadiusChange: (r: DiscoverRadius) => void;
  discoveredPlaces: DiscoveredPlace[];
  discoverLoading: boolean;
  discoverError: string | null;
  onRefresh: () => void;
  onSelectCuratedLocation: (name: string) => void;
  onSelectDiscoveredPlace: (place: DiscoveredPlace) => void;
  onDeselectDiscoveredPlace: () => void;
  selectedDiscoveredPlaceId: string | null;
  onHoverDiscoveredPlace?: (id: string | null) => void;
  authToken?: string;
  compact?: boolean;
  onAddToMyPlaces?: (place: DiscoveredPlace, details?: PlaceDetails | null) => void;
  allLocationNames?: Set<string>;
}

const RADII: DiscoverRadius[] = [2, 5, 10];

export default function DiscoverPanel({
  allLocations,
  userLocation,
  userLocationError,
  userLocationLoading,
  onRequestLocation,
  radius,
  onRadiusChange,
  discoveredPlaces,
  discoverLoading,
  discoverError,
  onRefresh,
  onSelectCuratedLocation,
  onSelectDiscoveredPlace,
  onDeselectDiscoveredPlace,
  selectedDiscoveredPlaceId,
  onHoverDiscoveredPlace,
  authToken,
  compact,
  onAddToMyPlaces,
  allLocationNames,
}: DiscoverPanelProps) {
  // No location yet
  if (!userLocation && !userLocationLoading) {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 ${compact ? "px-6 py-10" : "px-6 py-16"}`}>
        <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center">
          <Navigation size={24} className="text-brand-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-heading font-bold text-brand-text mb-1">
            Enable Location
          </p>
          <p className="text-xs text-brand-text/50 leading-relaxed max-w-[240px]">
            Allow location access to discover nearby curated spots and new places around you.
          </p>
        </div>
        {userLocationError && (
          <p className="text-xs text-red-500 text-center max-w-[240px]">
            {userLocationError}
          </p>
        )}
        <button
          onClick={onRequestLocation}
          className="px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-xl shadow-sm hover:bg-brand-primary/90 active:bg-brand-primary/80 transition-colors cursor-pointer touch-manipulation"
        >
          Share My Location
        </button>
      </div>
    );
  }

  // Loading location
  if (userLocationLoading && !userLocation) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 size={24} className="text-brand-primary animate-spin" />
        <p className="text-xs text-brand-text/50">Getting your location...</p>
      </div>
    );
  }

  if (!userLocation) return null;

  // Show detail view if a discovered place is selected
  const selectedPlace = selectedDiscoveredPlaceId
    ? discoveredPlaces.find((p) => p.id === selectedDiscoveredPlaceId)
    : null;

  if (selectedPlace) {
    return (
      <div className={compact ? "px-4 py-3" : "px-4 py-3"}>
        <button
          onClick={onDeselectDiscoveredPlace}
          className="flex items-center gap-1 text-xs font-medium text-brand-primary mb-3 -ml-0.5 py-1 cursor-pointer touch-manipulation"
          aria-label="Back to list"
        >
          <ChevronLeft size={16} />
          All places
        </button>
        <DiscoveredPlaceDetail
          place={selectedPlace}
          authToken={authToken}
          onAddToMyPlaces={onAddToMyPlaces}
          allLocationNames={allLocationNames}
        />
      </div>
    );
  }

  // Curated locations within radius
  const nearbyLocations = allLocations
    .filter((l) => l.category !== "hotel")
    .map((l) => ({
      ...l,
      distanceKm: haversine(userLocation.lat, userLocation.lng, l.lat, l.lng),
    }))
    .filter((l) => l.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Group discovered places by category
  const grouped: Record<DiscoverCategory, DiscoveredPlace[]> = {
    food: [],
    attractions: [],
    practical: [],
  };
  for (const place of discoveredPlaces) {
    const cat = getDiscoverCategory(place.types);
    if (cat) grouped[cat].push(place);
  }

  return (
    <div className={compact ? "" : "pb-4"}>
      {/* Radius toggle */}
      <div className={`px-4 ${compact ? "pt-3 pb-2" : "py-3"}`}>
        <div className="flex bg-brand-bg rounded-lg p-0.5">
          {RADII.map((r) => (
            <button
              key={r}
              onClick={() => onRadiusChange(r)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
                radius === r
                  ? "bg-white shadow-sm text-brand-text"
                  : "text-brand-text/60"
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* Curated spots nearby */}
      <div className="px-4 py-2">
        <p className="text-xs uppercase tracking-wider font-semibold text-brand-primary/60 mb-2">
          Your curated spots nearby
        </p>
        {nearbyLocations.length === 0 ? (
          <p className="text-xs text-brand-text/40 italic py-2">
            No curated spots within {radius} km
          </p>
        ) : (
          <div className="space-y-1.5">
            {nearbyLocations.map((loc) => (
              <CuratedLocationCard
                key={loc.name}
                location={loc}
                distanceKm={loc.distanceKm}
                onSelect={() => onSelectCuratedLocation(loc.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Discovered places */}
      <div className="border-t border-brand-border mt-1">
        <div className="px-4 py-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider font-semibold text-brand-text/60">
            Discovered nearby
          </p>
          {!discoverLoading && (
            <button
              onClick={onRefresh}
              className="text-xs text-brand-text/60 hover:text-brand-primary font-medium flex items-center gap-1 cursor-pointer p-1 -m-1 touch-manipulation"
            >
              <RefreshCw size={11} />
              Refresh
            </button>
          )}
        </div>

        {discoverLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 size={16} className="text-brand-primary animate-spin" />
            <span className="text-xs text-brand-text/50">Searching...</span>
          </div>
        ) : discoverError ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-red-500 mb-2">{discoverError}</p>
            <button
              onClick={onRefresh}
              className="text-xs text-brand-primary font-medium py-2 px-3 cursor-pointer touch-manipulation"
            >
              Try again
            </button>
          </div>
        ) : discoveredPlaces.length === 0 ? (
          <p className="text-xs text-brand-text/40 italic px-4 py-4 text-center">
            No places found nearby. Try a larger radius.
          </p>
        ) : (
          <div className="px-4 space-y-3 pb-4">
            {(
              Object.entries(grouped) as [DiscoverCategory, DiscoveredPlace[]][]
            )
              .filter(([, places]) => places.length > 0)
              .map(([cat, places]) => {
                const config = discoverCategoryConfig[cat];
                return (
                  <div key={cat}>
                    <p className="text-xs text-brand-text/60 font-medium mb-1.5 flex items-center gap-1.5">
                      <CategoryIcon
                        name={config.icon}
                        size={12}
                        style={{ color: config.color }}
                      />
                      {config.label}
                      <span className="text-brand-text/50">
                        ({places.length})
                      </span>
                    </p>
                    <div className="space-y-1.5">
                      {places.map((place) => (
                        <DiscoveredPlaceCard
                          key={place.id}
                          place={place}
                          isSelected={
                            selectedDiscoveredPlaceId === place.id
                          }
                          onSelect={() => onSelectDiscoveredPlace(place)}
                          onHover={onHoverDiscoveredPlace}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail View ───

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
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={13} className="text-amber-500" fill="currentColor" strokeWidth={0} />
      ))}
      {hasHalf && (
        <span className="relative inline-block" style={{ width: 13, height: 13 }}>
          <Star size={13} className="text-brand-border absolute" fill="currentColor" strokeWidth={0} />
          <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
            <Star size={13} className="text-amber-500" fill="currentColor" strokeWidth={0} />
          </span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={13} className="text-brand-border" fill="currentColor" strokeWidth={0} />
      ))}
      <span className="text-xs text-brand-text/60 ml-1 font-medium">{rating.toFixed(1)}</span>
      {totalReviews != null && (
        <span className="text-[11px] text-brand-text/60 ml-0.5">
          ({totalReviews.toLocaleString()})
        </span>
      )}
    </span>
  );
}

function DiscoveredPlaceDetail({
  place,
  authToken,
  onAddToMyPlaces,
  allLocationNames,
}: {
  place: DiscoveredPlace;
  authToken?: string;
  onAddToMyPlaces?: (place: DiscoveredPlace, details?: PlaceDetails | null) => void;
  allLocationNames?: Set<string>;
}) {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  useEffect(() => {
    setDetailsLoading(true);
    setDetails(null);
    setShowAllReviews(false);

    const abortController = new AbortController();

    fetch("/api/discover/details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ placeId: place.id }),
      signal: abortController.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDetails(data);
        setDetailsLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setDetailsLoading(false);
      });

    return () => abortController.abort();
  }, [place.id, authToken]);

  const typeLabel = getTypeBadgeLabel(place.types);
  const cat = getDiscoverCategory(place.types);
  const color = cat ? discoverCategoryConfig[cat].color : "#6b7280";
  const catConfig = cat ? discoverCategoryConfig[cat] : null;

  const googleMapsUrl =
    details?.googleMapsUrl ??
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`;
  const wazeUrl = `https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`;

  const reviews = details?.reviews ?? [];
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  return (
    <div>
      {/* Photo */}
      {place.photoUri ? (
        <img
          src={place.photoUri}
          alt={place.name}
          className="w-full h-[200px] rounded-xl object-cover mb-3"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-[120px] rounded-xl flex items-center justify-center mb-3"
          style={{ backgroundColor: color + "10" }}
        >
          <MapPin size={32} style={{ color }} className="opacity-40" />
        </div>
      )}

      {/* Name */}
      <h3 className="font-heading font-bold text-brand-text text-[15px] leading-tight flex items-center gap-2 mb-2">
        {catConfig && (
          <CategoryIcon
            name={catConfig.icon}
            size={16}
            style={{ color: catConfig.color }}
          />
        )}
        {place.name}
      </h3>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span
          className="inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: color + "18", color }}
        >
          {typeLabel}
        </span>
        {details?.priceLevel && (
          <span className="text-[11px] text-brand-text/50 font-medium">
            {details.priceLevel}
          </span>
        )}
        {place.distanceKm !== undefined && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-bg text-brand-text/60">
            <MapPinned size={10} />
            {place.distanceKm.toFixed(1)} km away
          </span>
        )}
        {details?.openNow !== undefined && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              details.openNow
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {details.openNow ? "Open now" : "Closed"}
          </span>
        )}
      </div>

      {/* Rating */}
      {place.rating && (
        <div className="mb-3">
          <StarRating rating={place.rating} totalReviews={place.userRatingCount} />
        </div>
      )}

      {/* Editorial summary */}
      {details?.editorialSummary && (
        <p className="text-xs text-brand-text/60 italic mb-3 leading-relaxed">
          &ldquo;{details.editorialSummary}&rdquo;
        </p>
      )}

      {/* Address */}
      {place.address && (
        <p className="text-xs text-brand-text/60 leading-relaxed mb-3">
          {place.address}
        </p>
      )}

      {/* Contact & hours */}
      <div className="space-y-1 mb-3">
        {details?.weekdayHours && details.weekdayHours.length > 0 && (
          <p className="text-[11px] text-brand-text/60 flex items-start gap-1.5">
            <Clock size={12} className="text-brand-primary flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {details.weekdayHours.find((h) =>
                h.toLowerCase().startsWith(
                  ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()]
                )
              ) ?? details.weekdayHours[0]}
            </span>
          </p>
        )}
        {details?.phone && (
          <p className="text-[11px] text-brand-text/60 flex items-center gap-1.5">
            <Phone size={12} className="text-brand-primary flex-shrink-0" />
            <a href={`tel:${details.phone}`} className="underline hover:text-brand-primary">
              {details.phone}
            </a>
          </p>
        )}
        {details?.website && (
          <p className="text-[11px] text-brand-text/60 flex items-center gap-1.5">
            <Globe size={12} className="text-brand-primary flex-shrink-0" />
            <a
              href={details.website}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-brand-primary hover:text-brand-primary/80 truncate"
            >
              Website
            </a>
          </p>
        )}
      </div>

      {/* Navigation links */}
      <div className="space-y-1.5 mb-2">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-border/50 active:bg-brand-border transition-colors text-left"
        >
          <MapPin size={14} className="text-brand-primary flex-shrink-0" />
          <span className="text-xs font-medium text-brand-primary flex-1">Open in Google Maps</span>
          <ExternalLink size={11} className="text-brand-text/30" />
        </a>
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-border/50 active:bg-brand-border transition-colors text-left"
        >
          <Navigation size={14} className="text-brand-primary flex-shrink-0" />
          <span className="text-xs font-medium text-brand-primary flex-1">Navigate with Waze</span>
          <ExternalLink size={11} className="text-brand-text/30" />
        </a>
      </div>

      {/* Add to My Places */}
      {onAddToMyPlaces && (
        allLocationNames?.has(place.name) ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 mb-3">
            <Check size={14} className="text-emerald-600 flex-shrink-0" />
            <span className="text-xs font-medium text-emerald-700">Already in your places</span>
          </div>
        ) : (
          <button
            onClick={() => onAddToMyPlaces(place, details)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-medium shadow-sm hover:bg-brand-primary/90 active:bg-brand-primary/80 transition-colors cursor-pointer touch-manipulation mb-3"
          >
            <Plus size={14} />
            Add to My Places
          </button>
        )
      )}

      {/* Reviews */}
      {detailsLoading ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <Loader2 size={14} className="text-brand-primary animate-spin" />
          <span className="text-xs text-brand-text/40">Loading details...</span>
        </div>
      ) : reviews.length > 0 ? (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-text/60 flex items-center gap-1">
              <MessageCircle size={10} />
              Reviews ({reviews.length})
            </span>
            <span className="text-[10px] text-brand-text/50">via Google</span>
          </div>
          {displayedReviews.map((review, i) => (
            <ReviewCard key={i} review={review} />
          ))}
          {reviews.length > 2 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="text-[11px] text-brand-cta hover:text-brand-cta/80 mt-2 py-2 font-medium cursor-pointer"
            >
              {showAllReviews
                ? "Show less"
                : `Show all ${reviews.length} reviews`}
            </button>
          )}
        </div>
      ) : null}

      {/* Source attribution */}
      <p className="text-[10px] text-brand-text/50 text-center mt-4">
        Data from Google Places
      </p>
    </div>
  );
}

function ReviewCard({ review }: { review: PlaceReview }) {
  return (
    <div className="border-t border-brand-border pt-2 mt-2">
      <div className="flex items-center gap-2 mb-1">
        {review.authorPhotoUri ? (
          <img
            src={review.authorPhotoUri}
            alt=""
            className="w-5 h-5 rounded-full"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: "#0EA5E9" }}
          >
            {review.author.charAt(0).toUpperCase()}
          </div>
        )}
        {review.authorUri ? (
          <a
            href={review.authorUri}
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

// ─── List Cards ───

function CuratedLocationCard({
  location,
  distanceKm,
  onSelect,
}: {
  location: Location;
  distanceKm: number;
  onSelect: () => void;
}) {
  const config = categoryConfig[location.category];
  const mob = mobilityConfig[location.mobility];

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-brand-bg hover:bg-brand-border/50 active:bg-brand-border transition-colors cursor-pointer touch-manipulation text-left"
    >
      <CategoryIcon
        name={config.icon}
        size={14}
        style={{ color: config.color }}
        className="flex-shrink-0"
      />
      <span className="text-[13px] text-brand-text truncate flex-1">
        {location.name}
      </span>
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
        style={{ backgroundColor: mob.color + "18" }}
        title={mob.label}
      >
        <CategoryIcon name={mob.icon} size={11} style={{ color: mob.color }} />
      </span>
      {location.rating && (
        <span className="flex items-center gap-0.5 text-xs text-brand-text/50 flex-shrink-0">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          {location.rating.toFixed(1)}
        </span>
      )}
      <span className="text-xs text-brand-text/40 flex-shrink-0 tabular-nums">
        {distanceKm.toFixed(1)} km
      </span>
    </button>
  );
}

function DiscoveredPlaceCard({
  place,
  isSelected,
  onSelect,
  onHover,
}: {
  place: DiscoveredPlace;
  isSelected: boolean;
  onSelect: () => void;
  onHover?: (id: string | null) => void;
}) {
  const typeLabel = getTypeBadgeLabel(place.types);
  const cat = getDiscoverCategory(place.types);
  const color = cat ? discoverCategoryConfig[cat].color : "#6b7280";

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors cursor-pointer touch-manipulation text-left ${
        isSelected
          ? "bg-brand-primary/5 border border-brand-primary/20"
          : "bg-white border border-brand-border hover:border-brand-primary/20"
      }`}
    >
      {place.photoUri ? (
        <img
          src={place.photoUri}
          alt=""
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + "15" }}
        >
          <MapPin size={16} style={{ color }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-brand-text truncate">
          {place.name}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: color + "18", color }}
          >
            {typeLabel}
          </span>
          {place.rating && (
            <span className="flex items-center gap-0.5 text-xs text-brand-text/50">
              <Star size={10} className="text-amber-400 fill-amber-400" />
              {place.rating.toFixed(1)}
              {place.userRatingCount && (
                <span className="text-brand-text/50">
                  ({place.userRatingCount.toLocaleString()})
                </span>
              )}
            </span>
          )}
        </div>
      </div>
      {place.distanceKm !== undefined && (
        <span className="text-xs text-brand-text/40 flex-shrink-0 tabular-nums">
          {place.distanceKm.toFixed(1)} km
        </span>
      )}
    </button>
  );
}
