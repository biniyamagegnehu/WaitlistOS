"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  helper?: string;
  size?: "sm" | "md" | "lg";
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helper, size = "md", id, ...props }, ref) => {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;

  const sizeClasses = {
    sm: "h-8 px-3 text-xs", // 32px
    md: "h-10 px-3 text-sm", // 40px
    lg: "h-11 px-4 text-sm", // 44px
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-text-primary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "flex w-full appearance-none rounded-md border border-border bg-surface px-3 py-2 pr-10 ring-offset-background shadow-sm transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:border-border-focus",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:text-text-disabled disabled:bg-surface-muted",
            "hover:border-border-strong",
            error && "border-border-error focus-visible:ring-border-error focus-visible:border-border-error",
            sizeClasses[size],
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${selectId}-error`
              : helper
                ? `${selectId}-helper`
                : undefined
          }
          {...props}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
      {helper && !error && (
        <p id={`${selectId}-helper`} className="text-xs text-text-muted">
          {helper}
        </p>
      )}
    </div>
  );
});

Select.displayName = "Select";
