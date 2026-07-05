"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme, useThemeMounted } from "@/contexts/theme-context";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const mounted = useThemeMounted();

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "p-2" : "p-2.5";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors",
        "hover:bg-surface-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        buttonSize,
        className
      )}
    >
      {mounted && theme === "dark" ? (
        <Sun className={iconSize} aria-hidden="true" />
      ) : (
        <Moon className={iconSize} aria-hidden="true" />
      )}
    </button>
  );
}
