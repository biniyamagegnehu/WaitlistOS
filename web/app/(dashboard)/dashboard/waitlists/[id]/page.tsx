"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ParticipantTable } from "@/components/dashboard/ParticipantTable";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import type { DashboardWaitlistDetail } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function WaitlistDetailPage() {
  const params = useParams();
  const waitlistId = params?.id as string;

  const [detail, setDetail] = React.useState<DashboardWaitlistDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!waitlistId) return;

    getDashboardWaitlistDetail(waitlistId)
      .then(setDetail)
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load waitlist"));
      })
      .finally(() => setIsLoading(false));
  }, [waitlistId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-10 w-72" />
        <Skeleton variant="rectangular" className="h-64" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <EmptyState
        title="Waitlist not found"
        description={error ?? "This waitlist could not be loaded."}
        action={
          <Link href={routes.waitlists}>
            <Button variant="secondary">Back to waitlists</Button>
          </Link>
        }
      />
    );
  }

  const { waitlist, participants } = detail;

  return (
    <div className="space-y-6">
      <Link
        href={routes.waitlists}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to waitlists
      </Link>

      <SectionHeader
        title={waitlist.name}
        description={`/${waitlist.slug}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="success">
              {waitlist.totalParticipants}{" "}
              {waitlist.totalParticipants === 1 ? "signup" : "signups"}
            </Badge>
            <Link
              href={routes.waitlistPublic(waitlist.slug)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="h-3.5 w-3.5" />}>
                View page
              </Button>
            </Link>
            <ExportButton waitlistId={waitlist.id} />
          </div>
        }
      />

      <ParticipantTable participants={participants} />
    </div>
  );
}
