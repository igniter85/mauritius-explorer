"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getAuth } from "@/lib/auth";
import type { Location } from "@/data/locations";
import type { DayPlan } from "./DayPlanner";

const DayPlannerPage = dynamic(() => import("@/components/DayPlannerPage"), {
  ssr: false,
  loading: () => (
    <div className="h-dvh w-screen flex items-center justify-center bg-brand-bg">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0EA5E9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin"
            style={{ animationDuration: "3s" }}
          >
            <circle cx="12" cy="12" r="10" opacity="0.2" />
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </div>
        <p className="text-brand-primary text-sm font-medium">Loading planner...</p>
      </div>
    </div>
  ),
});

interface Props {
  dayId: string;
}

export default function DayPlannerPageLoader({ dayId }: Props) {
  const router = useRouter();
  const [allLocations, setAllLocations] = useState<Location[] | null>(null);
  const [initialDays, setInitialDays] = useState<DayPlan[] | null>(null);
  const [userName, setUserName] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = getAuth();
    if (!saved) {
      router.push("/");
      return;
    }

    const { userName: name, token } = saved;

    // Validate auth + load plans
    Promise.all([
      fetch("/api/auth/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, token }),
      }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/locations").then((r) => r.json()),
      fetch(`/api/user-locations?userName=${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([authData, systemLocs, userLocs]) => {
        if (!authData?.valid) {
          router.push("/");
          return;
        }

        // Merge locations
        const systemNames = new Set(
          (systemLocs as Location[]).map((l: Location) => l.name)
        );
        const deduped = (userLocs as Location[]).filter(
          (l: Location) => !systemNames.has(l.name)
        );
        setAllLocations([...systemLocs, ...deduped]);

        setInitialDays(authData.plans ?? []);
        setUserName(name);
        setAuthToken(token);
        setChecking(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [router]);

  if (checking || !allLocations || !initialDays) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-brand-bg">
        <p className="text-brand-primary text-sm font-medium">Checking access...</p>
      </div>
    );
  }

  return (
    <DayPlannerPage
      dayId={dayId}
      allLocations={allLocations}
      initialDays={initialDays}
      userName={userName}
      authToken={authToken}
    />
  );
}
