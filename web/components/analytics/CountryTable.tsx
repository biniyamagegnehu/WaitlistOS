"use client";

import React from "react";

interface CountryTableProps {
  data: {
    code: string;
    name: string;
    signups: number;
    percentage: number;
  }[];
}

export function CountryTable({ data }: CountryTableProps) {
  // Show top 10 for table, others grouped if necessary, or just show all with pagination. 
  // Let's just show top 10 for simplicity in the table.
  const displayData = data.slice(0, 10);

  if (displayData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No country data available
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground border-b">
          <tr>
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium text-right">Signups</th>
            <th className="px-4 py-3 font-medium text-right">Share</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((row) => (
            <tr key={row.code} className="border-b last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">
                {row.code !== "Unknown" && <span className="mr-2 text-muted-foreground text-xs">{row.code}</span>}
                {row.name}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                {row.signups.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {row.percentage}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
