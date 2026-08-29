"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
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
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#94a3b8"
];

interface BrowserChartProps {
  data: {
    name: string;
    signups: number;
    percentage: number;
  }[];
}

export function BrowserChart({ data }: BrowserChartProps) {
  let chartData = data.filter(d => d.signups > 0);

  if (chartData.length > 5) {
    const top = chartData.slice(0, 5);
    const rest = chartData.slice(5);
    const restSignups = rest.reduce((acc, curr) => acc + curr.signups, 0);
    const restPct = rest.reduce((acc, curr) => acc + curr.percentage, 0);

    chartData = [...top, { name: "Other", signups: restSignups, percentage: Number(restPct.toFixed(2)) }];
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No browser data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }} aria-label="Bar chart showing browser distribution">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} style={{ fontSize: '12px' }} />
            <RechartsTooltip
              cursor={{ fill: 'transparent' }}
              formatter={(value: any, name: any, props: any) => [`${value} (${props.payload.percentage}%)`, "Signups"]}
            />
            <Bar dataKey="signups" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeadCell>Browser</TableHeadCell>
              <TableHeadCell className="text-right">Signups</TableHeadCell>
              <TableHeadCell className="text-right">Share</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chartData.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right font-medium">{row.signups.toLocaleString()}</TableCell>
                <TableCell className="text-right text-muted-foreground">{row.percentage}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
