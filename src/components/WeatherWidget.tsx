"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Droplets, Wind, Thermometer } from "lucide-react";

interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: {
    date: string;
    dayName: string;
    high: number;
    low: number;
    icon: string;
    description: string;
    pop: number;
  }[];
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) setWeather(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading || error || !weather) {
    return (
      <div className="absolute top-3 right-14 z-[500] bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-brand-border px-3 py-2">
        <span className="text-[11px] text-brand-text/40">
          {loading ? "Loading weather..." : "Weather unavailable"}
        </span>
      </div>
    );
  }

  const iconUrl = (code: string) =>
    `https://openweathermap.org/img/wn/${code}@2x.png`;

  return (
    <div
      className={`absolute top-3 right-14 z-[500] bg-white/95 backdrop-blur-sm
        rounded-xl shadow-lg border border-brand-border transition-all duration-300 ${
          expanded ? "w-[260px]" : "w-auto"
        }`}
    >
      {/* Compact — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-3 py-1.5 w-full cursor-pointer"
      >
        <img
          src={iconUrl(weather.current.icon)}
          alt={weather.current.description}
          className="w-8 h-8 -my-1"
        />
        <span className="text-base font-bold text-brand-text">
          {weather.current.temp}°C
        </span>
        <span className="text-[11px] text-brand-text/50 capitalize hidden sm:inline truncate">
          {weather.current.description}
        </span>
        <ChevronDown
          size={12}
          className={`text-brand-text/40 ml-auto flex-shrink-0 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-brand-border">
          {/* Current details */}
          <div className="flex gap-3 py-2 text-[11px] text-brand-text/50">
            <span className="flex items-center gap-1">
              <Thermometer size={10} />
              Feels {weather.current.feelsLike}°
            </span>
            <span className="flex items-center gap-1">
              <Droplets size={10} />
              {weather.current.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind size={10} />
              {weather.current.windSpeed} km/h
            </span>
          </div>

          {/* 5-day forecast */}
          <div className="space-y-0.5 mt-1">
            {weather.forecast.map((day) => (
              <div
                key={day.date}
                className="flex items-center gap-2 text-[11px]"
              >
                <span className="w-8 font-medium text-brand-text/70">
                  {day.dayName}
                </span>
                <img
                  src={iconUrl(day.icon)}
                  alt={day.description}
                  className="w-6 h-6"
                />
                <span className="text-brand-text font-medium">
                  {day.high}°
                </span>
                <span className="text-brand-text/40">{day.low}°</span>
                {day.pop > 20 && (
                  <span className="text-brand-primary ml-auto flex items-center gap-0.5">
                    <Droplets size={9} />
                    {day.pop}%
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="text-[9px] text-brand-text/30 mt-2 text-right">
            Mauritius · OpenWeather
          </p>
        </div>
      )}
    </div>
  );
}
