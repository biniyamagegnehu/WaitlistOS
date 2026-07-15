"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

interface LogoutConfirmationDialogProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function LogoutConfirmationDialog({ onClose, onConfirm }: LogoutConfirmationDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleConfirm = async () => {
    setError(null);
    setIsLoggingOut(true);

    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to logout"));
      setIsLoggingOut(false);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Logout</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <LogOut className="h-5 w-5 text-foreground" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Are you sure you want to logout?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                You will need to sign in again to access your account.
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="error" title="Error" className="mt-4">
              {error}
            </Alert>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isLoggingOut}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} loading={isLoggingOut}>
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
