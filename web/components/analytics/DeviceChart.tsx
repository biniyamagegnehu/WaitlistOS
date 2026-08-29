"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";

// Data visualization colors - intentionally hardcoded for consistent chart rendering
const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#94a3b8", // slate-400 (for unknown)
];

interface DeviceChartProps {
  data: {
    type: string;
    label: string;
    signups: number;
    percentage: number;
  }[];
}

export function DeviceChart({ data }: DeviceChartProps) {
  const chartData = data.filter(d => d.signups > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No device data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-48 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart aria-label="Pie chart showing device distribution">
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="signups"
              stroke="none"
            >
              {chartData.map((entry, index) => {
                let color = COLORS[index % (COLORS.length - 1)];
                if (entry.type === "UNKNOWN") color = COLORS[3];
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Pie>
            <RechartsTooltip
              formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percentage}%)`, props.payload.label]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Device</TableHeadCell>
              <TableHeadCell className="text-right">Signups</TableHeadCell>
              <TableHeadCell className="text-right">Share</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chartData.map((row, index) => {
              let color = COLORS[index % (COLORS.length - 1)];
              if (row.type === "UNKNOWN") color = COLORS[3];
              return (
                <TableRow key={row.type}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="font-medium">{row.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{row.signups.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{row.percentage}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
