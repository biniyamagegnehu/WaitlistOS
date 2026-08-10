"use client";

import { FunnelStep } from "@/services/analytics";

interface FunnelVisualizationProps {
  steps: FunnelStep[];
}

export function FunnelVisualization({ steps }: FunnelVisualizationProps) {
  const maxCount = Math.max(...steps.map((s) => s.count));

  const getBarWidth = (count: number) => {
    if (maxCount === 0) return 0;
    return (count / maxCount) * 100;
  };

  const getBarColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.type} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{step.label}</span>
            <div className="flex items-center gap-4">
              {step.conversionRate !== null && index > 0 && (
                <span className="text-muted-foreground">
                  {step.conversionRate.toFixed(1)}% conversion
                </span>
              )}
              <span className="font-bold">{step.count.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="relative h-12 rounded-lg bg-muted overflow-hidden">
            <div
              className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out ${getBarColor(index)}`}
              style={{ width: `${getBarWidth(step.count)}%` }}
            />
            <div className="absolute inset-0 flex items-center px-4">
              {step.dropOff !== null && step.dropOff > 0 && (
                <div className="flex items-center gap-2 text-sm text-white font-medium">
                  <span className="opacity-90">
                    -{step.dropOff.toLocaleString()} ({step.dropOffRate?.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {step.dropOff !== null && step.dropOff > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>↓ {step.dropOff.toLocaleString()} users dropped off</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
