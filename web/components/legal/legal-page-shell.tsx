"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Printer, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight, 
  Mail, 
  Menu, 
  X,
  Share2,
  Check
} from "lucide-react";
import { cn } from "@/lib/cn";
import toast from "react-hot-toast";

export interface TocItem {
  id: string;
  title: string;
  badge?: string;
}

export interface HighlightItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface LegalPageShellProps {
  type: "privacy" | "terms";
  eyebrow: string;
  titlePrefix: string;
  titleAccent: string;
  titleSuffix?: string;
  description: string;
  effectiveDate: string;
  highlights: HighlightItem[];
  toc: TocItem[];
  contactEmail: string;
  children: React.ReactNode;
}

export function LegalPageShell({
  type,
  eyebrow,
  titlePrefix,
  titleAccent,
  titleSuffix = "",
  description,
  effectiveDate,
  highlights,
  toc,
  contactEmail,
  children,
}: LegalPageShellProps) {
  const [activeSection, setActiveSection] = React.useState<string>(toc[0]?.id || "");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Active section tracking via IntersectionObserver
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by top position to select the highest visible section
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-90px 0px -60% 0px",
        threshold: [0, 0.2, 0.5],
      }
    );

    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [toc]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // offset for sticky navbar
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#faf9f7] dark:bg-[#111110] text-foreground transition-colors duration-300">
      {/* ── Dot Grid Background (Light Mode) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          backgroundImage: "radial-gradient(circle, #ccc8c0 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.6,
        }}
      />

      {/* ── Dot Grid Background (Dark Mode) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          backgroundImage: "radial-gradient(circle, #2a2a28 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.85,
        }}
      />

      {/* ── Radial Ambient Glow (Light Mode) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 15%, #faf9f7 20%, transparent 100%)",
        }}
      />

      {/* ── Radial Ambient Glow (Dark Mode) ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 15%, #111110 20%, transparent 100%)",
        }}
      />

      {/* ── Subtle Brand Orange Accent Glow ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 h-64 w-[36rem] max-w-full rounded-full bg-primary/5 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20">
        {/* ── Top Hero Section ── */}
        <div className="mx-auto max-w-4xl text-center mb-12 sm:mb-16">
          {/* Eyebrow Pill */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-white/85 dark:bg-surface/80 backdrop-blur-sm px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white tracking-wide uppercase"
              style={{ background: "var(--primary)" }}
            >
              Legal
            </span>
            <span>{eyebrow}</span>
          </div>

          {/* Headline with Playfair Display Accent */}
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15]">
            {titlePrefix}{" "}
            <em
              style={{
                fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif",
                fontStyle: "italic",
                color: "var(--primary)",
                fontWeight: 700,
              }}
            >
              {titleAccent}
            </em>{" "}
            {titleSuffix}
          </h1>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
            {description}
          </p>

          {/* Metadata & Actions Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/70 px-3 py-1 font-medium backdrop-blur-xs">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              Effective Date: {effectiveDate}
            </span>

            <span className="hidden sm:inline-block text-border">•</span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/70 px-3 py-1 font-medium backdrop-blur-xs">
              Official Production Policy
            </span>

            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground hover:bg-surface-muted hover:border-border-strong transition-colors cursor-pointer shadow-2xs print:hidden"
                title="Print or Save as PDF"
              >
                <Printer className="h-3 w-3 text-muted-foreground" />
                Print / Save PDF
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground hover:bg-surface-muted hover:border-border-strong transition-colors cursor-pointer shadow-2xs print:hidden"
                title="Copy Link to Page"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3 w-3 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-3 w-3 text-muted-foreground" />
                    Share
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Executive Highlights Grid ── */}
        <div className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
          {highlights.map((item, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-border/70 bg-white/75 dark:bg-surface/70 p-5 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            >
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                {item.icon}
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* ── Mobile Floating Table of Contents Trigger ── */}
        <div className="lg:hidden sticky top-20 z-30 mb-6 print:hidden">
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface/95 px-4 py-2.5 shadow-sm backdrop-blur-md">
            <span className="text-xs font-medium text-muted-foreground">
              Jump to section:
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
            >
              {mobileMenuOpen ? (
                <>
                  Close <X className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  {toc.find((t) => t.id === activeSection)?.title || "Table of Contents"}
                  <Menu className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="mt-2 rounded-2xl border border-border bg-surface p-3 shadow-xl backdrop-blur-md max-h-72 overflow-y-auto space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
              {toc.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors",
                    activeSection === item.id
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                  )}
                >
                  <span className="truncate">
                    {idx + 1}. {item.title}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] rounded-full bg-border/70 px-1.5 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main Layout: Sidebar TOC + Content ── */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-start">
          {/* ── Desktop Sticky Sidebar (4 cols) ── */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-6 print:hidden">
            <div className="rounded-2xl border border-border bg-white/70 dark:bg-surface/70 p-5 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Table of Contents
                </span>
                <span className="text-[11px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {toc.length} Sections
                </span>
              </div>

              <nav className="space-y-1">
                {toc.map((item, idx) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={cn(
                        "group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-all duration-150 cursor-pointer",
                        isActive
                          ? "bg-primary/10 font-semibold text-primary shadow-2xs"
                          : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className={cn(
                            "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-mono",
                            isActive
                              ? "bg-primary text-white font-bold"
                              : "bg-border/60 text-muted-foreground group-hover:bg-border"
                          )}
                        >
                          {idx + 1}
                        </span>
                        <span className="truncate">{item.title}</span>
                      </span>

                      {item.badge && (
                        <span className="text-[10px] shrink-0 rounded-full border border-border bg-surface px-1.5 py-0.5 text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Contact Box */}
            <div className="rounded-2xl border border-border bg-white/50 dark:bg-surface/50 p-5 shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Have legal inquiries?
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Direct questions to our legal team
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-dashed border-border bg-surface/80 p-2 text-center text-xs font-mono text-primary break-all">
                {contactEmail}
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href="/contact"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-muted transition-colors shadow-2xs"
                >
                  Contact Support
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              </div>
            </div>
          </aside>

          {/* ── Content Column (8 cols) ── */}
          <main className="lg:col-span-8 space-y-8 print:col-span-12">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export interface LegalSectionCardProps {
  id: string;
  number: string;
  title: string;
  icon?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}

export function LegalSectionCard({
  id,
  number,
  title,
  icon,
  badge,
  children,
}: LegalSectionCardProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl border border-border/80 bg-white/85 dark:bg-surface/80 p-6 sm:p-9 shadow-xs backdrop-blur-sm transition-all hover:border-border-strong hover:shadow-sm"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold font-mono">
            {number}
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {icon}
            {title}
          </h2>
        </div>

        {badge && (
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {badge}
          </span>
        )}
      </div>

      {/* Section Body */}
      <div className="space-y-4 text-sm sm:text-[0.9375rem] text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function LegalCallout({
  type = "info",
  title,
  children,
}: {
  type?: "info" | "warning" | "highlight";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-info/20 bg-info/5 text-foreground",
    warning: "border-warning/30 bg-warning/5 text-foreground",
    highlight: "border-primary/25 bg-primary/5 text-foreground",
  };

  const barStyles = {
    info: "bg-info",
    warning: "bg-warning",
    highlight: "bg-primary",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4 sm:p-5 my-4 text-xs sm:text-sm leading-relaxed",
        styles[type]
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1",
          barStyles[type]
        )}
      />
      {title && (
        <h4 className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
          {title}
        </h4>
      )}
      <div>{children}</div>
    </div>
  );
}
