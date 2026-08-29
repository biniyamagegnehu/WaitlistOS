"use client";

import React, { useMemo, useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "/world-110m.json";

// world-110m uses display names rather than ISO alpha-2 properties. Keep the
// few common naming differences explicit, then compare normalized labels.
const TOPOLOGY_NAME_BY_COUNTRY_CODE: Record<string, string> = {
  US: "United States of America",
  GB: "United Kingdom",
  RU: "Russia",
  CD: "Dem. Rep. Congo",
  DO: "Dominican Rep.",
  BO: "Bolivia",
  CI: "Côte d'Ivoire",
  IR: "Iran",
  KR: "South Korea",
  KP: "North Korea",
  SY: "Syria",
  TZ: "Tanzania",
  VE: "Venezuela",
  VN: "Vietnam",
};

function normalizeCountryName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

interface GeoMapProps {
  data: {
    code: string;
    name: string;
    signups: number;
    percentage: number;
  }[];
}

interface TooltipState {
  x: number;
  y: number;
  name: string;
  signups: number;
  percentage: number;
}

export function GeoMap({ data }: GeoMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const mapData = useMemo(
    () =>
      data
        .filter((country) => country.code !== "Unknown")
        .map((country) => ({
          ...country,
          topologyName: TOPOLOGY_NAME_BY_COUNTRY_CODE[country.code] ?? country.name,
        })),
    [data],
  );

  const maxSignups = useMemo(() => {
    return Math.max(...mapData.map(d => d.signups), 1);
  }, [mapData]);

  const colorScale = scaleLinear<string>()
    .domain([0, maxSignups])
    .range(["var(--chart-1)", "var(--primary)"]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, d: { name: string; signups: number; percentage: number }) => {
      const rect = (e.currentTarget as SVGElement)
        .closest(".geo-map-container")
        ?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top - 40,
        name: d.name,
        signups: d.signups,
        percentage: d.percentage,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className="geo-map-container relative w-full h-full min-h-[400px]" role="img" aria-label="World map showing signup distribution by country">
      <ComposableMap projectionConfig={{ scale: 140 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const topologyName = String(geo.properties.name ?? "");
              const d = mapData.find(
                (country) =>
                  normalizeCountryName(country.topologyName) ===
                  normalizeCountryName(topologyName),
              );
              const hasData = !!d;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={hasData ? colorScale(d!.signups) : "var(--surface-muted)"}
                  stroke="var(--border)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      fill: hasData ? "var(--primary)" : "var(--muted-foreground)",
                      outline: "none",
                      cursor: hasData ? "pointer" : "default",
                    },
                    pressed: { outline: "none" },
                  }}
                  onMouseMove={
                    hasData ? (e) => handleMouseMove(e as any, d!) : undefined
                  }
                  onMouseLeave={hasData ? handleMouseLeave : undefined}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
          style={{ left: tooltip.x, top: tooltip.y, maxWidth: 200 }}
          role="tooltip"
        >
          <p className="font-semibold">{tooltip.name}</p>
          <p className="text-muted-foreground">
            {tooltip.signups.toLocaleString()} signups ({tooltip.percentage}%)
          </p>
        </div>
      )}
    </div>
  );
}
