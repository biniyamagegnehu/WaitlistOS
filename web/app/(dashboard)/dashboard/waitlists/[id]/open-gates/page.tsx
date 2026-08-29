"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { OpenTheGates } from "@/components/dashboard/OpenTheGates";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function OpenGatesPage() {
  const params = useParams();
  const router = useRouter();
  const waitlistId = params?.id as string;

  if (!waitlistId) {
    return (
      <PageContainer>
        <EmptyState
          title="Invalid waitlist"
          description="The waitlist ID is missing."
          action={
            <Button onClick={() => window.location.reload()}>Try again</Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Open The Gates"
        description="Invite participants from your waitlist in batches"
        breadcrumbs={[
          { label: "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Open The Gates" },
        ]}
      />

      <OpenTheGates waitlistId={waitlistId} />
    </PageContainer>
  );
}
