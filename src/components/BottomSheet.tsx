"use client";

import { Drawer } from "vaul";
import { MapPin, Calendar, X, ChevronLeft, Compass, LogOut } from "lucide-react";
import type { Location, LocationCategory } from "@/data/locations";
import type { AppMode } from "./MauritiusMap";
import type { DayPlan, RouteInfo } from "./DayPlanner";
import type {
  UserLocation,
  DiscoverRadius,
  DiscoveredPlace,
  PlaceDetails,
} from "@/lib/discover-types";
import FilterBar from "./FilterBar";
import LocationList from "./LocationList";
import LocationPopup from "./LocationPopup";
import DayPlanner from "./DayPlanner";
import DiscoverPanel from "./DiscoverPanel";

interface BottomSheetProps {
  allLocations: Location[];
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  filteredLocations: Location[];
  activeCategories: Set<LocationCategory>;
  selectedLocation: string | null;
  onToggleCategory: (cat: LocationCategory) => void;
  onToggleAll: () => void;
  onSelectLocation: (name: string | null) => void;
  snap: number | string | null;
  onSnapChange: (snap: number | string | null) => void;
  days: DayPlan[];
  onDaysChange: (days: DayPlan[]) => void;
  activeDayId: string | null;
  onActiveDayChange: (dayId: string | null) => void;
  routeInfos: Record<string, RouteInfo>;
  locationDayMap: Map<string, string>;
  onFitBounds?: () => void;
  // Discover props
  userLocation: UserLocation | null;
  userLocationError: string | null;
  userLocationLoading: boolean;
  onRequestLocation: () => void;
  discoverRadius: DiscoverRadius;
  onDiscoverRadiusChange: (r: DiscoverRadius) => void;
  discoveredPlaces: DiscoveredPlace[];
  discoverLoading: boolean;
  discoverError: string | null;
  onDiscoverRefresh: () => void;
  onSelectDiscoveredPlace: (place: DiscoveredPlace) => void;
  onDeselectDiscoveredPlace: () => void;
  selectedDiscoveredPlaceId: string | null;
  authToken?: string;
  userName?: string;
  onLogout?: () => void;
  onAddDiscoveredPlace?: (place: DiscoveredPlace, details?: PlaceDetails | null) => void;
  onDeleteLocation?: (name: string) => void;
  allLocationNames?: Set<string>;
}

