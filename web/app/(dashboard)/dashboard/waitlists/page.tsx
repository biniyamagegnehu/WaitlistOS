"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { WaitlistCard } from "@/components/dashboard/WaitlistCard";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardWaitlists } from "@/services/dashboard";
import type { DashboardWaitlist } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function WaitlistsPage() {
  const [waitlists, setWaitlists] = React.useState<DashboardWaitlist[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getDashboardWaitlists()
      .then(setWaitlists)
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load waitlists"));
      })
      .finally(() => setIsLoading(false));
  }, []);

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
          <Link href={routes.create}>
            <Button leftIcon={<Plus className="h-4 w-4" />}>New waitlist</Button>
          </Link>
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
            <WaitlistCard key={waitlist.id} waitlist={waitlist} />
          ))}
        </div>
      )}
    </div>
  );
}
