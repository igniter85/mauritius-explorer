"use client";

import { useState } from "react";
import { MapPin, Calendar, ChevronLeft, Menu, Hotel, Compass, LogOut } from "lucide-react";
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
import DayPlanner from "./DayPlanner";
import DiscoverPanel from "./DiscoverPanel";

interface SidebarProps {
  allLocations: Location[];
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  filteredLocations: Location[];
  activeCategories: Set<LocationCategory>;
  selectedLocation: string | null;
  onToggleCategory: (cat: LocationCategory) => void;
  onToggleAll: () => void;
  onSelectLocation: (name: string | null) => void;
  days: DayPlan[];
  onDaysChange: (days: DayPlan[]) => void;
  activeDayId: string | null;
  onActiveDayChange: (dayId: string | null) => void;
  routeInfos: Record<string, RouteInfo>;
  onHoverLocation?: (name: string | null) => void;
  locationDayMap: Map<string, string>;
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
  onHoverDiscoveredPlace?: (id: string | null) => void;
  authToken?: string;
  userName?: string;
  onLogout?: () => void;
  onAddDiscoveredPlace?: (place: DiscoveredPlace, details?: PlaceDetails | null) => void;
  onDeleteLocation?: (name: string) => void;
  allLocationNames?: Set<string>;
}

export default function Sidebar({
  allLocations,
  mode,
  onModeChange,
  filteredLocations,
  activeCategories,
  selectedLocation,
  onToggleCategory,
  onToggleAll,
  onSelectLocation,
  days,
  onDaysChange,
  activeDayId,
  onActiveDayChange,
  routeInfos,
  onHoverLocation,
  locationDayMap,
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
  onHoverDiscoveredPlace,
  authToken,
  userName,
  onLogout,
  onAddDiscoveredPlace,
  onDeleteLocation,
  allLocationNames,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={`
          ${collapsed ? "w-0" : "w-[340px]"}
          transition-all duration-300 ease-in-out overflow-hidden
          bg-white border-r border-brand-border flex-shrink-0 flex flex-col
        `}
      >
        {/* Gradient accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-cta" />

        <div className="p-5 border-b border-brand-border">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-heading font-bold text-brand-text tracking-tight flex items-center gap-2">
              <MapPin size={20} className="text-brand-primary" />
              Mauritius Explorer
            </h1>
            <button
              onClick={() => onSelectLocation("C Mauritius (Hotel)")}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-brand-text/50 hover:text-brand-text hover:bg-brand-bg transition-all cursor-pointer"
              title="Go to hotel"
            >
              <Hotel size={14} />
              Our Hotel
            </button>
          </div>
          <div className="flex items-center justify-between mt-1 pl-7 mb-3">
            <p className="text-xs text-brand-text/50">
              {mode === "explore"
                ? `${filteredLocations.length} of ${allLocations.length} locations`
                : mode === "planner"
                  ? "7-day trip planner"
                  : "Nearby places"}
            </p>
            {userName && onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1 text-[11px] text-brand-text/40 hover:text-brand-text/70 transition-colors cursor-pointer"
              >
                {userName}
                <LogOut size={11} />
              </button>
            )}
          </div>

          {/* Mode toggle */}
          <div className="flex bg-brand-bg rounded-lg p-0.5">
            <button
              onClick={() => onModeChange("explore")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                mode === "explore"
                  ? "bg-white shadow-sm text-brand-text"
                  : "text-brand-text/40"
              }`}
            >
              <MapPin size={13} />
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
              <Calendar size={13} />
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
              <Compass size={13} />
              Discover
            </button>
          </div>
        </div>

        {mode === "explore" ? (
          <>
            <div className="p-4 border-b border-brand-border">
              <FilterBar
                allLocations={allLocations}
                activeCategories={activeCategories}
                onToggleCategory={onToggleCategory}
                onToggleAll={onToggleAll}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <LocationList
                locations={filteredLocations}
                selectedLocation={selectedLocation}
                onSelectLocation={onSelectLocation}
                locationDayMap={locationDayMap}
                onDeleteLocation={onDeleteLocation}
              />
            </div>
          </>
        ) : mode === "planner" ? (
          <div className="flex-1 overflow-y-auto">
            <DayPlanner
              allLocations={allLocations}
              days={days}
              onDaysChange={onDaysChange}
              activeDayId={activeDayId}
              onActiveDayChange={onActiveDayChange}
              routeInfos={routeInfos}
              onHoverLocation={onHoverLocation}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
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
              onHoverDiscoveredPlace={onHoverDiscoveredPlace}
              authToken={authToken}
              onAddToMyPlaces={onAddDiscoveredPlace}
              allLocationNames={allLocationNames}
            />
          </div>
        )}
      </aside>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-3 z-[1000] bg-white shadow-lg rounded-lg p-2 hover:bg-brand-bg transition-all duration-300 border border-brand-border cursor-pointer"
        style={{ left: collapsed ? "12px" : "348px" }}
      >
        {collapsed ? (
          <Menu size={18} className="text-brand-text" />
        ) : (
          <ChevronLeft size={18} className="text-brand-text" />
        )}
      </button>
    </>
  );
}