export default function BottomSheet({
  allLocations,
  mode,
  onModeChange,
  filteredLocations,
  activeCategories,
  selectedLocation,
  onToggleCategory,
  onToggleAll,
  onSelectLocation,
  snap,
  onSnapChange,
  days,
  onDaysChange,
  activeDayId,
  onActiveDayChange,
  routeInfos,
  locationDayMap,
  onFitBounds,
  userLocation,
  userLocationError,
  userLocationLoading,
  onRequestLocation,
  discoverRadius,
  onDiscoverRadiusChange,
  discoveredPlaces,
  discoverLoading,
  discoverError,
  onDiscoverRefresh,
  onSelectDiscoveredPlace,
  onDeselectDiscoveredPlace,
  selectedDiscoveredPlaceId,
  authToken,
  userName,
  onLogout,
  onAddDiscoveredPlace,
  onDeleteLocation,
  allLocationNames,
}: BottomSheetProps) {
  const snapPoints = ["148px", 0.5, 1];
  const isExpanded = snap !== "148px" && snap !== null;

  const selectedLoc = selectedLocation
    ? allLocations.find((l) => l.name === selectedLocation) ?? null
    : null;

  const handleCollapse = () => {
    onSnapChange("148px");
    onSelectLocation(null);
    if (mode === "planner") {
      onFitBounds?.();
    }
  };

  const handleBack = () => {
    onSelectLocation(null);
  };

  return (
    <Drawer.Root
      open={true}
      modal={false}
      dismissible={false}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={onSnapChange}
      fadeFromIndex={2}
    >
      <Drawer.Content
        className="fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-3xl shadow-[0_-4px_25px_rgba(0,0,0,0.12)] outline-none flex flex-col"
        style={{
          maxHeight: "100dvh",
        }}
      >
        {/* Gradient accent bar */}
        <div className="h-[3px] rounded-t-3xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-cta" />

        <Drawer.Handle className="mt-2 mb-1" />
        <Drawer.Title className="sr-only">Mauritius Explorer</Drawer.Title>

        {/* Peek header — always visible */}
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-bold text-brand-text flex items-center gap-1.5">
              <MapPin size={16} className="text-brand-primary" />
              Mauritius Explorer
            </h2>
            <span className="flex items-center gap-2">
              {userName && onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 text-[11px] text-brand-text/40 hover:text-brand-text/70 transition-colors cursor-pointer touch-manipulation"
                >
                  {userName}
                  <LogOut size={11} />
                </button>
              )}
              <span className="text-xs text-brand-text/50">
                {mode === "explore"
                  ? `${filteredLocations.length} of ${allLocations.length} spots`
                  : mode === "planner"
                    ? "7-day trip"
                    : "Nearby"}
              </span>
              {isExpanded && (
                <button
                  onClick={handleCollapse}
                  className="flex items-center justify-center w-7 h-7 -mr-1 rounded-full bg-brand-bg hover:bg-brand-border/50 transition-colors cursor-pointer touch-manipulation"
                  aria-label="Minimize drawer"
                >
                  <X size={15} className="text-brand-text/60" />
                </button>
              )}
            </span>
          </div>

          {/* Mode toggle */}
          <div className="flex mt-2 bg-brand-bg rounded-lg p-0.5">
            <button
              onClick={() => onModeChange("explore")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === "explore"
                  ? "bg-white shadow-sm text-brand-text"
                  : "text-brand-text/40"
              }`}
            >
              <MapPin size={12} />
              Explore
            </button>
            <button
              onClick={() => onModeChange("planner")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === "planner"
                  ? "bg-white shadow-sm text-brand-text"
                  : "text-brand-text/40"
              }`}
            >
              <Calendar size={12} />
              Planner
            </button>
            <button
              onClick={() => onModeChange("discover")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === "discover"
                  ? "bg-white shadow-sm text-brand-text"
                  : "text-brand-text/40"
              }`}
            >
              <Compass size={12} />
              Discover
            </button>
          </div>
        </div>

        {/* Content below peek — scrollable */}
        {mode === "explore" ? (
          selectedLoc ? (
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-xs font-medium text-brand-primary mb-3 -ml-0.5 py-1 cursor-pointer touch-manipulation"
                aria-label="Back to list"
              >
                <ChevronLeft size={16} />
                All locations
              </button>
              <LocationPopup location={selectedLoc} variant="sheet" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 pb-8">
              <div className="pb-3 border-b border-brand-border mb-1">
                <FilterBar
                  allLocations={allLocations}
                  activeCategories={activeCategories}
                  onToggleCategory={onToggleCategory}
                  onToggleAll={onToggleAll}
                />
              </div>
              <LocationList
                locations={filteredLocations}
                selectedLocation={selectedLocation}
                onSelectLocation={onSelectLocation}
                locationDayMap={locationDayMap}
                onDeleteLocation={onDeleteLocation}
              />
            </div>
          )
        ) : mode === "planner" ? (
          <div className="flex-1 overflow-y-auto min-h-0 pb-8">
            <DayPlanner
              allLocations={allLocations}
              days={days}
              onDaysChange={onDaysChange}
              activeDayId={activeDayId}
              onActiveDayChange={onActiveDayChange}
              routeInfos={routeInfos}
              compact
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 pb-8">
            <DiscoverPanel
              allLocations={allLocations}
              userLocation={userLocation}
              userLocationError={userLocationError}
              userLocationLoading={userLocationLoading}
              onRequestLocation={onRequestLocation}
              radius={discoverRadius}
              onRadiusChange={onDiscoverRadiusChange}
              discoveredPlaces={discoveredPlaces}
              discoverLoading={discoverLoading}
              discoverError={discoverError}
              onRefresh={onDiscoverRefresh}
              onSelectCuratedLocation={(name) => onSelectLocation(name)}
              onSelectDiscoveredPlace={onSelectDiscoveredPlace}
              onDeselectDiscoveredPlace={onDeselectDiscoveredPlace}
              selectedDiscoveredPlaceId={selectedDiscoveredPlaceId}
              authToken={authToken}
              compact
              onAddToMyPlaces={onAddDiscoveredPlace}
              allLocationNames={allLocationNames}
            />
          </div>
        )}
      </Drawer.Content>
    </Drawer.Root>
  );
}
