"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import type { CreateWaitlistFormData } from "@/lib/validations/waitlist";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { getDashboardWaitlistDetail, updateWaitlist } from "@/services/dashboard";
import type { DashboardWaitlistDetail } from "@/types/dashboard";

export default function EditWaitlistPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const waitlistId = params?.id as string;
  const [serverError, setServerError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [waitlistData, setWaitlistData] = React.useState<DashboardWaitlistDetail | null>(null);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  React.useEffect(() => {
    if (!waitlistId) return;

    const fetchWaitlist = async () => {
      try {
        const data = await getDashboardWaitlistDetail(waitlistId);
        setWaitlistData(data);
      } catch (error: unknown) {
        setServerError(getApiErrorMessage(error, "Failed to load waitlist"));
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchWaitlist();
  }, [waitlistId]);

  const onSubmit = async (data: CreateWaitlistFormData & { logoId?: string; slug?: string; themeMode?: "SYSTEM" | "LIGHT" | "DARK" }) => {
    setServerError("");

    try {
      const updateData: {
        name?: string;
        tagline?: string;
        description?: string;
        slug?: string;
        logoId?: string;
        themeMode?: "SYSTEM" | "LIGHT" | "DARK";
      } = {
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        slug: data.slug,
        themeMode: data.themeMode,
      };

      if (data.logoId) {
        updateData.logoId = data.logoId;
      }

      await updateWaitlist(waitlistId, updateData);
      setSuccess(true);
    } catch (error: unknown) {
      setServerError(getApiErrorMessage(error, "Failed to update waitlist"));
      throw error;
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={1} />
      </PageContainer>
    );
  }

  if (isLoadingData) {
    return (
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={3} />
      </PageContainer>
    );
  }

  if (serverError && !waitlistData) {
    return (
      <PageContainer>
        <ErrorState
          title="Failed to load waitlist"
          description={serverError}
          onHome={() => router.push(routes.waitlists)}
        />
      </PageContainer>
    );
  }

  if (success) {
    return (
      <PageContainer>
        <div className="rounded-lg border border-success/20 bg-success/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
              <svg className="h-6 w-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Success</h3>
              <p className="text-sm text-text-muted">Waitlist updated successfully!</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Link href={routes.waitlist(waitlistId)} className="flex-1">
              <Button className="w-full">View waitlist</Button>
            </Link>
            <Link href={routes.waitlists} className="flex-1">
              <Button variant="secondary" className="w-full">
                Back to waitlists
              </Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Edit waitlist"
        description="Update your waitlist information."
        breadcrumbs={[
          { label: "Waitlists", href: routes.waitlists },
          { label: waitlistData?.waitlist.name || "Waitlist", href: routes.waitlist(waitlistId) },
          { label: "Edit" },
        ]}
      />

      <WaitlistForm
        mode="edit"
        initialValues={{
          name: waitlistData?.waitlist.name,
          tagline: waitlistData?.waitlist.tagline,
          description: waitlistData?.waitlist.description || "",
          logoUrl: waitlistData?.waitlist.logoUrl || null,
          slug: waitlistData?.waitlist.slug,
          themeMode: waitlistData?.waitlist.themeMode || "SYSTEM",
        }}
        onSubmit={onSubmit}
        submitButtonText="Save changes"
        serverError={serverError}
      />
    </PageContainer>
  );
}
