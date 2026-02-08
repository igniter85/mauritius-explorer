"use client";

import { Star, Calendar, Trash2 } from "lucide-react";
import { categoryConfig, mobilityConfig, type Location } from "@/data/locations";
import CategoryIcon from "./CategoryIcon";

interface LocationListProps {
  locations: Location[];
  selectedLocation: string | null;
  onSelectLocation: (name: string | null) => void;
  locationDayMap?: Map<string, string>;
  onDeleteLocation?: (name: string) => void;
}

export default function LocationList({
  locations,
  selectedLocation,
  onSelectLocation,
  locationDayMap,
  onDeleteLocation,
}: LocationListProps) {
  return (
    <div>
      {locations.map((loc) => {
        const config = categoryConfig[loc.category];
        const isSelected = selectedLocation === loc.name;
        return (
          <button
            key={loc.name}
            onClick={() =>
              onSelectLocation(isSelected ? null : loc.name)
            }
            className={`
              w-full text-left px-4 py-3 border-b border-brand-border/50
              transition-all duration-150 cursor-pointer group
              ${isSelected ? "" : loc.isUserAdded ? "bg-white hover:bg-brand-bg/50" : "bg-brand-bg/30 hover:bg-brand-bg"}
            `}
            style={{
              ...(isSelected
                ? {
                    boxShadow: `inset 3px 0 0 ${config.color}`,
                    backgroundColor: config.color + "08",
                  }
                : undefined),
              transform: isSelected ? undefined : undefined,
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "";
            }}
          >
            <div className="flex items-center gap-2">
              <CategoryIcon
                name={config.icon}
                size={16}
                style={{ color: config.color }}
                className="flex-shrink-0"
              />
              <span className="text-sm font-medium text-brand-text truncate">
                {loc.name}
              </span>
              <span className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                {loc.isUserAdded && onDeleteLocation && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLocation(loc.name);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onDeleteLocation(loc.name);
                      }
                    }}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-brand-text/30 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove from My Places"
                  >
                    <Trash2 size={13} />
                  </span>
                )}
                {(() => {
                  const mob = mobilityConfig[loc.mobility];
                  return (
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: mob.color + "18" }}
                      title={`${mob.label} — ${mob.description}`}
                    >
                      <CategoryIcon name={mob.icon} size={11} style={{ color: mob.color }} />
                    </span>
                  );
                })()}
                {locationDayMap?.get(loc.name) && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-semibold">
                    <Calendar size={9} />
                    {locationDayMap.get(loc.name)}
                  </span>
                )}
                {loc.rating && (
                  <span className="flex items-center gap-0.5 text-[11px] text-amber-500">
                    <Star size={11} fill="currentColor" strokeWidth={0} />
                    {loc.rating}
                  </span>
                )}
              </span>
            </div>
            <p className="text-[11px] text-brand-text/50 mt-1 line-clamp-2 pl-[24px]">
              {loc.notes}
            </p>
          </button>
        );
      })}
    </div>
  );
}
