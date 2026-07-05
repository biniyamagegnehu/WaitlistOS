"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Copy, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createWaitlist } from "@/services/api";
import { uploadFile } from "@/services/files";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import {
  createWaitlistSchema,
  validateLogoFile,
  type CreateWaitlistFormData,
} from "@/lib/validations/waitlist";
import type { CreateWaitlistResponse } from "@/types/waitlist";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { Textarea } from "@/components/ui/textarea";

export default function CreateWaitlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState("");
  const [result, setResult] = React.useState<CreateWaitlistResponse | null>(null);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateWaitlistFormData>({
    resolver: zodResolver(createWaitlistSchema),
  });

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  React.useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setLogoError(validateLogoFile(file));

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
    }

    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const onSubmit = async (data: CreateWaitlistFormData) => {
    setServerError("");

    const validationError = validateLogoFile(logoFile);
    if (validationError) {
      setLogoError(validationError);
      return;
    }

    try {
      const uploaded = await uploadFile(logoFile as File);
      const response = await createWaitlist({
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        logoId: uploaded.id,
      });

      setResult(response);
    } catch (error: unknown) {
      setServerError(getApiErrorMessage(error, "Failed to create waitlist"));
    }
  };

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  if (result) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-2xl space-y-6">
          <Alert variant="success" title="Waitlist created">
            Your hosted page and widget embed code are ready.
          </Alert>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{result.waitlist.name}</h1>
                <p className="mt-1 text-muted-foreground">{result.waitlist.tagline}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Slug: <span className="font-mono text-foreground">{result.waitlist.slug}</span>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Hosted page</p>
                <div className="flex gap-2">
                  <code className="flex-1 break-all rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
                    {result.hostedPage}
                  </code>
                  <Button
                    variant="secondary"
                    onClick={() => void handleCopy(result.hostedPage, "hosted")}
                  >
                    {copiedField === "hosted" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {result.widget?.embedCode && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Widget embed code</p>
                  <code className="block break-all rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
                    {result.widget.embedCode}
                  </code>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => void handleCopy(result.widget?.embedCode ?? "", "embed")}
                  >
                    {copiedField === "embed" ? "Copied!" : "Copy embed code"}
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={routes.waitlistPublic(result.waitlist.slug)} className="flex-1">
                  <Button className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View waitlist page
                  </Button>
                </Link>
                <Link href={routes.dashboard} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Go to dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-foreground">Create your waitlist</h1>
          <p className="mt-2 text-muted-foreground">
            Upload your logo and launch a hosted page in seconds.
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Logo</label>
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
              </div>

              {serverError && (
                <Alert variant="error" title="Error">
                  {serverError}
                </Alert>
              )}

              <Button type="submit" className="w-full" loading={isSubmitting}>
                Create waitlist
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
