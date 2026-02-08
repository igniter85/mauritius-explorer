"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { getAuth, setAuth, clearAuth } from "@/lib/auth";
import LoginForm from "./LoginForm";
import type { DayPlan } from "./DayPlanner";

const MauritiusMap = dynamic(() => import("@/components/MauritiusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-brand-bg">
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
        <div className="space-y-2 w-48">
          <div className="h-3 rounded-full animate-shimmer" />
          <div className="h-3 rounded-full animate-shimmer w-3/4 mx-auto" />
        </div>
        <p className="text-brand-primary text-sm mt-3 font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

interface AuthedState {
  userName: string;
  token: string;
  initialDays: DayPlan[];
}

async function validateAndLoadPlans(
  name: string,
  token: string
): Promise<{ valid: boolean; plans: DayPlan[]; error?: string }> {
  try {
    const res = await fetch("/api/auth/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, token }),
    });
    if (res.status === 401) return { valid: false, plans: [] };
    if (!res.ok) return { valid: false, plans: [], error: "Server error. Try again." };
    const data = await res.json();
    return { valid: data.valid, plans: data.plans ?? [] };
  } catch {
    return { valid: false, plans: [], error: "Network error. Check your connection." };
  }
}

export default function MapLoader() {
  const [authed, setAuthed] = useState<AuthedState | null>(null);
  const [checking, setChecking] = useState(true);

  // On mount: check localStorage for existing auth
  useEffect(() => {
    const saved = getAuth();
    if (!saved) {
      setChecking(false);
      return;
    }

    validateAndLoadPlans(saved.userName, saved.token).then((result) => {
      if (result.valid) {
        setAuthed({
          userName: saved.userName,
          token: saved.token,
          initialDays: result.plans,
        });
      } else {
        clearAuth();
      }
      setChecking(false);
    });
  }, []);

  const handleLogin = useCallback(
    async (name: string, token: string): Promise<string | null> => {
      const result = await validateAndLoadPlans(name, token);
      if (!result.valid) {
        return result.error ?? "Invalid token. Please try again.";
      }
      setAuth(name, token);
      setAuthed({ userName: name, token, initialDays: result.plans });
      return null;
    },
    []
  );

  const handleLogout = useCallback(() => {
    clearAuth();
    setAuthed(null);
  }, []);

  if (checking) {
    return (
      <div className="h-dvh w-screen flex items-center justify-center bg-brand-bg">
        <p className="text-brand-primary text-sm font-medium">Checking access...</p>
      </div>
    );
  }

  if (!authed) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <MauritiusMap
      initialDays={authed.initialDays}
      userName={authed.userName}
      authToken={authed.token}
      onLogout={handleLogout}
    />
  );
}
