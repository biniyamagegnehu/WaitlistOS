"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface DropdownMenuContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(
  undefined
);

interface DropdownMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function DropdownMenu({ open: controlledOpen, onOpenChange, children }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange]
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, setOpen]);

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange: setOpen, triggerRef }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ className, children, asChild = false, ...props }: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

  const { open, onOpenChange, triggerRef } = context;

  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childOnClick = (childElement.props as any).onClick as ((e: React.MouseEvent) => void) | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalRef = (childElement.props as any).ref;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mergedRef = (node: any) => {
      (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      if (typeof originalRef === 'function') {
        originalRef(node);
      } else if (originalRef) {
        (originalRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.cloneElement(childElement, {
      ref: mergedRef,
      onClick: (e: React.MouseEvent) => {
        onOpenChange(!open);
        childOnClick?.(e);
      },
    } as any);
  }

  return (
    <button
      ref={triggerRef}
      onClick={() => onOpenChange(!open)}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ className, align = "left", ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: "left" | "right" | "center" }) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu");

  const { open, triggerRef } = context;

  if (!open) return null;

  const alignClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2"
  };

  return (
    <div
      className={cn(
        "absolute top-full z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface shadow-lg p-1",
        alignClasses[align],
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuItem({ className, children, onClick, ...props }: React.ComponentProps<"button">) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu");

  const { onOpenChange } = context;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onOpenChange(false);
    onClick?.(e);
  };

  return (
    <button
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm text-text-primary outline-none transition-colors",
        "focus:bg-surface-muted focus:text-text-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-px my-1 bg-border -mx-1", className)}
      {...props}
    />
  );
}
