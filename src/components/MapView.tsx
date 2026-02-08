"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Circle,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  categoryConfig,
  type Location,
} from "@/data/locations";
import {
  type UserLocation,
  type DiscoveredPlace,
  discoverCategoryConfig,
  getDiscoverCategory,
  getTypeBadgeLabel,
} from "@/lib/discover-types";
import LocationPopup from "./LocationPopup";
import DayRoute from "./DayRoute";
import type { DayPlan, RouteInfo } from "./DayPlanner";

function createIcon(color: string, isActive: boolean, isHotel?: boolean) {
  if (isHotel) {
    const size = 44;
    const svg = `
      <div style="position:relative;width:${size}px;height:${size}px">
        <div class="hotel-marker-pulse" style="position:absolute;inset:-8px;border-radius:50%;border:3px solid ${color};opacity:0.4"></div>
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

  const size = isActive ? 38 : 30;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="${color}" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="${color}" stroke="#fff" stroke-width="2" filter="url(#shadow)"/>
      <circle cx="12" cy="9" r="3" fill="#fff" opacity="0.95"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

function createNumberedIcon(color: string, number: number) {
  const size = 36;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <defs>
        <filter id="num-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="${color}" flood-opacity="0.4"/>
        </filter>
      </defs>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
            fill="${color}" stroke="#fff" stroke-width="2" filter="url(#num-shadow)"/>
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

function createDiscoverIcon(color: string, isSelected: boolean) {
  const size = isSelected ? 28 : 22;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
      <defs>
        <filter id="disc-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="${color}" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="#fff" stroke-width="2.5" filter="url(#disc-shadow)"/>
      <circle cx="12" cy="12" r="3.5" fill="#fff" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function FlyToSelected({
  location,
}: {
  location: Location | undefined;
}) {
  const map = useMap();
  const prevLocation = useRef<string | null>(null);

  useEffect(() => {
    if (location && location.name !== prevLocation.current) {
      map.flyTo([location.lat, location.lng], 13, { duration: 0.8 });
      prevLocation.current = location.name;
    }
  }, [location, map]);

  return null;
}

function FlyToUserLocation({
  userLocation,
}: {
  userLocation: UserLocation | null;
}) {
  const map = useMap();
  const hasFlewToUser = useRef(false);

  useEffect(() => {
    if (userLocation && !hasFlewToUser.current) {
      hasFlewToUser.current = true;
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.8 });
    }
  }, [userLocation, map]);

  return null;
}

function FlyToDiscoveredPlace({
  place,
}: {
  place: DiscoveredPlace | undefined;
}) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (place && place.id !== prevId.current) {
      prevId.current = place.id;
      map.flyTo([place.lat, place.lng], 15, { duration: 0.8 });
    }
  }, [place, map]);

  return null;
}

function FitBoundsEffect({
  locations: locs,
  signal,
  allLocations,
}: {
  locations: Location[];
  signal: number;
  allLocations: Location[];
}) {
  const map = useMap();
  const prevSignal = useRef(0);

  useEffect(() => {
    if (signal > 0 && signal !== prevSignal.current && locs.length > 0) {
      prevSignal.current = signal;
      const bounds = L.latLngBounds(locs.map((l) => [l.lat, l.lng]));
      // Include hotel if not already in bounds
      const hotel = allLocations.find(
        (l) => l.category === "hotel"
      );
      if (hotel) bounds.extend([hotel.lat, hotel.lng]);
      map.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 0.8,
        maxZoom: 13,
      });
    }
  }, [signal, locs, map, allLocations]);

  return null;
}

interface MapViewProps {
  allLocationsData: Location[];
  locations: Location[];
  selectedLocation: string | null;
  onSelectLocation: (name: string) => void;
  activeDay: DayPlan | null;
  activeDayLocationNumbers: Map<string, number> | null;
  onRouteCalculated: (info: RouteInfo) => void;
  hoveredLocation?: string | null;
  showPopups?: boolean;
  fitBoundsSignal?: number;
  userLocation?: UserLocation | null;
  discoveredPlaces?: DiscoveredPlace[];
  selectedDiscoveredPlaceId?: string | null;
  onSelectDiscoveredPlace?: (place: DiscoveredPlace) => void;
  hoveredDiscoveredPlaceId?: string | null;
}

export default function MapView({
  allLocationsData,
  locations,
  selectedLocation,
  onSelectLocation,
  activeDay,
  activeDayLocationNumbers,
  onRouteCalculated,
  hoveredLocation,
  showPopups = true,
  fitBoundsSignal = 0,
  userLocation,
  discoveredPlaces,
  selectedDiscoveredPlaceId,
  onSelectDiscoveredPlace,
  hoveredDiscoveredPlaceId,
}: MapViewProps) {
  const markerRefs = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (
      showPopups &&
      selectedLocation &&
      markerRefs.current[selectedLocation]
    ) {
      markerRefs.current[selectedLocation].openPopup();
    }
  }, [selectedLocation, showPopups]);

  const selectedLoc = locations.find((l) => l.name === selectedLocation);
  const selectedDiscoveredPlace = discoveredPlaces?.find(
    (p) => p.id === selectedDiscoveredPlaceId
  );

  return (
    <MapContainer
      center={[-20.25, 57.55]}
      zoom={10}
      zoomControl={false}
      className="h-full w-full"
      style={{ background: "#E0F2FE" }}
    >
      <ZoomControl position="topright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FlyToSelected location={selectedLoc} />
      <FlyToUserLocation userLocation={userLocation ?? null} />
      <FlyToDiscoveredPlace place={selectedDiscoveredPlace} />
      <FitBoundsEffect locations={locations} signal={fitBoundsSignal} allLocations={allLocationsData} />

      {/* Route polyline for active day */}
      <DayRoute allLocations={allLocationsData} day={activeDay} onRouteCalculated={onRouteCalculated} />

      {/* User location marker */}
      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={Math.min(userLocation.accuracy, 500)}
            pathOptions={{
              color: "#3b82f6",
              weight: 1,
              opacity: 0.2,
              fillColor: "#3b82f6",
              fillOpacity: 0.08,
            }}
          />
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{
              color: "#fff",
              weight: 3,
              fillColor: "#3b82f6",
              fillOpacity: 1,
            }}
            className="user-location-pulse"
          />
        </>
      )}

      {/* Curated location markers */}
      {locations.map((loc) => {
        const config = categoryConfig[loc.category];
        const isSelected = selectedLocation === loc.name;
        const isHovered = hoveredLocation === loc.name;
        const dayNumber = activeDayLocationNumbers?.get(loc.name);

        const icon = dayNumber
          ? createNumberedIcon(config.color, dayNumber)
          : createIcon(
              config.color,
              isSelected || isHovered,
              loc.category === "hotel"
            );

        return (
          <Marker
            key={loc.name}
            position={[loc.lat, loc.lng]}
            icon={icon}
            ref={(ref) => {
              if (ref) markerRefs.current[loc.name] = ref;
            }}
            eventHandlers={{
              click: () => onSelectLocation(loc.name),
            }}
          >
            {showPopups && (
              <Popup maxWidth={320} closeButton={true}>
                <LocationPopup location={loc} />
              </Popup>
            )}
          </Marker>
        );
      })}

      {/* Discovered place markers */}
      {discoveredPlaces?.map((place) => {
        const cat = getDiscoverCategory(place.types);
        const color = cat ? discoverCategoryConfig[cat].color : "#6b7280";
        const isSelected = selectedDiscoveredPlaceId === place.id;
        const icon = createDiscoverIcon(color, isSelected);
        const typeLabel = getTypeBadgeLabel(place.types);

        return (
          <Marker
            key={`discover-${place.id}`}
            position={[place.lat, place.lng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectDiscoveredPlace?.(place),
            }}
          >
            <Popup maxWidth={280} closeButton={true}>
              <div className="py-1">
                {place.photoUri && (
                  <img
                    src={place.photoUri}
                    alt=""
                    className="w-full h-28 object-cover rounded-lg mb-2 -mt-1"
                  />
                )}
                <p className="text-sm font-heading font-bold text-brand-text mb-1">
                  {place.name}
                </p>
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: color + "18", color }}
                  >
                    {typeLabel}
                  </span>
                  {place.rating && (
                    <span className="text-xs text-brand-text/60">
                      ★ {place.rating.toFixed(1)}
                      {place.userRatingCount && (
                        <span className="text-brand-text/40">
                          {" "}({place.userRatingCount.toLocaleString()})
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {place.address && (
                  <p className="text-xs text-brand-text/50 leading-relaxed">
                    {place.address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Hover highlight — pulsing ring for hovered discovered place */}
      {hoveredDiscoveredPlaceId && (() => {
        const place = discoveredPlaces?.find((p) => p.id === hoveredDiscoveredPlaceId);
        if (!place) return null;
        const cat = getDiscoverCategory(place.types);
        const color = cat ? discoverCategoryConfig[cat].color : "#6b7280";
        return (
          <>
            <CircleMarker
              center={[place.lat, place.lng]}
              radius={20}
              pathOptions={{
                color,
                weight: 2,
                opacity: 0.6,
                fillColor: color,
                fillOpacity: 0.1,
              }}
              className="animate-marker-pop"
            />
            <CircleMarker
              center={[place.lat, place.lng]}
              radius={32}
              pathOptions={{
                color,
                weight: 1.5,
                opacity: 0.3,
                fillColor: color,
                fillOpacity: 0.05,
              }}
            />
          </>
        );
      })()}

      {/* Hover highlight — pulsing ring for hovered curated location */}
      {hoveredLocation && (() => {
        const loc = allLocationsData.find((l) => l.name === hoveredLocation);
        if (!loc) return null;
        const config = categoryConfig[loc.category];
        return (
          <>
            <CircleMarker
              center={[loc.lat, loc.lng]}
              radius={24}
              pathOptions={{
                color: config.color,
                weight: 2,
                opacity: 0.6,
                fillColor: config.color,
                fillOpacity: 0.1,
              }}
              className="animate-marker-pop"
            />
            <CircleMarker
              center={[loc.lat, loc.lng]}
              radius={36}
              pathOptions={{
                color: config.color,
                weight: 1.5,
                opacity: 0.3,
                fillColor: config.color,
                fillOpacity: 0.05,
              }}
            />
          </>
        );
      })()}

    </MapContainer>
  );
}
