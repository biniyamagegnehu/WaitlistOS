"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Upload,
  Check,
  Copy,
  ExternalLink,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createWaitlist } from "@/services/api";
import { generateWaitlistWithAi } from "@/services/ai";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { cn } from "@/lib/cn";
import toast from "react-hot-toast";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

type CreationMode = "manual" | "ai";
type AiStep = "prompt" | "generating" | "review";

interface GeneratedData {
  productName: string;
  tagline: string;
  description: string;
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

const AI_STEPS = [
  { id: "prompt", label: "Describe" },
  { id: "generating", label: "Generate" },
  { id: "review", label: "Review & Create" },
];

function StepIndicator({ currentStep }: { currentStep: AiStep }) {
  const currentIndex = AI_STEPS.findIndex((s) => s.id === currentStep);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {AI_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  isCompleted &&
                    "bg-primary text-primary-foreground",
                  isActive &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !isCompleted &&
                    !isActive &&
                    "bg-surface-muted text-muted-foreground border border-border"
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < AI_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-12 mb-4 transition-colors duration-300",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── AI Prompt Step ──────────────────────────────────────────────────────────

function AiPromptStep({
  description,
  onChange,
  onGenerate,
  isGenerating,
}: {
  description: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Wand2 className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">
            Describe Your Product
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Our AI will instantly generate a compelling product name, tagline,
            and description for your waitlist.
          </p>
        </div>

        <Textarea
          placeholder="e.g. An AI accounting assistant for freelancers that automates invoices and taxes."
          rows={5}
          value={description}
          onChange={(e) => onChange(e.target.value)}
          disabled={isGenerating}
          className="resize-none"
        />

        <Button
          onClick={onGenerate}
          className="w-full"
          loading={isGenerating}
          disabled={isGenerating || !description.trim()}
        >
          {!isGenerating && <Sparkles className="h-4 w-4 mr-2" />}
          Generate Waitlist
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Generating Step ─────────────────────────────────────────────────────────

function GeneratingStep() {
  return (
    <Card>
      <CardContent className="p-12 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">
            Generating your waitlist...
          </p>
          <p className="text-sm text-muted-foreground">
            Our AI is crafting the perfect name, tagline, and description.
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Review & Edit Step ───────────────────────────────────────────────────────

function ReviewStep({
  generated,
  onBack,
  onRegenerate,
  isRegenerating,
  onCreateWaitlist,
}: {
  generated: GeneratedData;
  onBack: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onCreateWaitlist: (data: CreateWaitlistFormData & { logoId?: string }) => Promise<void>;
}) {
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState("");

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CreateWaitlistFormData>({
    resolver: zodResolver(createWaitlistSchema),
    defaultValues: {
      name: generated.productName,
      tagline: generated.tagline,
      description: generated.description,
    },
    mode: "onSubmit",
  });

  // Clean up object URL on unmount
  React.useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    const err = validateLogoFile(file);
    setLogoError(err);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const onFormSubmit = async (data: CreateWaitlistFormData) => {
    setServerError("");
    const logoValidation = validateLogoFile(logoFile);
    if (logoValidation) {
      setLogoError(logoValidation);
      toast.error(logoValidation);
      return;
    }
    try {
      const uploaded = await uploadFile(logoFile as File);
      await onCreateWaitlist({ ...data, logoId: uploaded.id });
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, "Failed to create waitlist");
      setServerError(msg);
    }
  };

  const handleFormSubmit = async () => {
    const logoValidation = validateLogoFile(logoFile);
    if (logoValidation) {
      setLogoError(logoValidation);
    }
    const isValid = await trigger();
    if (!isValid || validateLogoFile(logoFile)) return;
    handleSubmit(onFormSubmit)();
  };

  // Live preview values from watch — just show current form values via ref trick
  const nameRef = React.useRef(generated.productName);
  const taglineRef = React.useRef(generated.tagline);

  return (
    <div className="space-y-6">
      {/* Preview Card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 via-background to-background p-6 space-y-4">
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <Image
              src={logoPreview}
              alt="Logo preview"
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-xl object-cover border border-border shadow-sm"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border bg-surface-muted flex items-center justify-center flex-shrink-0">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                AI Generated
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground truncate">
              {generated.productName}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {generated.tagline}
            </p>
          </div>
        </div>
        {generated.description && (
          <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
            {generated.description}
          </p>
        )}
      </div>

      {/* Editable Fields */}
      <Card>
        <CardContent className="p-8">
          <div className="mb-5">
            <h3 className="text-base font-semibold text-foreground">
              Review & Edit
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Make any changes before creating your waitlist.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFormSubmit();
            }}
            className="space-y-5"
          >
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

            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Logo <span className="text-destructive">*</span>
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
              {logoError && (
                <p className="text-sm text-destructive">{logoError}</p>
              )}
            </div>

            {serverError && (
              <Alert variant="error" title="Error">
                {serverError}
              </Alert>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting || isRegenerating}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onRegenerate}
                loading={isRegenerating}
                disabled={isSubmitting || isRegenerating}
                leftIcon={!isRegenerating ? <RefreshCw className="h-4 w-4" /> : undefined}
              >
                Regenerate
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={isSubmitting}
                disabled={isSubmitting || isRegenerating}
                leftIcon={!isSubmitting ? <Sparkles className="h-4 w-4" /> : undefined}
              >
                Create Waitlist
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CreateWaitlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Mode: manual or ai
  const [creationMode, setCreationMode] = React.useState<CreationMode>("manual");

  // Manual tab state
  const [serverError, setServerError] = React.useState("");
  const [result, setResult] = React.useState<CreateWaitlistResponse | null>(null);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // AI tab state
  const [aiStep, setAiStep] = React.useState<AiStep>("prompt");
  const [aiDescription, setAiDescription] = React.useState("");
  const [generatedData, setGeneratedData] = React.useState<GeneratedData | null>(null);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  // ── Manual handlers ────────────────────────────────────────────────────────

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const handleManualSubmit = async (
    data: CreateWaitlistFormData & { logoId?: string; slug?: string }
  ) => {
    setServerError("");
    if (!data.logoId) {
      setServerError("Logo is required");
      return;
    }
    const response = await createWaitlist({
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      logoId: data.logoId,
    });
    setResult(response);
  };

  // ── AI handlers ────────────────────────────────────────────────────────────

  const runGeneration = async (description: string): Promise<GeneratedData | null> => {
    try {
      const gen = await generateWaitlistWithAi(description);
      return {
        productName: gen.productName || "",
        tagline: gen.tagline || "",
        description: gen.description || "",
      };
    } catch (error) {
      toast.error("Unable to generate suggestions. Please try again.");
      console.error(error);
      return null;
    }
  };

  const handleGenerateAi = async () => {
    if (!aiDescription.trim()) {
      toast.error("Please describe your product first");
      return;
    }
    setAiStep("generating");
    const data = await runGeneration(aiDescription);
    if (data) {
      setGeneratedData(data);
      setAiStep("review");
    } else {
      // stay on prompt on failure
      setAiStep("prompt");
    }
  };

  const handleRegenerate = async () => {
    if (!aiDescription.trim()) return;
    setIsRegenerating(true);
    const data = await runGeneration(aiDescription);
    if (data) {
      setGeneratedData(data);
      toast.success("New suggestions generated!");
    }
    setIsRegenerating(false);
  };

  const handleAiBack = () => {
    setAiStep("prompt");
  };

  const handleAiCreateWaitlist = async (
    data: CreateWaitlistFormData & { logoId?: string }
  ) => {
    if (!data.logoId) throw new Error("Logo is required");
    const response = await createWaitlist({
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      logoId: data.logoId,
    });
    toast.success("Waitlist created successfully!");
    // Reset AI state for next use
    setAiStep("prompt");
    setAiDescription("");
    setGeneratedData(null);
    // Redirect to the new waitlist dashboard
    router.push(routes.waitlist(response.waitlist.id));
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isLoading || !isAuthenticated) {
    return <LoadingScreen />;
  }

  // Manual success screen
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
                <h1 className="text-2xl font-semibold text-foreground">
                  {result.waitlist.name}
                </h1>
                <p className="mt-1 text-muted-foreground">
                  {result.waitlist.tagline}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Slug:{" "}
                  <span className="font-mono text-foreground">
                    {result.waitlist.slug}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Hosted page
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 break-all rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
                    {result.hostedPage}
                  </code>
                  <Button
                    variant="secondary"
                    onClick={() => void handleCopy(result.hostedPage, "hosted")}
                  >
                    {copiedField === "hosted" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {result.widget?.embedCode && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Widget embed code
                  </p>
                  <code className="block break-all rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
                    {result.widget.embedCode}
                  </code>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() =>
                      void handleCopy(result.widget?.embedCode ?? "", "embed")
                    }
                  >
                    {copiedField === "embed" ? "Copied!" : "Copy embed code"}
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={routes.waitlistPublic(result.waitlist.slug)}
                  className="flex-1"
                >
                  <Button className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View waitlist page
                  </Button>
                </Link>
                <Link href={routes.waitlist(result.waitlist.id)} className="flex-1">
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
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-foreground">
            Create your waitlist
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload your logo and launch a hosted page in seconds.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="mb-8 flex rounded-lg border border-border p-1 bg-surface-muted">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              creationMode === "manual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setCreationMode("manual")}
          >
            Create manually
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              creationMode === "ai"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setCreationMode("ai")}
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </button>
        </div>

        {/* Content */}
        {creationMode === "manual" ? (
          <WaitlistForm
            mode="create"
            onSubmit={handleManualSubmit}
            submitButtonText="Create waitlist"
            serverError={serverError}
          />
        ) : (
          <div>
            {/* Step Indicator (only when not on prompt) */}
            {aiStep !== "generating" && (
              <StepIndicator currentStep={aiStep} />
            )}

            {aiStep === "prompt" && (
              <AiPromptStep
                description={aiDescription}
                onChange={setAiDescription}
                onGenerate={handleGenerateAi}
                isGenerating={false}
              />
            )}

            {aiStep === "generating" && <GeneratingStep />}

            {aiStep === "review" && generatedData && (
              <ReviewStep
                generated={generatedData}
                onBack={handleAiBack}
                onRegenerate={handleRegenerate}
                isRegenerating={isRegenerating}
                onCreateWaitlist={handleAiCreateWaitlist}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
