"use client";

import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { uploadFile } from "@/services/files";
import { getApiErrorMessage } from "@/lib/errors";
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
  };
  onSubmit: (data: CreateWaitlistFormData & { logoId?: string; slug?: string }) => Promise<void>;
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
    formState: { errors, isSubmitting },
  } = useForm<CreateWaitlistFormData & { slug?: string }>({
    resolver: zodResolver(createWaitlistSchema),
    defaultValues: {
      name: initialValues?.name || "",
      tagline: initialValues?.tagline || "",
      description: initialValues?.description || "",
      slug: initialValues?.slug || "",
    },
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

    // For create mode, logo is required
    if (mode === "create") {
      const validationError = validateLogoFile(logoFile);
      if (validationError) {
        setLogoError(validationError);
        return;
      }

      try {
        const uploaded = await uploadFile(logoFile as File);
        await onSubmit({ ...data, logoId: uploaded.id });
      } catch (error: unknown) {
        throw error;
      }
    } else {
      // For edit mode, logo is optional
      let logoId = undefined;
      if (logoFile) {
        const uploaded = await uploadFile(logoFile);
        logoId = uploaded.id;
      }
      await onSubmit({ ...data, logoId });
    }
  };

  return (
    <Card>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
          <Input
            label="Product name"
            placeholder="My Awesome Product"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label="Tagline"
            placeholder="Join the waitlist for early access"
            error={errors.tagline?.message}
            {...register("tagline")}
          />

          <Textarea
            label="Description (optional)"
            rows={4}
            placeholder="Tell visitors what your product is about"
            error={errors.description?.message}
            {...register("description")}
          />

          {mode === "edit" && (
            <Input
              label="Slug (optional)"
              placeholder={initialValues?.slug}
              error={errors.slug?.message}
              {...register("slug")}
            />
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
