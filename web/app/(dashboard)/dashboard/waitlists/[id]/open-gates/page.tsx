"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OpenTheGates } from "@/components/dashboard/OpenTheGates";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function OpenGatesPage() {
  const params = useParams();
  const waitlistId = params?.id as string;

  if (!waitlistId) {
    return (
      <EmptyState
        title="Invalid waitlist"
        description="The waitlist ID is missing."
        action={
          <Button onClick={() => window.location.reload()}>Try again</Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <SectionHeader
          title="Open The Gates"
          description="Invite participants from your waitlist in batches"
        />
      </div>

      <OpenTheGates waitlistId={waitlistId} />
    </div>
  );
}
