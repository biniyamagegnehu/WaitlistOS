"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { WaitlistCard } from "@/components/dashboard/WaitlistCard";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardWaitlists, deleteWaitlist, exportWaitlists } from "@/services/dashboard";
import type { DashboardWaitlist } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { DeleteWaitlistDialog } from "@/components/waitlist/DeleteWaitlistDialog";

type ExportFormat = 'csv' | 'xlsx' | 'doc' | 'pdf';

export default function WaitlistsPage() {
  const [waitlists, setWaitlists] = React.useState<DashboardWaitlist[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingWaitlist, setDeletingWaitlist] = React.useState<DashboardWaitlist | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [showExportDropdown, setShowExportDropdown] = React.useState(false);

  const refreshWaitlists = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
    getDashboardWaitlists()
      .then(setWaitlists)
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load waitlists"));
      })
      .finally(() => setIsLoading(false));
  }, []);

  React.useEffect(() => {
    refreshWaitlists();
  }, [refreshWaitlists]);

  const handleDelete = (waitlist: DashboardWaitlist) => {
    setDeletingWaitlist(waitlist);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWaitlist) return;

    try {
      await deleteWaitlist(deletingWaitlist.id);
      setWaitlists((prev: DashboardWaitlist[]) => prev.filter((w: DashboardWaitlist) => w.id !== deletingWaitlist.id));
      setDeletingWaitlist(null);
    } catch (error: unknown) {
      throw error;
    }
  };

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    setShowExportDropdown(false);
    try {
      await exportWaitlists(format);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error, "Export failed"));
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Waitlists"
        description="Manage your waitlists and view participants"
        action={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                loading={exporting}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export
              </Button>
              {showExportDropdown && !exporting && (
                <div className="absolute right-0 mt-2 w-32 bg-background border rounded-md shadow-lg z-10">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                  >
                    XLSX
                  </button>
                  <button
                    onClick={() => handleExport('doc')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                  >
                    DOC
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                  >
                    PDF
                  </button>
                </div>
              )}
            </div>
            <Link href={routes.create}>
              <Button leftIcon={<Plus className="h-4 w-4" />}>New waitlist</Button>
            </Link>
          </div>
        }
      />

      {error && (
        <EmptyState
          title="Unable to load waitlists"
          description={error}
          action={
            <Button onClick={() => window.location.reload()}>Try again</Button>
          }
        />
      )}

      {!error && waitlists.length === 0 && (
        <EmptyState
          title="No waitlists yet"
          description="Create your first waitlist to start collecting signups."
          action={
            <Link href={routes.create}>
              <Button>Create waitlist</Button>
            </Link>
          }
        />
      )}

      {!error && waitlists.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {waitlists.map((waitlist) => (
            <WaitlistCard
              key={waitlist.id}
              waitlist={waitlist}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {deletingWaitlist && (
        <DeleteWaitlistDialog
          waitlist={deletingWaitlist}
          onClose={() => setDeletingWaitlist(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
