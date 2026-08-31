"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MultiStepSignupForm from "./MultiStepSignupForm";
import { UrgencyWidget } from "@/components/public/UrgencyWidget";
import { LeaderboardSection } from "./PublicWaitlistPageClient";

import { type PageConfig } from "@/types/page-builder";

interface WaitlistPageRendererProps {
  config: PageConfig;
  waitlistData: any; // using any for simplicity
  isPreview?: boolean;
  refCode?: string | null;
  onJoin?: (data: any) => void;
}

export function WaitlistPageRenderer({
  config,
  waitlistData,
  isPreview = false,
  refCode = null,
  onJoin,
}: WaitlistPageRendererProps) {
  const waitlist = waitlistData.waitlist;
  const branding = waitlistData.branding;
  const copy = waitlistData.copy;
  const primaryColor = branding?.primaryColor ?? "var(--primary)";

  const sections = config.sections || [];
  const orderedSections = [...sections].sort((a, b) => a.order - b.order);

  const visible = (type: string) => {
    const s = sections.find((x) => x.type === type);
    return s ? s.visible : false;
  };

  const getSectionContent = (type: string) => sections.find((x) => x.type === type)?.content || {};

  const heroContent = getSectionContent("HERO");
  const socialProofContent = getSectionContent("SOCIAL_PROOF");
  const faqContent = getSectionContent("FAQ");
  const signupContent = getSectionContent("SIGNUP");
  const footerContent = getSectionContent("FOOTER");

  const parseItems = <T,>(value: unknown): T[] | null => {
    try { const parsed = typeof value === "string" ? JSON.parse(value) : value; return Array.isArray(parsed) ? parsed as T[] : null; } catch { return null; }
  };

  const configuredFeatures = parseItems<any>(getSectionContent("FEATURES").items) || [];
  const configuredFaqs = parseItems<any>(getSectionContent("FAQ").items) || [];
  const featuresContent = getSectionContent("FEATURES");
  const featureColumns = Math.min(Math.max(Number(featuresContent.columns) || 3, 1), 4);
  const featureGridClass = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[featureColumns as 1 | 2 | 3 | 4];

  const renderSection = (type: string) => {
    switch (type) {
      case "HERO":
        if (!visible("HERO")) return null;
        return (
          <Card key="HERO" className="overflow-hidden shadow-sm">
            <CardContent className="p-8 text-center space-y-6">
              {branding?.logoUrl && (
                <div className="flex justify-center">
                  <Image
                    src={branding.logoUrl}
                    alt={`${waitlist.name} logo`}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-20 w-20 rounded-lg border border-border object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
                  {typeof heroContent.headline === "string" && heroContent.headline ? heroContent.headline : waitlist.name}
                </h1>
                <p className="text-lg font-medium text-muted-foreground">
                  {typeof heroContent.subheadline === "string" && heroContent.subheadline ? heroContent.subheadline : waitlist.tagline}
                </p>
              </div>
              {waitlist.description && (
                <p className="mx-auto max-w-xl text-sm text-muted-foreground leading-relaxed">
                  {waitlist.description}
                </p>
              )}
            </CardContent>
          </Card>
        );

      case "SOCIAL_PROOF":
        if (!visible("SOCIAL_PROOF")) return null;
        return (
          <React.Fragment key="SOCIAL_PROOF">
            {Boolean(socialProofContent.title || socialProofContent.description || socialProofContent.screenshotUrl) && (
              <Card className="overflow-hidden border-border/50">
                <CardContent className="grid gap-5 p-6 sm:grid-cols-2 sm:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">{String(socialProofContent.title || "Loved by early adopters")}</h2>
                    {Boolean(socialProofContent.description) && (
                      <p className="mt-2 text-sm text-muted-foreground">{String(socialProofContent.description)}</p>
                    )}
                  </div>
                  {typeof socialProofContent.screenshotUrl === "string" && Boolean(socialProofContent.screenshotUrl) && (
                    <Image src={socialProofContent.screenshotUrl} alt="Social proof" width={720} height={480} unoptimized className="max-h-56 w-full rounded-lg border border-border object-cover" />
                  )}
                </CardContent>
              </Card>
            )}
            {copy && (
              <div className="text-center space-y-6 py-8">
                <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{copy.headline}</h2>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{copy.subheadline}</p>
                <Button
                  size="lg"
                  className="mt-4 rounded-full px-8 font-semibold shadow-sm hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => {
                    if (!isPreview) {
                      document.getElementById("join-form")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  {copy.cta}
                </Button>
              </div>
            )}
          </React.Fragment>
        );

      case "FEATURES":
        if (!visible("FEATURES")) return null;
        const displayFeatures = configuredFeatures?.length ? configuredFeatures : (Array.isArray(copy?.features) ? copy.features : []);
        if (displayFeatures.length === 0) return null;
        return (
          <div key="FEATURES" className={`grid gap-6 py-8 ${featureGridClass}`}>
            {displayFeatures.map((feature: any, idx: number) => (
              <Card key={idx} className="bg-surface shadow-sm border-border/50">
                <CardContent className="p-6 space-y-3 text-center sm:text-left">
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case "FAQ":
        if (!visible("FAQ")) return null;
        const displayFaqs = configuredFaqs?.length ? configuredFaqs : (Array.isArray(copy?.faqs) ? copy.faqs : []);
        if (displayFaqs.length === 0) return null;
        return (
          <div key="FAQ" className="py-8 space-y-6">
            <h3 className="text-2xl font-bold tracking-tight text-center mb-6">
              {typeof faqContent.title === "string" && faqContent.title ? faqContent.title : "Frequently Asked Questions"}
            </h3>
            <div className="space-y-4">
              {displayFaqs.map((faq: any, idx: number) => (
                <details key={idx} className="group rounded-lg border border-border bg-surface p-4 shadow-sm transition-all [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between font-semibold text-foreground">
                    {faq.question}
                    <span className="transition group-open:rotate-180">
                      <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                  </summary>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        );

      case "SIGNUP":
        if (!visible("SIGNUP")) return null;
        return (
          <Card key="SIGNUP" id="join-form" className="shadow-sm border-border/50">
            <CardContent className="p-8 text-center space-y-6">
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                  {typeof signupContent.title === "string" && signupContent.title ? signupContent.title : "Join the Waitlist"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {typeof signupContent.subtitle === "string" && signupContent.subtitle
                    ? signupContent.subtitle
                    : refCode
                      ? "You were referred! Join now to secure your spot."
                      : "Enter your email to secure your spot in line."}
                </p>
              </div>
              <div className={isPreview ? "pointer-events-none opacity-80" : ""}>
                <MultiStepSignupForm
                  waitlistSlug={waitlist.slug}
                  waitlistId={waitlist.id}
                  referralCode={refCode ?? undefined}
                  signupConfig={waitlistData?.signupConfig}
                  onSuccess={(data: any) => {
                    if (!isPreview && onJoin) {
                      onJoin(data);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        );

      case "FOOTER":
        if (!visible("FOOTER")) return null;
        return (
          <footer key="FOOTER" className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
            {typeof footerContent.text === "string" && footerContent.text
              ? footerContent.text
              : `© ${new Date().getFullYear()} ${waitlist.name}. All rights reserved.`}
          </footer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-16">
      {/* Render page builder sections in founder-defined order */}
      {orderedSections.map((s) => renderSection(s.type))}

      {/* Urgency engine — not a page builder section, always rendered after SIGNUP if enabled */}
      <UrgencyWidget
        urgencyEnabled={waitlist.urgencyEnabled}
        batchEnabled={waitlist.batchEnabled}
        batchName={waitlist.batchName}
        batchSize={waitlist.batchSize}
        batchDescription={waitlist.batchDescription}
        countdownEnabled={waitlist.countdownEnabled}
        launchDate={waitlist.launchDate}
        showRemainingSpots={waitlist.showRemainingSpots}
        showBatchProgress={waitlist.showBatchProgress}
        showCountdown={waitlist.showCountdown}
        currentParticipants={waitlist.participantCount || 0}
        batchUrgency={waitlist.batchUrgency}
      />

      {/* Leaderboard — always after sections */}
      <LeaderboardSection
        waitlistId={waitlist.id}
        teamLeaderboard={waitlistData?.teamLeaderboard}
        teamReferralsEnabled={waitlist.teamReferralsEnabled ?? false}
      />
    </div>
  );
}
