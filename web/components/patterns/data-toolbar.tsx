import * as React from "react";
import { cn } from "@/lib/cn";

interface DataToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function DataToolbar({ children, className, ...props }: DataToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface DataToolbarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

export function DataToolbarSection({
  children,
  align = "start",
  className,
  ...props
}: DataToolbarSectionProps) {
  const alignClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
  };

  return (
    <div
      className={cn(
        "flex flex-1 flex-wrap items-center gap-2",
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface DataToolbarSpacerProps {
  className?: string;
}

export function DataToolbarSpacer({ className }: DataToolbarSpacerProps) {
  return <div className={cn("flex-1", className)} />;
}
