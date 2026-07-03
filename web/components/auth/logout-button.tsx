"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { API_URL } from "@/lib/constants";

interface LogoutButtonProps {
  className?: string;
  collapsed?: boolean;
  onLogout?: () => void;
}

export function LogoutButton({ className, collapsed = false, onLogout }: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleLogout() {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      onLogout?.();
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      title={collapsed ? "Logout" : undefined}
      className={className}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{isLoading ? "Logging out..." : "Logout"}</span>}
    </button>
  );
}
