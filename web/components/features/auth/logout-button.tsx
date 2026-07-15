"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { LogoutConfirmationDialog } from "./logout-confirmation-dialog";

interface LogoutButtonProps {
  className?: string;
  collapsed?: boolean;
  onLogout?: () => void;
}

export function LogoutButton({ className, collapsed = false, onLogout }: LogoutButtonProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [showDialog, setShowDialog] = React.useState(false);

  async function handleLogout() {
    try {
      await logout();
      onLogout?.();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  function handleClick() {
    setShowDialog(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={collapsed ? "Logout" : undefined}
        className={className}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>

      {showDialog && (
        <LogoutConfirmationDialog
          onClose={() => setShowDialog(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  );
}
