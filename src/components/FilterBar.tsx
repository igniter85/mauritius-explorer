"use client";

import {
  categoryConfig,
  type Location,
  type LocationCategory,
} from "@/data/locations";
import CategoryIcon from "./CategoryIcon";

interface FilterBarProps {
  allLocations: Location[];
  activeCategories: Set<LocationCategory>;
  onToggleCategory: (cat: LocationCategory) => void;
  onToggleAll: () => void;
}

export default function FilterBar({
  allLocations,
  activeCategories,
  onToggleCategory,
  onToggleAll,
}: FilterBarProps) {
  const allActive =
    activeCategories.size === Object.keys(categoryConfig).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-brand-primary/50">
          Filter
        </span>
        <button
          onClick={onToggleAll}
          className="text-[11px] text-brand-cta hover:text-brand-cta/80 font-medium cursor-pointer"
        >
          {allActive ? "Hide all" : "Show all"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(
          Object.entries(categoryConfig) as [
            LocationCategory,
            (typeof categoryConfig)[LocationCategory],
          ][]
        ).map(([key, config]) => {
          const active = activeCategories.has(key);
          const count = allLocations.filter((l) => l.category === key).length;
          return (
            <button
              key={key}
              onClick={() => onToggleCategory(key)}
              className={`
                inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium
                transition-all duration-150 cursor-pointer
                ${
                  active
                    ? "text-white"
                    : "bg-brand-bg text-brand-text/50 hover:bg-brand-border"
                }
              `}
              style={
                active
                  ? {
                      backgroundColor: config.color,
                      boxShadow: `0 0 0 3px ${config.color}25`,
                    }
                  : undefined
              }
            >
              <CategoryIcon name={config.icon} size={14} strokeWidth={2.5} />
              {config.label}
              <span className={`text-[10px] ${active ? "opacity-75" : ""}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
