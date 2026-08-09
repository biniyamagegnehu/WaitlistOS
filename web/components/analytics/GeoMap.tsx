"use client";

import React, { useMemo, useState, useCallback } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";

const geoUrl = "/world-110m.json";

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

  const mapData = useMemo(() => data.filter(d => d.code !== "Unknown"), [data]);

  const maxSignups = useMemo(() => {
    return Math.max(...mapData.map(d => d.signups), 1);
  }, [mapData]);

  const colorScale = scaleLinear<string>()
    .domain([0, maxSignups])
    .range(["#eff6ff", "#3b82f6"]);

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
    <div className="geo-map-container relative w-full h-full min-h-[400px]">
      <ComposableMap projectionConfig={{ scale: 140 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const d = mapData.find(
                (s) =>
                  s.name === geo.properties.name ||
                  s.code === geo.properties.iso_a2
              );
              const hasData = !!d;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={hasData ? colorScale(d!.signups) : "hsl(var(--muted))"}
                  stroke="hsl(var(--background))"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      fill: hasData ? "#2563eb" : "hsl(var(--muted-foreground))",
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
