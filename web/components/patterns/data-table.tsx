import * as React from "react";
import { cn } from "@/lib/cn";
import {
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableHeadCell,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "./loading-state";
import { Pagination, type PaginationMetadata } from "./pagination";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  empty?: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
  };
  pagination?: PaginationMetadata;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  empty,
  pagination,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  rowKey,
  className,
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingState variant="skeleton" skeletonCount={5} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={empty?.title || "No data available"}
        description={empty?.description || "There are no items to display at this time."}
        action={empty?.action}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableHeadCell
                  key={column.key}
                  className={cn(
                    column.sortable && "cursor-pointer hover:bg-surface-muted",
                    column.className
                  )}
                >
                  {column.header}
                </TableHeadCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => {
              const key = rowKey ? rowKey(row) : `${columns[0]?.key}-${index}`;
              return (
                <TableRow
                  key={key}
                  clickable={!!onRowClick}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(row) : (row[column.key as keyof T] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pagination && onPageChange && (
        <Pagination
          metadata={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
