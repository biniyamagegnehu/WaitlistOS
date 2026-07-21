"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/auth-context";
import { companyProfileService } from "@/services/company-profile";
import { getApiErrorMessage } from "@/lib/errors";
import { CompanyProfileForm } from "@/components/company-profile/CompanyProfileForm";
import type { CompanyProfileFormData } from "@/lib/validations/company-profile";
import { LoadingScreen } from "@/components/layouts/loading-screen";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, founder } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [serverError, setServerError] = React.useState("");
  const [initialValues, setInitialValues] = React.useState<{
    companyName?: string;
    industry?: string;
    companyDescription?: string;
    country?: string;
    teamSize?: string;
    companyLogo?: string;
    companyWebsite?: string;
  }>({});

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        if (founder?.companyName) {
          setIsEditMode(true);
          const profile = await companyProfileService.getCompanyProfile();
          setInitialValues({
            companyName: profile.companyName || "",
            industry: profile.industry || "SaaS",
            companyDescription: profile.companyDescription || "",
            country: profile.country || "",
            teamSize: profile.teamSize || "Solo Founder",
            companyLogo: profile.companyLogo || "",
            companyWebsite: profile.companyWebsite || "",
          });
        }
      } catch (err) {
        console.error("Failed to load company profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [founder]);

  const onSubmit = async (data: CompanyProfileFormData) => {
    setServerError("");
    try {
      if (isEditMode) {
        await companyProfileService.updateCompanyProfile(data);
        toast.success("Company profile updated successfully");
      } else {
        await companyProfileService.createCompanyProfile(data);
        toast.success("Company profile completed successfully");
      }
      
      router.replace("/dashboard");
    } catch (err) {
      const errorMessage = getApiErrorMessage(err, isEditMode ? "Failed to update company profile" : "Failed to complete company profile");
      setServerError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-foreground">
            {isEditMode ? "Edit company profile" : "Complete your company profile"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isEditMode 
              ? "Update your company information"
              : "Tell us about your company before creating waitlists"
            }
          </p>
        </div>

        <CompanyProfileForm
          mode={isEditMode ? "edit" : "create"}
          initialValues={initialValues}
          onSubmit={onSubmit}
          submitButtonText={isEditMode ? "Update profile" : "Complete profile"}
          serverError={serverError}
        />
      </div>
    </div>
  );
}
