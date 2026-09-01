"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "accent"
  | "destructive"
  | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "bg-surface text-text-primary hover:bg-surface-muted active:bg-surface-muted",
  outline:
    "bg-transparent text-text-primary border border-border hover:bg-surface-muted active:bg-surface-muted",
  ghost:
    "bg-transparent text-text-muted hover:bg-surface-muted hover:text-text-primary active:bg-surface-muted",
  accent:
    "bg-accent text-accent-foreground hover:opacity-90 active:opacity-80",
  destructive:
    "bg-error text-error-foreground hover:bg-error-hover active:bg-error-hover",
  danger:
    "bg-error text-error-foreground hover:bg-error-hover active:bg-error-hover",
};

export interface BackButtonProps {
  /**
   * The destination URL to navigate to.
   * If not provided, it will fallback to browser history (router.back()).
   */
  href?: string;

  /**
   * Optional custom click handler.
   * Useful when combining with browser history navigation or custom behavior.
   */
  onClick?: () => void;

  /**
   * The text label for the back button. Defaults to "Back".
   */
  label?: string;

  /**
   * Optional variant for the button. Defaults to "ghost".
   */
  variant?: ButtonVariant;

  /**
   * Additional class names for styling.
   */
  className?: string;
}

const baseClasses =
  "inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 select-none";

export function BackButton({
  href,
  onClick,
  label = "Back",
  variant = "ghost",
  className,
}: BackButtonProps) {
  const router = useRouter();

  const content = (
    <>
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </>
  );

  const classes = cn(baseClasses, variantClasses[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          router.back();
        }
      }}
    >
      {content}
    </button>
  );
}
