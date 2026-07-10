"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import type { CreateWaitlistFormData } from "@/lib/validations/waitlist";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
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

  const onSubmit = async (data: CreateWaitlistFormData & { logoId?: string; slug?: string }) => {
    setServerError("");

    try {
      const updateData: {
        name?: string;
        tagline?: string;
        description?: string;
        slug?: string;
        logoId?: string;
      } = {
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        slug: data.slug,
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
    return <LoadingScreen />;
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-foreground">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (serverError && !waitlistData) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-xl">
          <Alert variant="error" title="Error">
            {serverError}
          </Alert>
          <Link href={routes.waitlists} className="mt-4 inline-block">
            <Button variant="secondary">Back to waitlists</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-xl">
          <Alert variant="success" title="Success">
            Waitlist updated successfully!
          </Alert>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <Link href={routes.waitlist(waitlistId)} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to waitlist
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-foreground">Edit waitlist</h1>
          <p className="mt-2 text-muted-foreground">
            Update your waitlist information.
          </p>
        </div>

        <WaitlistForm
          mode="edit"
          initialValues={{
            name: waitlistData?.name,
            tagline: waitlistData?.slug,
            description: waitlistData?.description || "",
            logoUrl: waitlistData?.logoUrl || null,
            slug: waitlistData?.slug,
          }}
          onSubmit={onSubmit}
          submitButtonText="Save changes"
          serverError={serverError}
        />
      </div>
    </div>
  );
}
