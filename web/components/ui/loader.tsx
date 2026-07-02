import * as React from "react";
import { cn } from "@/lib/cn";

// ── Spinner ───────────────────────────────────────────────────────────────────
interface SpinnerProps extends React.SVGAttributes<SVGElement> {
  size?: "xs" | "sm" | "md" | "lg";
}

const spinnerSizes: Record<NonNullable<SpinnerProps["size"]>, string> = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <svg
      className={cn("animate-spin text-indigo-400", spinnerSizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      role="status"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── Page Loader ───────────────────────────────────────────────────────────────
interface PageLoaderProps {
  label?: string;
}

export function PageLoader({ label = "Loading…" }: PageLoaderProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-32">
      <Spinner size="lg" />
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/8",
        className
      )}
      {...props}
    />
  );
}
