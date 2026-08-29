"use client";

import React from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";

interface CountryTableProps {
  data: {
    code: string;
    name: string;
    signups: number;
    percentage: number;
  }[];
}

export function CountryTable({ data }: CountryTableProps) {
  const displayData = data.slice(0, 10);

  if (displayData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No country data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell>Country</TableHeadCell>
            <TableHeadCell className="text-right">Signups</TableHeadCell>
            <TableHeadCell className="text-right">Share</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {displayData.map((row) => (
            <TableRow key={row.code}>
              <TableCell>
                {row.code !== "Unknown" && <span className="mr-2 text-muted-foreground text-xs">{row.code}</span>}
                {row.name}
              </TableCell>
              <TableCell className="text-right font-medium">
                {row.signups.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {row.percentage}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
