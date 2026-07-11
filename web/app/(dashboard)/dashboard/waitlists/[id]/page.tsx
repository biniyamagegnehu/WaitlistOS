"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { ParticipantTable } from "@/components/dashboard/ParticipantTable";
import { ExportButton } from "@/components/dashboard/ExportButton";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  const [isExpanded, setIsExpanded] = React.useState(false);

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
            <Link href={routes.waitlistShare(waitlist.id)}>
              <Button variant="secondary" size="sm" leftIcon={<Share2 className="h-3.5 w-3.5" />}>
                Share
              </Button>
            </Link>
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

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Waitlist Information</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-base text-foreground">{waitlist.name}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tagline</p>
                  <p className="text-base text-foreground">{waitlist.tagline}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slug</p>
                  <p className="text-base text-foreground">/{waitlist.slug}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Signups</p>
                  <p className="text-base text-foreground">{waitlist.totalParticipants}</p>
                </div>
              </div>

              {waitlist.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-base text-foreground">{waitlist.description}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link href={routes.waitlistEdit(waitlist.id)} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Edit Waitlist
                  </Button>
                </Link>
                <Link href={routes.waitlistRewards(waitlist.id)} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Rewards
                  </Button>
                </Link>
                <Link href={routes.waitlistShare(waitlist.id)} className="flex-1">
                  <Button className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ParticipantTable participants={participants} />
    </div>
  );
}
