"use client";

import * as React from "react";
import {
  Sparkles,
  RefreshCw,
  Save,
  History,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Wand2,
  Loader2,
  MessageSquareQuote,
  Lightbulb,
  HelpCircle,
  MousePointerClick,
  Type,
  AlignLeft,
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  copywriterSchema,
  type CopywriterFormData,
} from "@/lib/validations/copywriter";
import {
  generateCopy,
  getCopy,
  updateCopy,
  regenerateSection,
  getVersionHistory,
  restoreVersion,
} from "@/services/copywriter";
import type {
  WaitlistCopy,
  WaitlistCopyVersion,
  CopySection,
} from "@/types/copywriter";
import type { DashboardWaitlist } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";

interface AiCopywriterProps {
  waitlistId: string;
  waitlist: DashboardWaitlist;
}

export function AiCopywriter({ waitlistId, waitlist }: AiCopywriterProps) {
  const [copy, setCopy] = React.useState<WaitlistCopy | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [regeneratingSection, setRegeneratingSection] =
    React.useState<CopySection | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Version history
  const [showHistory, setShowHistory] = React.useState(false);
  const [versions, setVersions] = React.useState<WaitlistCopyVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState<string | null>(null);

  const form = useForm<CopywriterFormData>({
    resolver: zodResolver(copywriterSchema),
    defaultValues: {
      headline: "",
      subheadline: "",
      cta: "",
      features: [
        { title: "", description: "" },
        { title: "", description: "" },
        { title: "", description: "" },
      ],
      faqs: [
        { question: "", answer: "" },
        { question: "", answer: "" },
        { question: "", answer: "" },
        { question: "", answer: "" },
        { question: "", answer: "" },
      ],
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  // Load existing copy on mount
  React.useEffect(() => {
    getCopy(waitlistId)
      .then((data) => {
        if (data) {
          setCopy(data);
          reset({
            headline: data.headline,
            subheadline: data.subheadline,
            cta: data.cta,
            features: data.features,
            faqs: data.faqs,
          });
        }
      })
      .catch(() => {
        // No copy yet — that's fine
      })
      .finally(() => setIsLoading(false));
  }, [waitlistId, reset]);

  // Populate form when copy changes
  const populateForm = React.useCallback(
    (data: WaitlistCopy) => {
      setCopy(data);
      reset({
        headline: data.headline,
        subheadline: data.subheadline,
        cta: data.cta,
        features: data.features,
        faqs: data.faqs,
      });
    },
    [reset]
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const data = await generateCopy(waitlistId);
      populateForm(data);
      toast.success("Marketing copy generated successfully!");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Unable to generate copy. Please try again.")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (formData: CopywriterFormData) => {
    setIsSaving(true);
    try {
      const data = await updateCopy(waitlistId, formData);
      populateForm(data);
      toast.success("Copy saved successfully!");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save copy."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateSection = async (section: CopySection) => {
    setRegeneratingSection(section);
    try {
      const data = await regenerateSection(waitlistId, section);
      populateForm(data);
      toast.success(
        `${section.charAt(0).toUpperCase() + section.slice(1)} regenerated!`
      );
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, `Failed to regenerate ${section}.`)
      );
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleShowHistory = async () => {
    setShowHistory(true);
    setIsLoadingVersions(true);
    try {
      const data = await getVersionHistory(waitlistId);
      setVersions(data);
    } catch (err) {
      toast.error("Failed to load version history.");
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    setIsRestoring(versionId);
    try {
      const data = await restoreVersion(waitlistId, versionId);
      populateForm(data);
      setShowHistory(false);
      toast.success("Version restored successfully!");
    } catch (err) {
      toast.error("Failed to restore version.");
    } finally {
      setIsRestoring(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton variant="rectangular" className="h-8 w-48" />
            <Skeleton variant="rectangular" className="h-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Empty state — no copy generated yet ─────────────────────────
  if (!copy && !isGenerating) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <CardContent className="relative p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 ring-1 ring-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Landing Page Content
              </h3>
              <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
                Generate professional, high-converting marketing copy for your
                waitlist landing page in seconds. Our AI uses your product info
                to craft compelling content.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1">
                <Type className="h-3 w-3" /> Headlines
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1">
                <Lightbulb className="h-3 w-3" /> Feature Highlights
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1">
                <HelpCircle className="h-3 w-3" /> FAQs
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1">
                <MousePointerClick className="h-3 w-3" /> CTA
              </span>
            </div>
            <Button
              onClick={handleGenerate}
              size="lg"
              className="mt-2 gap-2"
              leftIcon={<Wand2 className="h-4 w-4" />}
            >
              Generate Marketing Copy
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Generating state ────────────────────────────────────────────
  if (isGenerating && !copy) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 animate-pulse" />
        <CardContent className="relative p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 animate-spin-slow">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Generating marketing copy...
              </h3>
              <p className="text-sm text-muted-foreground">
                Crafting high-converting content for{" "}
                <span className="font-medium text-foreground">
                  {waitlist.name}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              This usually takes 10–20 seconds
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Copy editor ─────────────────────────────────────────────────
  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                <Sparkles className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Landing Page Content
                </h3>
                <p className="text-xs text-muted-foreground">
                  Last generated{" "}
                  {copy
                    ? new Date(copy.generatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowHistory}
                leftIcon={<History className="h-3.5 w-3.5" />}
              >
                History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <form
              onSubmit={handleSubmit(handleSave)}
              className="mt-6 space-y-6"
            >
              {/* ── Headline ─────────────────────────────────── */}
              <SectionCard
                icon={<Type className="h-4 w-4" />}
                title="Hero Headline"
                section="headline"
                isRegenerating={regeneratingSection === "headline"}
                onRegenerate={() => handleRegenerateSection("headline")}
              >
                <Input
                  {...register("headline")}
                  placeholder="Your compelling headline"
                  error={errors.headline?.message}
                />
              </SectionCard>

              {/* ── Subheadline ───────────────────────────────── */}
              <SectionCard
                icon={<AlignLeft className="h-4 w-4" />}
                title="Hero Subheadline"
                section="subheadline"
                isRegenerating={regeneratingSection === "subheadline"}
                onRegenerate={() => handleRegenerateSection("subheadline")}
              >
                <Textarea
                  {...register("subheadline")}
                  placeholder="A supporting sentence that expands on the headline"
                  rows={2}
                  error={errors.subheadline?.message}
                />
              </SectionCard>

              {/* ── CTA ───────────────────────────────────────── */}
              <SectionCard
                icon={<MousePointerClick className="h-4 w-4" />}
                title="CTA Button Text"
                section="cta"
                isRegenerating={regeneratingSection === "cta"}
                onRegenerate={() => handleRegenerateSection("cta")}
              >
                <Input
                  {...register("cta")}
                  placeholder="Join the Waitlist"
                  error={errors.cta?.message}
                />
              </SectionCard>

              {/* ── Features ──────────────────────────────────── */}
              <SectionCard
                icon={<Lightbulb className="h-4 w-4" />}
                title="Feature Highlights"
                section="features"
                isRegenerating={regeneratingSection === "features"}
                onRegenerate={() => handleRegenerateSection("features")}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  {[0, 1, 2].map((idx) => (
                    <div
                      key={idx}
                      className="space-y-2 rounded-lg border border-border/40 bg-surface-muted/30 p-4"
                    >
                      <Input
                        {...register(`features.${idx}.title`)}
                        placeholder={`Feature ${idx + 1} title`}
                        error={errors.features?.[idx]?.title?.message}
                      />
                      <Textarea
                        {...register(`features.${idx}.description`)}
                        placeholder="Feature description"
                        rows={2}
                        error={errors.features?.[idx]?.description?.message}
                      />
                    </div>
                  ))}
                </div>
                {errors.features?.message && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.features.message}
                  </p>
                )}
              </SectionCard>

              {/* ── FAQs ──────────────────────────────────────── */}
              <SectionCard
                icon={<HelpCircle className="h-4 w-4" />}
                title="Frequently Asked Questions"
                section="faqs"
                isRegenerating={regeneratingSection === "faqs"}
                onRegenerate={() => handleRegenerateSection("faqs")}
              >
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border/40 bg-surface-muted/30 p-4 space-y-2"
                    >
                      <Input
                        {...register(`faqs.${idx}.question`)}
                        placeholder={`Question ${idx + 1}`}
                        error={errors.faqs?.[idx]?.question?.message}
                      />
                      <Textarea
                        {...register(`faqs.${idx}.answer`)}
                        placeholder="Answer"
                        rows={2}
                        error={errors.faqs?.[idx]?.answer?.message}
                      />
                    </div>
                  ))}
                </div>
                {errors.faqs?.message && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.faqs.message}
                  </p>
                )}
              </SectionCard>

              {/* ── Actions ───────────────────────────────────── */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  type="submit"
                  loading={isSaving}
                  disabled={!isDirty}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  loading={isGenerating}
                  onClick={handleGenerate}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                >
                  Regenerate All
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── Version History Dialog ────────────────────────────── */}
      <Dialog open={showHistory} onClose={() => setShowHistory(false)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
          </DialogHeader>
          <DialogBody className="overflow-y-auto flex-1">
            {isLoadingVersions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" className="h-20" />
                ))}
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No version history yet. Versions are created when you save or
                regenerate copy.
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-lg border border-border/50 bg-surface-muted/30 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {version.headline}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {version.subheadline}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Badge variant="default">
                            {new Date(version.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {version.features
                              ? `${(version.features as any[]).length} features`
                              : ""}{" "}
                            ·{" "}
                            {version.faqs
                              ? `${(version.faqs as any[]).length} FAQs`
                              : ""}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={isRestoring === version.id}
                        onClick={() => handleRestore(version.id)}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                      >
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowHistory(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Section Card sub-component ───────────────────────────────────

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  section: CopySection;
  isRegenerating: boolean;
  onRegenerate: () => void;
  children: React.ReactNode;
}

function SectionCard({
  icon,
  title,
  section,
  isRegenerating,
  onRegenerate,
  children,
}: SectionCardProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={isRegenerating}
          onClick={onRegenerate}
          className="h-7 text-xs"
          leftIcon={<RefreshCw className="h-3 w-3" />}
        >
          Regenerate
        </Button>
      </div>
      {children}
    </div>
  );
}
