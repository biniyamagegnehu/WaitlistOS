import * as React from "react";
import { cn } from "@/lib/cn";

// ── Root ──────────────────────────────────────────────────────────────────────
export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-white/10">
      <table
        className={cn("w-full text-sm border-collapse", className)}
        {...props}
      />
    </div>
  );
}

// ── Head ──────────────────────────────────────────────────────────────────────
export function TableHead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-white/10 bg-white/5", className)}
      {...props}
    />
  );
}

// ── Body ──────────────────────────────────────────────────────────────────────
export function TableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-white/8", className)} {...props} />;
}

// ── Row ───────────────────────────────────────────────────────────────────────
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export function TableRow({ className, clickable, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors duration-100",
        clickable && "cursor-pointer hover:bg-white/5",
        className
      )}
      {...props}
    />
  );
}

// ── Header Cell ───────────────────────────────────────────────────────────────
export function TableHeadCell({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500",
        className
      )}
      {...props}
    />
  );
}

// ── Data Cell ─────────────────────────────────────────────────────────────────
export function TableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3.5 text-zinc-300", className)}
      {...props}
    />
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
export function TableFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn("border-t border-white/10 bg-white/5", className)}
      {...props}
    />
  );
}
