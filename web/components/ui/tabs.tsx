"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

// ── Context ───────────────────────────────────────────────────────────────────
interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({
  value: "",
  onChange: () => {},
});

// ── Root ──────────────────────────────────────────────────────────────────────
interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  value,
  defaultValue = "",
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const active = controlled ? value : internalValue;

  const onChange = React.useCallback(
    (val: string) => {
      if (!controlled) setInternalValue(val);
      onValueChange?.(val);
    },
    [controlled, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: active, onChange }}>
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// ── List ──────────────────────────────────────────────────────────────────────
export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1",
        className
      )}
      {...props}
    />
  );
}

// ── Trigger ───────────────────────────────────────────────────────────────────
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const { value: active, onChange } = React.useContext(TabsContext);
  const isActive = active === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => onChange(value)}
      className={cn(
        "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
        isActive
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ── Content ───────────────────────────────────────────────────────────────────
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, ...props }: TabsContentProps) {
  const { value: active } = React.useContext(TabsContext);
  if (active !== value) return null;
  return <div role="tabpanel" className={cn(className)} {...props} />;
}
