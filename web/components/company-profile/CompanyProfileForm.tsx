"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { companyProfileSchema, type CompanyProfileFormData } from "@/lib/validations/company-profile";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

const INDUSTRIES = [
  "SaaS",
  "Artificial Intelligence",
  "FinTech",
  "HealthTech",
  "E-commerce",
  "Education",
  "Developer Tools",
  "Marketing",
  "Other",
] as const;

const TEAM_SIZES = [
  "Solo Founder",
  "2–5 Employees",
  "6–20 Employees",
  "21–50 Employees",
  "50+ Employees",
] as const;

export interface CompanyProfileFormProps {
  mode: "create" | "edit";
  initialValues?: {
    companyName?: string;
    industry?: string;
    companyDescription?: string;
    country?: string;
    teamSize?: string;
    companyLogo?: string;
    companyWebsite?: string;
  };
  onSubmit: (data: CompanyProfileFormData) => Promise<void>;
  submitButtonText: string;
  serverError?: string;
}

export function CompanyProfileForm({
  mode,
  initialValues,
  onSubmit,
  submitButtonText,
  serverError = "",
}: CompanyProfileFormProps) {
  const [companyLogo, setCompanyLogo] = React.useState<string | null>(
    initialValues?.companyLogo || null
  );

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: initialValues?.companyName || "",
      industry: (initialValues?.industry || "SaaS") as any,
      companyDescription: initialValues?.companyDescription || "",
      country: initialValues?.country || "",
      teamSize: (initialValues?.teamSize || "Solo Founder") as any,
      companyLogo: initialValues?.companyLogo || "",
      companyWebsite: initialValues?.companyWebsite || "",
    },
    mode: "onSubmit",
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    // TODO: Implement file upload using existing file system
    if (file) {
      setCompanyLogo(URL.createObjectURL(file));
    }
  };

  const onFormSubmit = async (data: CompanyProfileFormData) => {
    const payload = {
      ...data,
      companyLogo: companyLogo || undefined,
      companyWebsite: data.companyWebsite || undefined,
    };
    await onSubmit(payload);
  };

  const handleFormSubmit = async () => {
    // Trigger validation for all form fields
    const isValid = await trigger();
    
    // Only proceed if all validations pass
    if (isValid) {
      handleSubmit(onFormSubmit)();
    }
  };

  return (
    <Card>
      <CardContent className="p-8">
        <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit(); }} className="space-y-5">
          <Input
            label="Company name"
            placeholder="Acme Inc."
            error={errors.companyName?.message}
            {...register("companyName")}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Industry <span className="text-destructive">*</span>
            </label>
            <select
              {...register("industry")}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="text-sm text-destructive">{errors.industry.message}</p>
            )}
          </div>

          <Textarea
            label="Company description"
            rows={3}
            placeholder="Brief description of your company (max 250 characters)"
            error={errors.companyDescription?.message}
            {...register("companyDescription")}
            required
            maxLength={250}
          />
          <p className="text-xs text-muted-foreground text-right">
            {watch("companyDescription")?.length || 0}/250
          </p>

          <Input
            label="Country"
            placeholder="United States"
            error={errors.country?.message}
            {...register("country")}
            required
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Team size <span className="text-destructive">*</span>
            </label>
            <select
              {...register("teamSize")}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {TEAM_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            {errors.teamSize && (
              <p className="text-sm text-destructive">{errors.teamSize.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Company logo
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface-muted px-6 py-8 transition-colors hover:bg-surface">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Logo preview"
                  className="h-24 w-24 rounded-md object-cover"
                />
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    PNG, JPEG, JPG, or WEBP up to 5MB
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Upload your company logo using the existing file system
            </p>
          </div>

          <Input
            label="Company website"
            placeholder="https://example.com"
            error={errors.companyWebsite?.message}
            {...register("companyWebsite")}
          />

          {serverError && (
            <Alert variant="error" title="Error">
              {serverError}
            </Alert>
          )}

          <Button type="submit" className="w-full" loading={isSubmitting}>
            {submitButtonText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
