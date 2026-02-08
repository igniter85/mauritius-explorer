"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  categoryConfig,
  type Location,
  type LocationCategory,
} from "@/data/locations";
import {
  type UserLocation,
  type DiscoverRadius,
  type DiscoveredPlace,
  type PlaceDetails,
  ALL_DISCOVER_TYPES,
} from "@/lib/discover-types";
import { haversine } from "@/lib/haversine";
import MapView from "./MapView";
import BottomSheet from "./BottomSheet";
import Sidebar from "./Sidebar";
import WeatherWidget from "./WeatherWidget";
import {
  loadDays,
  saveDays,
  type DayPlan,
  type RouteInfo,
} from "./DayPlanner";

export type AppMode = "explore" | "planner" | "discover";

interface MauritiusMapProps {
  initialDays?: DayPlan[];
  userName?: string;
  authToken?: string;
  onLogout?: () => void;
}

export default function MauritiusMap({
  initialDays,
  userName,
  authToken,
  onLogout,
}: MauritiusMapProps) {
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [mode, setMode] = useState<AppMode>("explore");
  const [activeCategories, setActiveCategories] = useState<
    Set<LocationCategory>
  >(new Set(Object.keys(categoryConfig) as LocationCategory[]));
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [snap, setSnap] = useState<number | string | null>("148px");
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches
  );

  // Planner state
  const [days, setDays] = useState<DayPlan[]>(() =>
    initialDays && initialDays.length > 0 ? initialDays : loadDays()
  );
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [routeInfos, setRouteInfos] = useState<Record<string, RouteInfo>>({});
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [fitBoundsSignal, setFitBoundsSignal] = useState(0);

  // Discover state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [userLocationError, setUserLocationError] = useState<string | null>(null);
  const [userLocationLoading, setUserLocationLoading] = useState(false);
  const [discoverRadius, setDiscoverRadius] = useState<DiscoverRadius>(5);
  const [discoveredPlaces, setDiscoveredPlaces] = useState<DiscoveredPlace[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [selectedDiscoveredPlaceId, setSelectedDiscoveredPlaceId] = useState<string | null>(null);
  const [hoveredDiscoveredPlaceId, setHoveredDiscoveredPlaceId] = useState<string | null>(null);
  const [discoverRefreshSignal, setDiscoverRefreshSignal] = useState(0);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const systemRes = await fetch("/api/locations");
        const systemData: Location[] = await systemRes.json();

        if (authToken && userName) {
          const userRes = await fetch(
            `/api/user-locations?userName=${encodeURIComponent(userName)}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          if (userRes.ok) {
            const userData: Location[] = await userRes.json();
            const systemNames = new Set(systemData.map((l) => l.name));
            const deduped = userData.filter((l) => !systemNames.has(l.name));
            setAllLocations([...systemData, ...deduped]);
          } else {
            setAllLocations(systemData);
          }
        } else {
          setAllLocations(systemData);
        }
      } catch {
        // silent
      } finally {
        setLocationsLoading(false);
      }
    };
    fetchLocations();
  }, [authToken, userName]);

  const filteredLocations = useMemo(
    () => allLocations.filter((loc) => activeCategories.has(loc.category)),
    [activeCategories, allLocations]
  );

  const activeDay = useMemo(
    () => days.find((d) => d.id === activeDayId) ?? null,
    [days, activeDayId]
  );

  // Fly to day bounds when a day is selected in planner mode
  useEffect(() => {
    if (mode === "planner" && activeDayId) {
      setFitBoundsSignal((n) => n + 1);
    }
  }, [activeDayId, mode]);

  // Map location name → day label (e.g. "Le Morne" → "D3") for cross-referencing
  const locationDayMap = useMemo(() => {
    const map = new Map<string, string>();
    days.forEach((day, i) => {
      day.locationNames.forEach((name) => map.set(name, `D${i + 1}`));
    });
    return map;
  }, [days]);

  // Numbered markers for the active day
  const activeDayLocationNumbers = useMemo(() => {
    if (!activeDay) return new Map<string, number>();
    const map = new Map<string, number>();
    activeDay.locationNames.forEach((name, i) => map.set(name, i + 1));
    return map;
  }, [activeDay]);

  const toggleCategory = useCallback((cat: LocationCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setActiveCategories((prev) => {
      if (prev.size === Object.keys(categoryConfig).length) {
        return new Set();
      }
      return new Set(Object.keys(categoryConfig) as LocationCategory[]);
    });
  }, []);

  const handleSelectLocation = useCallback(
    (name: string | null) => {
      setSelectedLocation(name);
      setSelectedDiscoveredPlaceId(null);
      if (name && snap === "148px") {
        setSnap(0.5);
      }
    },
    [snap]
  );

  const handleMarkerSelect = useCallback(
    (name: string) => {
      setSelectedLocation(name);
      setSelectedDiscoveredPlaceId(null);
      if (snap === "148px" || snap === null) {
        setSnap(0.5);
      }
    },
    [snap]
  );

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleDaysChange = useCallback(
    (newDays: DayPlan[]) => {
      setDays(newDays);
      saveDays(newDays);

      // Debounced DB save
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
          }).catch(() => {
            // silent — localStorage is the fallback
          });
        }, 500);
      }
    },
    [authToken, userName]
  );

  const handleRouteCalculated = useCallback((info: RouteInfo) => {
    setRouteInfos((prev) => ({ ...prev, [info.dayId]: info }));
  }, []);

  const handleFitBounds = useCallback(() => {
    setFitBoundsSignal((n) => n + 1);
  }, []);

  // ─── User location callbacks ───

  const allLocationNames = useMemo(
    () => new Set(allLocations.map((l) => l.name)),
    [allLocations]
  );

  const handleAddDiscoveredPlace = useCallback(
    async (place: DiscoveredPlace, details?: PlaceDetails | null) => {
      if (!authToken || !userName) return;
      try {
        const res = await fetch("/api/user-locations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ userName, place, details }),
        });
        if (res.ok) {
          const { location } = await res.json();
          setAllLocations((prev) => {
            if (prev.some((l) => l.name === location.name)) return prev;
            return [...prev, location];
          });
        }
      } catch {
        // silent
      }
    },
    [authToken, userName]
  );

  const handleDeleteUserLocation = useCallback(
    async (name: string) => {
      if (!authToken || !userName) return;
      try {
        const res = await fetch("/api/user-locations", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ userName, locationName: name }),
        });
        if (res.ok) {
          setAllLocations((prev) => prev.filter((l) => l.name !== name));
          if (selectedLocation === name) setSelectedLocation(null);
        }
      } catch {
        // silent
      }
    },
    [authToken, userName, selectedLocation]
  );

  // ─── Discover callbacks ───

  const requestUserLocation = useCallback(() => {
    setUserLocationLoading(true);
    setUserLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setUserLocationLoading(false);
      },
      (err) => {
        let msg = "Unable to get your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please enable it in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location unavailable. Please try again.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please try again.";
        }
        setUserLocationError(msg);
        setUserLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const handleDiscoverRefresh = useCallback(() => {
    setDiscoverRefreshSignal((n) => n + 1);
  }, []);

  const handleSelectDiscoveredPlace = useCallback(
    (place: DiscoveredPlace) => {
      setSelectedDiscoveredPlaceId(place.id);
      setSelectedLocation(null);
      if (snap === "148px") {
        setSnap(0.5);
      }
    },
    [snap]
  );

  const handleDeselectDiscoveredPlace = useCallback(() => {
    setSelectedDiscoveredPlaceId(null);
  }, []);

  const handleModeChange = useCallback(
    (newMode: AppMode) => {
      setMode(newMode);
      if (newMode === "explore") {
        setActiveDayId(null);
      }
      if (newMode === "discover" && !userLocation && !userLocationLoading) {
        requestUserLocation();
      }
      if (newMode === "discover" && snap === "148px") {
        setSnap(0.5);
      }
    },
    [userLocation, userLocationLoading, requestUserLocation, snap]
  );

  // ─── Discover fetch effect ───

  useEffect(() => {
    if (mode !== "discover" || !userLocation) return;

    const abortController = new AbortController();
    setDiscoverLoading(true);
    setDiscoverError(null);

    fetch("/api/discover", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: discoverRadius,
        includedTypes: ALL_DISCOVER_TYPES,
      }),
      signal: abortController.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const places: DiscoveredPlace[] = (data.places ?? []).map(
          (p: DiscoveredPlace) => ({
            ...p,
            distanceKm: haversine(
              userLocation.lat,
              userLocation.lng,
              p.lat,
              p.lng
            ),
          })
        );
        places.sort(
          (a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0)
        );
        setDiscoveredPlaces(places);
        setDiscoverLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setDiscoverError("Failed to search nearby places. Try again.");
        setDiscoverLoading(false);
      });

    return () => abortController.abort();
  }, [mode, userLocation, discoverRadius, discoverRefreshSignal, authToken]);

  // ─── Visible locations ───

  // In discover mode, show curated locations within radius
  const visibleLocations = useMemo(() => {
    if (mode === "discover" && userLocation) {
      return allLocations.filter((l) => {
        if (l.category === "hotel") return true;
        const dist = haversine(userLocation.lat, userLocation.lng, l.lat, l.lng);
        return dist <= discoverRadius;
      });
    }
    if (mode === "planner" && activeDay) {
      return allLocations.filter((l) =>
        activeDay.locationNames.includes(l.name)
      );
    }
    return filteredLocations;
  }, [mode, activeDay, filteredLocations, allLocations, userLocation, discoverRadius]);

  return (
    <div className="h-dvh w-screen flex overflow-hidden bg-brand-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:relative">
        <Sidebar
          allLocations={allLocations}
          mode={mode}
          onModeChange={handleModeChange}
          filteredLocations={filteredLocations}
          activeCategories={activeCategories}
          selectedLocation={selectedLocation}
          onToggleCategory={toggleCategory}
          onToggleAll={toggleAll}
          onSelectLocation={handleSelectLocation}
          days={days}
          onDaysChange={handleDaysChange}
          activeDayId={activeDayId}
          onActiveDayChange={setActiveDayId}
          routeInfos={routeInfos}
          onHoverLocation={setHoveredLocation}
          locationDayMap={locationDayMap}
          userLocation={userLocation}
          userLocationError={userLocationError}
          userLocationLoading={userLocationLoading}
          onRequestLocation={requestUserLocation}
          discoverRadius={discoverRadius}
          onDiscoverRadiusChange={setDiscoverRadius}
          discoveredPlaces={discoveredPlaces}
          discoverLoading={discoverLoading}
          discoverError={discoverError}
          onDiscoverRefresh={handleDiscoverRefresh}
          onSelectDiscoveredPlace={handleSelectDiscoveredPlace}
          onDeselectDiscoveredPlace={handleDeselectDiscoveredPlace}
          selectedDiscoveredPlaceId={selectedDiscoveredPlaceId}
          onHoverDiscoveredPlace={setHoveredDiscoveredPlaceId}
          authToken={authToken}
          userName={userName}
          onLogout={onLogout}
          onAddDiscoveredPlace={handleAddDiscoveredPlace}
          onDeleteLocation={handleDeleteUserLocation}
          allLocationNames={allLocationNames}
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          allLocationsData={allLocations}
          locations={visibleLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={handleMarkerSelect}
          activeDay={mode === "planner" ? activeDay : null}
          activeDayLocationNumbers={
            mode === "planner" ? activeDayLocationNumbers : null
          }
          onRouteCalculated={handleRouteCalculated}
          hoveredLocation={hoveredLocation}
          showPopups={!isMobile}
          fitBoundsSignal={fitBoundsSignal}
          userLocation={mode === "discover" ? userLocation : null}
          discoveredPlaces={mode === "discover" ? discoveredPlaces : undefined}
          selectedDiscoveredPlaceId={mode === "discover" ? selectedDiscoveredPlaceId : undefined}
          onSelectDiscoveredPlace={mode === "discover" ? handleSelectDiscoveredPlace : undefined}
          hoveredDiscoveredPlaceId={mode === "discover" ? hoveredDiscoveredPlaceId : undefined}
        />

        {/* Weather widget */}
        <WeatherWidget />

        {/* Attribution */}
        <div className="absolute bottom-2 left-2 z-[500] bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 border border-brand-border">
          <span className="text-[9px] text-brand-text/40 font-medium">
            Data powered by Google · Routing by OSRM
          </span>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <BottomSheet
          allLocations={allLocations}
          mode={mode}
          onModeChange={handleModeChange}
          filteredLocations={filteredLocations}
          activeCategories={activeCategories}
          selectedLocation={selectedLocation}
          onToggleCategory={toggleCategory}
          onToggleAll={toggleAll}
          onSelectLocation={handleSelectLocation}
          snap={snap}
          onSnapChange={setSnap}
          days={days}
          onDaysChange={handleDaysChange}
          activeDayId={activeDayId}
          onActiveDayChange={setActiveDayId}
          routeInfos={routeInfos}
          locationDayMap={locationDayMap}
          onFitBounds={handleFitBounds}
          userLocation={userLocation}
          userLocationError={userLocationError}
          userLocationLoading={userLocationLoading}
          onRequestLocation={requestUserLocation}
          discoverRadius={discoverRadius}
          onDiscoverRadiusChange={setDiscoverRadius}
          discoveredPlaces={discoveredPlaces}
          discoverLoading={discoverLoading}
          discoverError={discoverError}
          onDiscoverRefresh={handleDiscoverRefresh}
          onSelectDiscoveredPlace={handleSelectDiscoveredPlace}
          onDeselectDiscoveredPlace={handleDeselectDiscoveredPlace}
          selectedDiscoveredPlaceId={selectedDiscoveredPlaceId}
          authToken={authToken}
          userName={userName}
          onLogout={onLogout}
          onAddDiscoveredPlace={handleAddDiscoveredPlace}
          onDeleteLocation={handleDeleteUserLocation}
          allLocationNames={allLocationNames}
        />
      )}
    </div>
  );
}
