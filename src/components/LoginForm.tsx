"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

interface LoginFormProps {
  onLogin: (name: string, token: string) => Promise<string | null>;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !token.trim()) return;

    setLoading(true);
    setError(null);

    const err = await onLogin(name.trim(), token.trim());
    if (err) {
      setError(err);
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh w-screen flex items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Gradient accent bar */}
        <div className="h-[3px] bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-cta" />

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-bg mb-3">
              <MapPin size={24} className="text-brand-primary" />
            </div>
            <h1 className="text-xl font-heading font-bold text-brand-text">
              Mauritius Explorer
            </h1>
            <p className="text-xs text-brand-text/50 mt-1">
              Sign in to access the trip planner
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium text-brand-text/70 mb-1.5"
              >
                First Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Stefan"
                autoFocus
                autoComplete="given-name"
                className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm text-brand-text placeholder:text-brand-text/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="token"
                className="block text-xs font-medium text-brand-text/70 mb-1.5"
              >
                Access Token
              </label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter shared token"
                autoComplete="off"
                className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-bg text-sm text-brand-text placeholder:text-brand-text/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !token.trim()}
              className="w-full py-2.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? "Signing in..." : "Continue"}
            </button>
          </form>

          <p className="text-[11px] text-brand-text/50 text-center mt-4">
            Don&apos;t have a token? Contact the trip organizer.
          </p>
        </div>
      </div>
    </div>
  );
}
