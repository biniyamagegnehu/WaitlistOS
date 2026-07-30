"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createWaitlist } from "@/services/api";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import type { CreateWaitlistFormData } from "@/lib/validations/waitlist";
import type { CreateWaitlistResponse } from "@/types/waitlist";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { LoadingScreen } from "@/components/layouts/loading-screen";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";
import { generateWaitlistWithAi } from "@/services/ai";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

export default function CreateWaitlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [serverError, setServerError] = React.useState("");
  const [result, setResult] = React.useState<CreateWaitlistResponse | null>(null);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // AI Builder state
  const [creationMode, setCreationMode] = React.useState<"manual" | "ai">("manual");
  const [aiDescription, setAiDescription] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [initialValues, setInitialValues] = React.useState<{
    name?: string;
    tagline?: string;
    description?: string;
  }>({});

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(routes.login);
    }
  }, [isAuthenticated, isLoading, router]);

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateAi = async () => {
    if (!aiDescription.trim()) {
      toast.error("Please describe your product first");
      return;
    }
    
    setIsGenerating(true);
    setServerError("");
    
    try {
      const generated = await generateWaitlistWithAi(aiDescription);
      
      setInitialValues({
        name: generated.productName || "",
        tagline: generated.tagline || "",
        description: generated.description || "",
      });
      
      toast.success("AI suggestions generated successfully");
      setCreationMode("manual");
    } catch (error: unknown) {
      toast.error("Unable to generate suggestions. Please try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: CreateWaitlistFormData & { logoId?: string; slug?: string }) => {
    setServerError("");

    if (!data.logoId) {
      setServerError("Logo is required");
      return;
    }

    try {
      const response = await createWaitlist({
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        logoId: data.logoId,
      });

      setResult(response);
    } catch (error: unknown) {
      setServerError(getApiErrorMessage(error, "Failed to create waitlist"));
      throw error;
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

        <div className="mb-8 flex rounded-lg border border-border p-1 bg-surface-muted">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              creationMode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setCreationMode("manual")}
          >
            Create manually
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2",
              creationMode === "ai" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setCreationMode("ai")}
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </button>
        </div>

        {creationMode === "ai" ? (
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">Describe your product</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI will generate a catchy product name, tagline, and description for you.
                </p>
              </div>
              <Textarea
                placeholder="An AI accounting assistant that helps freelancers automate invoices and taxes."
                rows={5}
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                disabled={isGenerating}
              />
              <Button 
                onClick={() => void handleGenerateAi()} 
                className="w-full" 
                loading={isGenerating}
              >
                {!isGenerating && <Sparkles className="h-4 w-4 mr-2" />}
                Generate Waitlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <WaitlistForm
            key={JSON.stringify(initialValues)}
            mode="create"
            initialValues={initialValues}
            onSubmit={onSubmit}
            submitButtonText="Create waitlist"
            serverError={serverError}
          />
        )}
      </div>
    </div>
  );
}
