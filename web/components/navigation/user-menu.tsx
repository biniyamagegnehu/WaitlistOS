"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Settings, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useCurrentUser } from "@/contexts/auth-context";
import { LogoutButton } from "@/components/features/auth/logout-button";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/cn";

export function UserMenu() {
  const { user } = useCurrentUser();
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const displayName =
    (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user?.firstName || user?.lastName || user?.email) ?? "Account");

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (email) return email[0].toUpperCase();
    return "U";
  };

  const initials = getInitials(user?.firstName, user?.lastName, user?.email);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        {user?.avatar ? (
          <div className="h-8 w-8 overflow-hidden rounded-full">
            <img
              src={user.avatar}
              alt="Profile avatar"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <Avatar fallback={initials} size="sm" />
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-border bg-surface py-1 shadow-md"
        >
          <div className="border-b border-divider px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
          <Link
            href={routes.settings}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            Profile
          </Link>
          <Link
            href={routes.settingsTab("security")}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-muted"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Security
          </Link>
          <div className="border-t border-divider p-1">
            <LogoutButton
              onLogout={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-destructive hover:bg-destructive/5 disabled:cursor-wait disabled:opacity-70"
            />
          </div>
        </div>
      )}
    </div>
  );
}
