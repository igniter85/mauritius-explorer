"use client";

import { useEffect, useRef, useState } from "react";
import { Polyline } from "react-leaflet";
import type { Location } from "@/data/locations";
import type { DayPlan, RouteInfo } from "./DayPlanner";

const HOTEL_NAME = "C Mauritius (Hotel)";

interface DayRouteProps {
  allLocations: Location[];
  day: DayPlan | null;
  onRouteCalculated: (info: RouteInfo) => void;
}

// Haversine distance in km (fallback when routing API unavailable)
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DayRoute({ allLocations, day, onRouteCalculated }: DayRouteProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    setRouteCoords([]);

    const hotel = allLocations.find((l) => l.name === HOTEL_NAME);
    if (!hotel) return;

    if (!day || day.locationNames.length === 0) {
      if (day) {
        onRouteCalculated({
          dayId: day.id,
          totalDistance: 0,
          totalTime: 0,
          legs: [],
        });
      }
      return;
    }

    const stopLocations = day.locationNames
      .map((name) => allLocations.find((l) => l.name === name))
      .filter(Boolean) as Location[];

    if (stopLocations.length === 0) return;

    // Build round-trip: Hotel → Stop 1 → Stop 2 → ... → Hotel
    const allWaypoints = [hotel, ...stopLocations, hotel];
    const allNames = [HOTEL_NAME, ...day.locationNames, HOTEL_NAME];

    const controller = new AbortController();
    abortRef.current = controller;

    // ORS expects [lng, lat] order
    const coordinates = allWaypoints.map((wp) => [wp.lng, wp.lat]);

    fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Route API unavailable");
        return res.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;

        setRouteCoords(data.coordinates);

        const legs =
          data.segments?.map(
            (seg: { distance: number; time: number }, i: number) => ({
              from: allNames[i],
              to: allNames[i + 1],
              distance: seg.distance,
              time: seg.time,
            })
          ) ?? [];

        onRouteCalculated({
          dayId: day.id,
          totalDistance: data.totalDistance,
          totalTime: data.totalTime,
          legs,
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;

        // Fallback: straight lines + haversine estimates
        const straightLine: [number, number][] = allWaypoints.map((wp) => [
          wp.lat,
          wp.lng,
        ]);
        setRouteCoords(straightLine);

        let totalDist = 0;
        const legs = [];
        for (let i = 0; i < allWaypoints.length - 1; i++) {
          const dist =
            haversine(
              allWaypoints[i].lat,
              allWaypoints[i].lng,
              allWaypoints[i + 1].lat,
              allWaypoints[i + 1].lng
            ) * 1.3; // ~30% road winding factor
          totalDist += dist;
          legs.push({
            from: allNames[i],
            to: allNames[i + 1],
            distance: dist,
            time: (dist / 50) * 60, // ~50 km/h average
          });
        }

        onRouteCalculated({
          dayId: day.id,
          totalDistance: totalDist,
          totalTime: (totalDist / 50) * 60,
          legs,
        });

        if (err.name !== "AbortError") {
          console.warn("Route API unavailable, using straight-line estimates");
        }
      });

    return () => controller.abort();
  }, [day, onRouteCalculated, allLocations]);

  if (routeCoords.length < 2) return null;

  return (
    <>
      {/* Shadow line */}
      <Polyline
        positions={routeCoords}
        pathOptions={{ color: "#0EA5E9", weight: 5, opacity: 0.7 }}
      />
      {/* Highlight line */}
      <Polyline
        positions={routeCoords}
        pathOptions={{ color: "#38BDF8", weight: 3, opacity: 0.4 }}
      />
    </>
  );
}
