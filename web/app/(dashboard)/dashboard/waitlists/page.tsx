"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Download, Search, ArrowUpDown } from "lucide-react";
import { WaitlistCard } from "@/components/dashboard/WaitlistCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { DataToolbar, DataToolbarSection } from "@/components/patterns/data-toolbar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getDashboardWaitlists, deleteWaitlist, exportWaitlists } from "@/services/dashboard";
import type { DashboardWaitlist } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { DeleteWaitlistDialog } from "@/components/waitlist/DeleteWaitlistDialog";

type ExportFormat = 'csv' | 'xlsx' | 'doc' | 'pdf';
type SortBy = 'name' | 'createdAt' | 'totalParticipants';
type SortOrder = 'asc' | 'desc';

export default function WaitlistsPage() {
  const [waitlists, setWaitlists] = React.useState<DashboardWaitlist[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deletingWaitlist, setDeletingWaitlist] = React.useState<DashboardWaitlist | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [showExportDropdown, setShowExportDropdown] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');
  const [showSortDropdown, setShowSortDropdown] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const refreshWaitlists = React.useCallback((searchOverride?: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    getDashboardWaitlists({
      search: searchOverride || undefined,
      sortBy,
      sortOrder,
    })
      .then(setWaitlists)
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load waitlists"));
      })
      .finally(() => {
        if (showLoading) setIsLoading(false);
      });
  }, [sortBy, sortOrder]);

  // Debounce search query using ref to avoid re-renders
  const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    // Set new timer
    searchTimerRef.current = setTimeout(() => {
      refreshWaitlists(value, false);
    }, 300);
  }, [refreshWaitlists]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // Initial load
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

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to desc for new column
    }
    setShowSortDropdown(false);
  };

  const getSortLabel = (sortBy: SortBy) => {
    switch (sortBy) {
      case 'name': return 'Name';
      case 'createdAt': return 'Created Date';
      case 'totalParticipants': return 'Participants';
      default: return 'Sort';
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={5} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Waitlists"
          description="Manage your waitlists and view participants"
          primaryAction={
            <div className="flex items-center gap-2">
              <DropdownMenu open={showExportDropdown} onOpenChange={setShowExportDropdown}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={exporting}
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="right">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('xlsx')}>XLSX</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('doc')}>DOC</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href={routes.create}>
                <Button leftIcon={<Plus className="h-4 w-4" />}>New waitlist</Button>
              </Link>
            </div>
          }
        />

        <DataToolbar>
          <DataToolbarSection>
            <div className="relative flex-1 max-w-md">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search waitlists..."
                value={searchQuery}
                onChange={handleSearchChange}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
          </DataToolbarSection>
          <DataToolbarSection align="end">
            <div className="relative">
              <DropdownMenu open={showSortDropdown} onOpenChange={setShowSortDropdown}>
                <DropdownMenuTrigger>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ArrowUpDown className="h-4 w-4" />}
                  >
                    {getSortLabel(sortBy)} {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="right">
                  <DropdownMenuItem onClick={() => handleSort('name')}>
                    <span className="flex-1">Name</span>
                    {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('createdAt')}>
                    <span className="flex-1">Created Date</span>
                    {sortBy === 'createdAt' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('totalParticipants')}>
                    <span className="flex-1">Participants</span>
                    {sortBy === 'totalParticipants' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DataToolbarSection>
        </DataToolbar>

        {error && (
          <ErrorState
            title="Unable to load waitlists"
            description={error}
            onRetry={() => window.location.reload()}
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
    </PageContainer>
  );
}
