"use client";

import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Sun, Moon, Monitor } from "lucide-react";
import { uploadFile } from "@/services/files";
import { getApiErrorMessage } from "@/lib/errors";
import toast from "react-hot-toast";
import {
  createWaitlistSchema,
  validateLogoFile,
  type CreateWaitlistFormData,
} from "@/lib/validations/waitlist";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

export interface WaitlistFormProps {
  mode: "create" | "edit";
  initialValues?: {
    name?: string;
    tagline?: string;
    description?: string;
    logoUrl?: string | null;
    slug?: string;
    themeMode?: "SYSTEM" | "LIGHT" | "DARK";
  };
  onSubmit: (data: CreateWaitlistFormData & { logoId?: string; slug?: string; themeMode?: "SYSTEM" | "LIGHT" | "DARK" }) => Promise<void>;
  submitButtonText: string;
  serverError?: string;
}

export function WaitlistForm({
  mode,
  initialValues,
  onSubmit,
  submitButtonText,
  serverError = "",
}: WaitlistFormProps) {
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(
    initialValues?.logoUrl || null
  );
  const [logoError, setLogoError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<CreateWaitlistFormData & { slug?: string }>({
    resolver: zodResolver(createWaitlistSchema),
    defaultValues: {
      name: initialValues?.name || "",
      tagline: initialValues?.tagline || "",
      description: initialValues?.description || "",
      slug: initialValues?.slug || "",
      themeMode: initialValues?.themeMode || "SYSTEM",
    },
    mode: "onSubmit",
  });

  React.useEffect(() => {
    return () => {
      if (logoPreview && !initialValues?.logoUrl) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview, initialValues?.logoUrl]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoError(validateLogoFile(file));

    if (logoPreview && !initialValues?.logoUrl) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : initialValues?.logoUrl || null);
  };

  const onFormSubmit = async (data: CreateWaitlistFormData) => {
    setLogoError(null);

    // For create mode, logo is required - validate first before any other processing
    if (mode === "create") {
      const validationError = validateLogoFile(logoFile);
      if (validationError) {
        setLogoError(validationError);
        toast.error(validationError);
        return;
      }

      try {
        const uploaded = await uploadFile(logoFile as File);
        await onSubmit({ ...data, logoId: uploaded.id });
        toast.success(mode === "create" ? "Waitlist created successfully" : "Waitlist updated successfully");
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Failed to upload logo"));
        throw error;
      }
    } else {
      // For edit mode, logo is optional
      let logoId = undefined;
      if (logoFile) {
        try {
          const uploaded = await uploadFile(logoFile);
          logoId = uploaded.id;
        } catch (error: unknown) {
          toast.error(getApiErrorMessage(error, "Failed to upload logo"));
          throw error;
        }
      }
      try {
        await onSubmit({ ...data, logoId });
        toast.success("Waitlist updated successfully");
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Failed to update waitlist"));
        throw error;
      }
    }
  };

  const handleFormSubmit = async () => {
    // Validate logo first for create mode
    if (mode === "create") {
      const validationError = validateLogoFile(logoFile);
      if (validationError) {
        setLogoError(validationError);
      }
    }

    // Trigger validation for all form fields
    const isValid = await trigger();
    
    // Check if logo validation passed for create mode
    if (mode === "create") {
      const validationError = validateLogoFile(logoFile);
      if (validationError) {
        setLogoError(validationError);
        return;
      }
    }

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
            label="Product name"
            placeholder="My Awesome Product"
            error={errors.name?.message}
            {...register("name")}
            required
          />

          <Input
            label="Tagline"
            placeholder="Join the waitlist for early access"
            error={errors.tagline?.message}
            {...register("tagline")}
            required
          />

          <Textarea
            label="Description"
            rows={4}
            placeholder="Tell visitors what your product is about"
            error={errors.description?.message}
            {...register("description")}
          />

          {mode === "edit" && (
            <Input
              label="Slug"
              placeholder={initialValues?.slug}
              error={errors.slug?.message}
              {...register("slug")}
            />
          )}

          {mode === "edit" && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-foreground">Theme</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose how your public waitlist handles light and dark mode.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-border bg-background p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground">
                  <input type="radio" value="SYSTEM" className="peer sr-only" {...register("themeMode")} />
                  <div className="pointer-events-none absolute inset-0 rounded-md border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5" />
                  <Monitor className="z-10 mb-2 h-5 w-5 text-muted-foreground peer-checked:text-primary" />
                  <span className="z-10 text-sm font-medium text-foreground">System</span>
                </label>
                <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-border bg-background p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground">
                  <input type="radio" value="LIGHT" className="peer sr-only" {...register("themeMode")} />
                  <div className="pointer-events-none absolute inset-0 rounded-md border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5" />
                  <Sun className="z-10 mb-2 h-5 w-5 text-muted-foreground peer-checked:text-primary" />
                  <span className="z-10 text-sm font-medium text-foreground">Light</span>
                </label>
                <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-border bg-background p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground">
                  <input type="radio" value="DARK" className="peer sr-only" {...register("themeMode")} />
                  <div className="pointer-events-none absolute inset-0 rounded-md border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary/5" />
                  <Moon className="z-10 mb-2 h-5 w-5 text-muted-foreground peer-checked:text-primary" />
                  <span className="z-10 text-sm font-medium text-foreground">Dark</span>
                </label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Logo {mode === "create" && <span className="text-destructive">*</span>}
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface-muted px-6 py-8 transition-colors hover:bg-surface">
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  width={96}
                  height={96}
                  unoptimized
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
            {logoError && <p className="text-sm text-destructive">{logoError}</p>}
            {mode === "edit" && (
              <p className="text-xs text-muted-foreground">
                Leave empty to keep the current logo
              </p>
            )}
          </div>

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
