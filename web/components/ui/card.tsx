import * as React from "react";
import { cn } from "@/lib/cn";

// ── Card Root ─────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm",
        hover &&
          "transition-all duration-200 hover:border-white/20 hover:bg-white/8 hover:shadow-lg hover:shadow-black/20",
        className
      )}
      {...props}
    />
  );
}

// ── Card Header ───────────────────────────────────────────────────────────────
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1 px-6 py-5 border-b border-white/8",
        className
      )}
      {...props}
    />
  );
}

// ── Card Title ────────────────────────────────────────────────────────────────
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold leading-tight text-white", className)}
      {...props}
    />
  );
}

// ── Card Description ──────────────────────────────────────────────────────────
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-zinc-400", className)}
      {...props}
    />
  );
}

// ── Card Content ──────────────────────────────────────────────────────────────
export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}

// ── Card Footer ───────────────────────────────────────────────────────────────
export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center px-6 py-4 border-t border-white/8",
        className
      )}
      {...props}
    />
  );
}
