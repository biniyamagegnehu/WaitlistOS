"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { getApiErrorMessage } from "@/lib/errors";
import type { DashboardWaitlist } from "@/types/dashboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

interface DeleteWaitlistDialogProps {
  waitlist: DashboardWaitlist;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteWaitlistDialog({ waitlist, onClose, onConfirm }: DeleteWaitlistDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to delete waitlist"));
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete waitlist</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Are you sure you want to delete <strong>{waitlist.name}</strong>? This action cannot be undone.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                This will permanently delete the waitlist and all {waitlist.totalParticipants} participant(s).
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
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} loading={isDeleting}>
            Delete waitlist
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
