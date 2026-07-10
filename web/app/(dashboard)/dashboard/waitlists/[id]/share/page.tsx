"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardWaitlistDetail } from "@/services/dashboard";
import type { DashboardWaitlistDetail } from "@/types/dashboard";
import { getApiErrorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

export default function ShareWaitlistPage() {
  const params = useParams();
  const waitlistId = params?.id as string;

  const [detail, setDetail] = React.useState<DashboardWaitlistDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!waitlistId) return;

    getDashboardWaitlistDetail(waitlistId)
      .then(setDetail)
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, "Failed to load waitlist"));
      })
      .finally(() => setIsLoading(false));
  }, [waitlistId]);

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const getHostedPageUrl = (slug: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${routes.waitlistPublic(slug)}`;
    }
    return routes.waitlistPublic(slug);
  };

  const getEmbedCode = (slug: string) => {
    const scriptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/w/${slug}/widget.js`;
    return `<script src="${scriptUrl}" defer></script>`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" className="h-10 w-72" />
        <Skeleton variant="rectangular" className="h-64" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <EmptyState
        title="Waitlist not found"
        description={error ?? "This waitlist could not be loaded."}
        action={
          <Link href={routes.waitlists}>
            <Button variant="secondary">Back to waitlists</Button>
          </Link>
        }
      />
    );
  }

  const { waitlist } = detail;
  const hostedPageUrl = getHostedPageUrl(waitlist.slug);
  const embedCode = getEmbedCode(waitlist.slug);

  return (
    <div className="space-y-6">
      <Link
        href={routes.waitlist(waitlist.id)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to waitlist
      </Link>

      <SectionHeader
        title="Share your waitlist"
        description="Get your hosted page URL and widget embed code"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Hosted page URL</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Share this link to let people join your waitlist
              </p>
            </div>

            <div className="space-y-2">
              <code className="block break-all rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
                {hostedPageUrl}
              </code>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => void handleCopy(hostedPageUrl, "hosted")}
                >
                  {copiedField === "hosted" ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy URL
                    </>
                  )}
                </Button>
                <Link
                  href={routes.waitlistPublic(waitlist.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Widget embed code</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add this code to your website to embed the waitlist widget
              </p>
            </div>

            <div className="space-y-2">
              <code className="block break-all rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-foreground">
                {embedCode}
              </code>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => void handleCopy(embedCode, "embed")}
              >
                {copiedField === "embed" ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy embed code
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">How to use the widget</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Follow these steps to add the waitlist widget to your website
            </p>
          </div>

          <ol className="space-y-3 text-sm text-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                1
              </span>
              <span className="pt-0.5">Copy the embed code above</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                2
              </span>
              <span className="pt-0.5">Paste it into your website's HTML, preferably before the closing &lt;/body&gt; tag</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                3
              </span>
              <span className="pt-0.5">The widget will automatically appear on your website</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
