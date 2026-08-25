"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronUp, Copy, Eye, EyeOff, FileStack, GripVertical, Plus, Redo2, RotateCcw, SlidersHorizontal, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPageBuilder, publishPageBuilder, savePageBuilder, getDashboardWaitlistDetail } from "@/services/dashboard";
import { getPublicWaitlistBySlug } from "@/services/api";
import { defaultSection, PAGE_SECTION_TYPES, sectionLabel, singletonSections, type PageConfig, type PageSection, type PageSectionType } from "@/types/page-builder";
import { routes } from "@/lib/routes";
import { uploadFile } from "@/services/files";
import {
  countErrors,
  getFieldError,
  getItemFieldError,
  LIMITS,
  validatePageConfig as validateConfig,
  type FieldErrors,
  type SectionErrors,
  type ValidationResult,
} from "@/lib/page-builder-validation";
import { WaitlistPageRenderer } from "@/components/waitlist/WaitlistPageRenderer";
import type { PublicWaitlistResponse } from "@/types/waitlist";

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveState = "loading" | "saved" | "saving" | "failed" | "publishing" | "published" | "invalid";
type BuilderMode = "CUSTOMIZE_ORIGINAL" | "FROM_SCRATCH";
type ConfirmAction = "reset_to_original" | "build_from_scratch" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalize = (sections: PageSection[]) => sections.map((section, order) => ({ ...section, order }));

const EMPTY_VALIDATION: ValidationResult = { valid: true, fieldErrors: {}, sectionErrors: {} };

/** Build a minimal PageConfig skeleton from a public waitlist response (CUSTOMIZE_ORIGINAL mode) */
function makeConfigFromPublicData(publicData: PublicWaitlistResponse): PageConfig {
  const { waitlist, copy } = publicData;
  return {
    version: 1,
    mode: "CUSTOMIZE_ORIGINAL",
    sections: [
      { id: "hero", type: "HERO", order: 0, visible: true, content: { headline: copy?.headline ?? waitlist.name, subheadline: copy?.subheadline ?? waitlist.tagline, description: waitlist.description ?? "" } },
      { id: "social-proof", type: "SOCIAL_PROOF", order: 1, visible: false, content: { title: "Loved by early adopters" } },
      { id: "features", type: "FEATURES", order: 2, visible: !!(copy?.features?.length), content: { title: "Why join?", items: JSON.stringify(copy?.features ?? []) } },
      { id: "signup", type: "SIGNUP", order: 3, visible: true, content: { title: "Join the waitlist", subtitle: "" } },
      { id: "faq", type: "FAQ", order: 4, visible: !!(copy?.faqs?.length), content: { title: "Frequently Asked Questions", items: JSON.stringify(copy?.faqs ?? []) } },
      { id: "footer", type: "FOOTER", order: 5, visible: true, content: { title: waitlist.name, text: `© ${new Date().getFullYear()} ${waitlist.name}. All rights reserved.` } },
    ],
  };
}

/** Build a minimal FROM_SCRATCH config (just the required SIGNUP section) */
function makeFromScratchConfig(): PageConfig {
  return {
    version: 1,
    mode: "FROM_SCRATCH",
    sections: [
      { id: `signup-${crypto.randomUUID().slice(0, 8)}`, type: "SIGNUP", order: 0, visible: true, content: { title: "Join the waitlist", subtitle: "" } },
    ],
  };
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PageBuilderPage() {
  const params = useParams();
  const waitlistId = params?.id as string;

  const [config, setConfig] = React.useState<PageConfig | null>(null);
  const [version, setVersion] = React.useState(1);
  // Always reflects the latest version synchronously — avoids stale closure in save/publish
  const versionRef = React.useRef(1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = React.useState<"light" | "dark" | "system">("light");
  const [state, setState] = React.useState<SaveState>("loading");
  const [history, setHistory] = React.useState<PageConfig[]>([]);
  const [future, setFuture] = React.useState<PageConfig[]>([]);
  const [validation, setValidation] = React.useState<ValidationResult>(EMPTY_VALIDATION);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  // Builder mode — derived from loaded config, or default to CUSTOMIZE_ORIGINAL
  const [builderMode, setBuilderMode] = React.useState<BuilderMode>("CUSTOMIZE_ORIGINAL");
  // Public waitlist data used to power the live preview
  const [previewData, setPreviewData] = React.useState<PublicWaitlistResponse | null>(null);
  // Confirmation dialog state for destructive mode-switch actions
  const [confirmAction, setConfirmAction] = React.useState<ConfirmAction>(null);

  const pending = React.useRef<PageConfig | null>(null);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (!waitlistId) return;

    // Fetch page builder config AND the public waitlist data (for preview) in parallel
    Promise.all([
      getPageBuilder(waitlistId),
      getDashboardWaitlistDetail(waitlistId),
    ])
      .then(([builderData, detail]) => {
        const loaded = builderData.draftConfig;
        setConfig(loaded);
        setVersion(builderData.version);
        versionRef.current = builderData.version;
        setSelectedId(loaded.sections[0]?.id ?? null);
        setBuilderMode((loaded.mode as BuilderMode) ?? "CUSTOMIZE_ORIGINAL");
        const result = validateConfig(loaded);
        setValidation(result);
        setState("saved");

        // Fetch public waitlist data by slug for the live preview
        const slug = detail.waitlist.slug;
        return getPublicWaitlistBySlug(slug);
      })
      .then((publicData) => {
        if (publicData) setPreviewData(publicData);
      })
      .catch(() => setState("failed"));
  }, [waitlistId]);

  const save = React.useCallback(async () => {
    if (!pending.current) return;
    // Do not auto-save an invalid configuration to the backend
    if (!pending.current || !validateConfig(pending.current).valid) {
      setState("invalid");
      return;
    }
    const next = pending.current;
    pending.current = null;
    setState("saving");
    try {
      const result = await savePageBuilder(waitlistId, next, versionRef.current);
      versionRef.current = result.version;
      setVersion(result.version);
      setState("saved");
    } catch {
      pending.current = next;
      setState("failed");
    }
  }, [waitlistId]);

  const update = (next: PageConfig, record = true) => {
    if (record && config) {
      setHistory((items) => [...items.slice(-39), config]);
      setFuture([]);
    }
    setConfig(next);

    // Validate immediately so inline errors appear without delay
    const result = validateConfig(next);
    setValidation(result);

    pending.current = next;

    if (result.valid) {
      // Valid — schedule auto-save
      setState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void save(), 1800);
    } else {
      // Invalid — cancel pending timer, show error state, do NOT submit
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      setState("invalid");
    }
  };

  React.useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const sections = config?.sections ?? [];
  const selected = sections.find((section) => section.id === selectedId);

  const changeContent = (key: string, value: string) =>
    selected &&
    update({
      ...config!,
      sections: config!.sections.map((section) =>
        section.id === selected.id ? { ...section, content: { ...section.content, [key]: value } } : section
      ),
    });

  const move = (id: string, delta: number) => {
    const index = sections.findIndex((section) => section.id === id);
    const destination = index + delta;
    if (destination < 0 || destination >= sections.length) return;
    const next = [...sections];
    [next[index], next[destination]] = [next[destination], next[index]];
    update({ ...config!, sections: normalize(next) });
  };

  const reorder = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const from = sections.findIndex((section) => section.id === fromId);
    const to = sections.findIndex((section) => section.id === toId);
    if (from < 0 || to < 0) return;
    const next = [...sections];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update({ ...config!, sections: normalize(next) });
  };

  const add = (type: PageSectionType) => {
    if (singletonSections.includes(type) && sections.some((section) => section.type === type)) return;
    const section = { ...defaultSection(type), order: sections.length };
    update({ ...config!, sections: [...sections, section] });
    setSelectedId(section.id);
  };

  const duplicate = (section: PageSection) => {
    if (singletonSections.includes(section.type)) return;
    const copy = { ...section, id: `${section.type.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`, order: sections.length };
    update({ ...config!, sections: [...sections, copy] });
    setSelectedId(copy.id);
  };

  const resetSelected = () => {
    if (!selected) return;
    const reset = { ...defaultSection(selected.type), id: selected.id, order: selected.order };
    update({ ...config!, sections: sections.map((section) => section.id === selected.id ? reset : section) });
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous || !config) return;
    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [config, ...items]);
    update(previous, false);
  };

  const redo = () => {
    const next = future[0];
    if (!next || !config) return;
    setFuture((items) => items.slice(1));
    setHistory((items) => [...items, config]);
    update(next, false);
  };

  const publish = async () => {
    if (!config) return;
    // Block publish if currently invalid
    if (!validation.valid) {
      setState("invalid");
      return;
    }
    // Flush any pending auto-save first, then publish using the latest version from ref
    if (pending.current || saveTimer.current) {
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
      await save();
    }
    setState("publishing");
    try {
      await publishPageBuilder(waitlistId, versionRef.current);
      setState("published");
    } catch {
      setState("failed");
    }
  };

  const navigateToSection = (sectionId: string) => {
    setSelectedId(sectionId);
    setSummaryOpen(false);
  };

  if (!config) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        {state === "failed" ? "Unable to load the page builder." : "Loading builder…"}
      </div>
    );
  }

  const errorCount = countErrors(validation);

  // ── Mode switching helpers ──
  const applyResetToOriginal = () => {
    if (!previewData) return;
    const next = makeConfigFromPublicData(previewData);
    setBuilderMode("CUSTOMIZE_ORIGINAL");
    setHistory([]);
    setFuture([]);
    update({ ...next, mode: "CUSTOMIZE_ORIGINAL" }, false);
    setSelectedId(next.sections[0]?.id ?? null);
    setConfirmAction(null);
  };

  const applyBuildFromScratch = () => {
    const next = makeFromScratchConfig();
    setBuilderMode("FROM_SCRATCH");
    setHistory([]);
    setFuture([]);
    update({ ...next, mode: "FROM_SCRATCH" }, false);
    setSelectedId(next.sections[0]?.id ?? null);
    setConfirmAction(null);
  };

  return (
    <div className="space-y-5">
      {/* ── Confirmation Modal ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                <h2 className="font-semibold">
                  {confirmAction === "reset_to_original" ? "Reset to Original Page" : "Build From Scratch"}
                </h2>
              </div>
              <button onClick={() => setConfirmAction(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {confirmAction === "reset_to_original"
                ? "This will replace your current draft with a layout based on your original waitlist page content. Your current edits will be lost."
                : "This will clear all current sections and start with a blank canvas. Only the signup form will remain. Your current edits will be lost."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button
                variant={confirmAction === "reset_to_original" ? "secondary" : "destructive"}
                onClick={confirmAction === "reset_to_original" ? applyResetToOriginal : applyBuildFromScratch}
              >
                {confirmAction === "reset_to_original" ? "Reset to Original" : "Clear & Build From Scratch"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={routes.waitlist(waitlistId)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />Back to waitlist
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Visual Page Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 flex items-center rounded-md border border-border bg-surface p-1">
            <button onClick={() => setPreviewTheme("light")} className={`rounded-sm px-2 py-1 text-xs font-medium ${previewTheme === "light" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Light</button>
            <button onClick={() => setPreviewTheme("dark")} className={`rounded-sm px-2 py-1 text-xs font-medium ${previewTheme === "dark" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Dark</button>
          </div>
          <Button size="sm" variant="ghost" onClick={undo} disabled={!history.length} aria-label="Undo"><Undo2 className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" onClick={redo} disabled={!future.length} aria-label="Redo"><Redo2 className="h-4 w-4" /></Button>
          <SaveStatus state={state} errorCount={errorCount} />
          <Button variant="secondary" onClick={() => void save()} disabled={state === "saving" || state === "invalid"}>
            {state === "failed" ? "Retry save" : "Save"}
          </Button>
          <Button onClick={() => void publish()} loading={state === "publishing"} disabled={!validation.valid}>
            Publish
          </Button>
        </div>
      </div>

      {/* ── Mode selector ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-border bg-background p-1">
            <button
              onClick={() => {
                if (builderMode !== "CUSTOMIZE_ORIGINAL") setConfirmAction("reset_to_original");
              }}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                builderMode === "CUSTOMIZE_ORIGINAL"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Customize Original
            </button>
            <button
              onClick={() => {
                if (builderMode !== "FROM_SCRATCH") setConfirmAction("build_from_scratch");
              }}
              className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                builderMode === "FROM_SCRATCH"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileStack className="h-3.5 w-3.5" />
              Build From Scratch
            </button>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {builderMode === "CUSTOMIZE_ORIGINAL"
              ? "Editing your original waitlist page"
              : "Building a custom page from a blank canvas"}
          </span>
        </div>
        {builderMode === "CUSTOMIZE_ORIGINAL" && previewData && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmAction("reset_to_original")}
            className="text-muted-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset to Original
          </Button>
        )}
      </div>

      {/* ── Validation Summary Banner ── */}
      {!validation.valid && errorCount > 0 && (
        <ValidationSummary
          sections={sections}
          sectionErrors={validation.sectionErrors}
          open={summaryOpen}
          onToggle={() => setSummaryOpen((v) => !v)}
          onNavigate={navigateToSection}
        />
      )}

      {/* ── Main 3-column layout ── */}
      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* Left: Section list */}
        <Card>
          <CardContent className="space-y-2 p-3">
            <p className="px-2 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Sections</p>
            {sections.map((section, index) => {
              const hasSectionError = !!validation.sectionErrors[section.id]?.length;
              return (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", section.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => { event.preventDefault(); reorder(event.dataTransfer.getData("text/plain"), section.id); }}
                  className={`flex items-center gap-1 rounded-lg p-1 ${section.id === selectedId ? "bg-surface-muted" : ""}`}
                >
                  <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" aria-label="Drag to reorder" />
                  <button className="min-w-0 flex-1 truncate px-1 text-left text-sm" onClick={() => setSelectedId(section.id)}>
                    {sectionLabel[section.type]}
                    {hasSectionError && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-destructive" aria-label="Has errors" />}
                  </button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => update({ ...config, sections: sections.map((item) => item.id === section.id ? { ...item, visible: !item.visible } : item) })} aria-label={section.visible ? `Hide ${sectionLabel[section.type]}` : `Show ${sectionLabel[section.type]}`}>
                    {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => move(section.id, -1)} disabled={index === 0} aria-label="Move section up">↑</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => move(section.id, 1)} disabled={index === sections.length - 1} aria-label="Move section down">↓</Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => { update({ ...config, sections: normalize(sections.filter((item) => item.id !== section.id)) }); setSelectedId(null); }} aria-label={`Remove ${sectionLabel[section.type]}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            <div className="border-t border-border pt-3">
              <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">Add section</p>
              <div className="grid grid-cols-2 gap-1">
                {PAGE_SECTION_TYPES.map((type) => (
                  <Button key={type} size="sm" variant="secondary" onClick={() => add(type)} disabled={singletonSections.includes(type) && sections.some((section) => section.type === type)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />{sectionLabel[type]}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Center: Live preview */}
        <Card>
          <CardContent className="min-h-[640px] bg-surface-muted p-3">
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Live draft preview</p>
            <div className={`overflow-y-auto rounded-xl border border-border shadow-sm ${previewTheme === "dark" ? "dark" : ""} bg-background text-foreground`} style={{ maxHeight: "80vh" }}>
              {previewData && config ? (
                <WaitlistPageRenderer
                  config={config}
                  waitlistData={{ ...previewData, pageConfig: config }}
                  isPreview
                />
              ) : (
                <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
                  {state === "loading" ? "Loading preview…" : "Preview unavailable"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Section settings */}
        <Card>
          <CardContent className="space-y-4 p-5">
            {selected ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Settings</p>
                    <h2 className="mt-1 font-semibold">{sectionLabel[selected.type]}</h2>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => duplicate(selected)} disabled={singletonSections.includes(selected.type)} aria-label="Duplicate section"><Copy className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={resetSelected} aria-label="Reset section"><RotateCcw className="h-4 w-4" /></Button>
                  </div>
                </div>
                <SectionSettings
                  section={selected}
                  onChange={changeContent}
                  fieldErrors={validation.fieldErrors}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a section to edit its settings.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Save Status ──────────────────────────────────────────────────────────────

function SaveStatus({ state, errorCount }: { state: SaveState; errorCount: number }) {
  if (state === "saving") return <span className="text-sm text-muted-foreground">Saving…</span>;
  if (state === "saved") return <span className="text-sm text-muted-foreground">Saved</span>;
  if (state === "published") return <span className="text-sm text-muted-foreground">Published successfully</span>;
  if (state === "invalid") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        {errorCount === 1 ? "1 issue" : `${errorCount} issues`} to fix
      </span>
    );
  }
  if (state === "failed") return <span className="text-sm text-destructive">Save failed</span>;
  return null;
}

// ─── Validation Summary Banner ────────────────────────────────────────────────

function ValidationSummary({
  sections,
  sectionErrors,
  open,
  onToggle,
  onNavigate,
}: {
  sections: PageSection[];
  sectionErrors: SectionErrors;
  open: boolean;
  onToggle: () => void;
  onNavigate: (sectionId: string) => void;
}) {
  const errorEntries = sections
    .filter((s) => sectionErrors[s.id]?.length)
    .map((s) => ({ id: s.id, type: s.type, errors: sectionErrors[s.id] }));

  const totalErrors = errorEntries.reduce((sum, e) => sum + e.errors.length, 0);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" role="alert" aria-live="polite">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {totalErrors === 1 ? "1 issue needs attention" : `${totalErrors} issues need attention`}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-amber-600" /> : <ChevronDown className="h-4 w-4 text-amber-600" />}
      </button>
      {open && (
        <div className="border-t border-amber-200 px-4 pb-3 pt-2 dark:border-amber-800">
          <div className="space-y-3">
            {errorEntries.map(({ id, type, errors }) => (
              <div key={id}>
                <button
                  onClick={() => onNavigate(id)}
                  className="text-xs font-semibold uppercase tracking-wide text-amber-700 hover:underline dark:text-amber-400"
                >
                  {sectionLabel[type]}
                </button>
                <ul className="mt-1 space-y-0.5">
                  {errors.map((error, i) => (
                    <li key={i} className="text-xs text-amber-700 dark:text-amber-400">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Character Counter helper ─────────────────────────────────────────────────

function charCount(value: string, max: number): string {
  return `${value.length} / ${max}`;
}

function charCountHelper(value: string, max: number): string | undefined {
  // Only show counter when approaching the limit (>50% used) or over
  if (value.length === 0) return undefined;
  if (value.length > max * 0.5 || value.length > max) return charCount(value, max);
  return undefined;
}

// ─── Section Settings ─────────────────────────────────────────────────────────

function SectionSettings({
  section,
  onChange,
  fieldErrors,
}: {
  section: PageSection;
  onChange: (key: string, value: string) => void;
  fieldErrors: FieldErrors;
}) {
  const text = (key: string) => String(section.content[key] ?? "");
  const fe = (key: string) => getFieldError(fieldErrors, section.id, key);
  const ife = (index: number, key: string) => getItemFieldError(fieldErrors, section.id, index, key);

  const updateItems = (key: string, items: Array<Record<string, string>>) => onChange(key, JSON.stringify(items));
  const parsedItems = (key: string, fallback: Array<Record<string, string>>) => {
    try {
      const value = section.content[key];
      return typeof value === "string" ? JSON.parse(value) : Array.isArray(value) ? value : fallback;
    } catch {
      return fallback;
    }
  };

  // ── HERO ──
  if (section.type === "HERO") {
    const headline = text("headline");
    const subheadline = text("subheadline");
    const description = text("description");
    return (
      <>
        <Input
          label="Headline"
          required
          value={headline}
          onChange={(e) => onChange("headline", e.target.value)}
          error={fe("headline")}
          helper={charCountHelper(headline, LIMITS.HERO.headline.max) ?? `${headline.length} / ${LIMITS.HERO.headline.max}`}
          maxLength={LIMITS.HERO.headline.max + 1}
        />
        <Input
          label="Subheadline"
          value={subheadline}
          onChange={(e) => onChange("subheadline", e.target.value)}
          error={fe("subheadline")}
          helper={charCountHelper(subheadline, LIMITS.HERO.subheadline.max)}
          maxLength={LIMITS.HERO.subheadline.max + 1}
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => onChange("description", e.target.value)}
          error={fe("description")}
          helper={charCountHelper(description, LIMITS.HERO.description.max)}
        />
      </>
    );
  }

  // ── SIGNUP ──
  if (section.type === "SIGNUP") {
    const title = text("title");
    const subtitle = text("subtitle");
    return (
      <>
        <Input
          label="Form title"
          required
          value={title}
          onChange={(e) => onChange("title", e.target.value)}
          error={fe("title")}
          helper={charCountHelper(title, LIMITS.SIGNUP.title.max) ?? `${title.length} / ${LIMITS.SIGNUP.title.max}`}
          maxLength={LIMITS.SIGNUP.title.max + 1}
        />
        <Textarea
          label="Form subtitle (optional)"
          value={subtitle}
          onChange={(e) => onChange("subtitle", e.target.value)}
          error={fe("subtitle")}
          helper={charCountHelper(subtitle, LIMITS.SIGNUP.subtitle.max)}
        />
      </>
    );
  }

  // ── FEATURES ──
  if (section.type === "FEATURES") {
    const items: Array<Record<string, string>> = parsedItems("items", [{ title: "", description: "" }]);
    const sectionTitle = text("title");
    return (
      <>
        <Input
          label="Section title"
          required
          value={sectionTitle}
          onChange={(e) => onChange("title", e.target.value)}
          error={fe("title")}
          helper={charCountHelper(sectionTitle, LIMITS.FEATURES.title.max) ?? `${sectionTitle.length} / ${LIMITS.FEATURES.title.max}`}
          maxLength={LIMITS.FEATURES.title.max + 1}
        />
        <label className="block text-sm font-medium">
          Columns
          <select
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
            value={text("columns") || "3"}
            onChange={(e) => onChange("columns", e.target.value)}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        {fieldErrors[`${section.id}.items`] && (
          <p className="text-xs text-destructive" role="alert">{fieldErrors[`${section.id}.items`]}</p>
        )}
        {items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Feature {index + 1}</p>
              {items.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={() => updateItems("items", items.filter((_, i) => i !== index))}
                  aria-label={`Remove feature ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Input
              label={`Feature ${index + 1} title`}
              required
              value={item.title ?? ""}
              onChange={(e) => updateItems("items", items.map((v, i) => i === index ? { ...v, title: e.target.value } : v))}
              error={ife(index, "title")}
              helper={charCountHelper(item.title ?? "", LIMITS.FEATURES.itemTitle.max)}
              maxLength={LIMITS.FEATURES.itemTitle.max + 1}
            />
            <Textarea
              label="Feature description"
              required
              value={item.description ?? ""}
              onChange={(e) => updateItems("items", items.map((v, i) => i === index ? { ...v, description: e.target.value } : v))}
              error={ife(index, "description")}
              helper={charCountHelper(item.description ?? "", LIMITS.FEATURES.itemDescription.max)}
            />
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          disabled={items.length >= LIMITS.FEATURES.items.max}
          onClick={() => updateItems("items", [...items, { title: "", description: "" }])}
        >
          Add feature {items.length >= LIMITS.FEATURES.items.max ? `(max ${LIMITS.FEATURES.items.max})` : ""}
        </Button>
      </>
    );
  }

  // ── FAQ ──
  if (section.type === "FAQ") {
    const items: Array<Record<string, string>> = parsedItems("items", [{ question: "", answer: "" }]);
    const faqTitle = text("title");
    return (
      <>
        <Input
          label="FAQ title"
          required
          value={faqTitle}
          onChange={(e) => onChange("title", e.target.value)}
          error={fe("title")}
          helper={charCountHelper(faqTitle, LIMITS.FAQ.title.max) ?? `${faqTitle.length} / ${LIMITS.FAQ.title.max}`}
          maxLength={LIMITS.FAQ.title.max + 1}
        />
        {fieldErrors[`${section.id}.items`] && (
          <p className="text-xs text-destructive" role="alert">{fieldErrors[`${section.id}.items`]}</p>
        )}
        {items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">FAQ {index + 1}</p>
              {items.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={() => updateItems("items", items.filter((_, i) => i !== index))}
                  aria-label={`Remove FAQ ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Input
              label={`Question ${index + 1}`}
              required
              value={item.question ?? ""}
              onChange={(e) => updateItems("items", items.map((v, i) => i === index ? { ...v, question: e.target.value } : v))}
              error={ife(index, "question")}
              helper={charCountHelper(item.question ?? "", LIMITS.FAQ.question.max)}
              maxLength={LIMITS.FAQ.question.max + 1}
            />
            <Textarea
              label="Answer"
              required
              value={item.answer ?? ""}
              onChange={(e) => updateItems("items", items.map((v, i) => i === index ? { ...v, answer: e.target.value } : v))}
              error={ife(index, "answer")}
              helper={charCountHelper(item.answer ?? "", LIMITS.FAQ.answer.max)}
            />
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          disabled={items.length >= LIMITS.FAQ.items.max}
          onClick={() => updateItems("items", [...items, { question: "", answer: "" }])}
        >
          Add FAQ {items.length >= LIMITS.FAQ.items.max ? `(max ${LIMITS.FAQ.items.max})` : ""}
        </Button>
      </>
    );
  }

  // ── SOCIAL_PROOF ──
  if (section.type === "SOCIAL_PROOF") {
    const spTitle = text("title");
    const spDesc = text("description");
    const screenshotUrl = text("screenshotUrl");

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      // Client-side pre-validation
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        // Trigger validation error by clearing the value (let the validator catch it)
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return;
      }
      try {
        const uploaded = await uploadFile(file);
        onChange("screenshotUrl", uploaded.url);
      } catch {
        // Upload failed — leave existing value intact, don't clear
      }
    };

    return (
      <>
        <Input
          label="Section title"
          required
          value={spTitle}
          onChange={(e) => onChange("title", e.target.value)}
          error={fe("title")}
          helper={charCountHelper(spTitle, LIMITS.SOCIAL_PROOF.title.max) ?? `${spTitle.length} / ${LIMITS.SOCIAL_PROOF.title.max}`}
          maxLength={LIMITS.SOCIAL_PROOF.title.max + 1}
        />
        <Textarea
          label="Description"
          value={spDesc}
          onChange={(e) => onChange("description", e.target.value)}
          error={fe("description")}
          helper={charCountHelper(spDesc, LIMITS.SOCIAL_PROOF.description.max)}
        />
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="social-proof-screenshot">
            Screenshot <span className="text-destructive">*</span>
          </label>
          <input
            id="social-proof-screenshot"
            className={`block w-full text-sm ${fe("screenshotUrl") ? "text-destructive" : ""}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
          <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP — max 5 MB</p>
          {fe("screenshotUrl") && (
            <p className="text-xs text-destructive" role="alert">{fe("screenshotUrl")}</p>
          )}
          {screenshotUrl && (
            <img
              src={screenshotUrl}
              alt="Social proof screenshot preview"
              className="max-h-40 rounded-lg border border-border object-cover"
            />
          )}
        </div>
      </>
    );
  }

  // ── FOOTER (and any other remaining types) ──
  const footerTitle = text("title");
  const footerText = text(section.type === "FOOTER" ? "text" : "description");

  return (
    <>
      <Input
        label="Title"
        required={section.type === "FOOTER"}
        value={footerTitle}
        onChange={(e) => onChange("title", e.target.value)}
        error={fe("title")}
        helper={charCountHelper(footerTitle, LIMITS.FOOTER.title.max) ?? `${footerTitle.length} / ${LIMITS.FOOTER.title.max}`}
        maxLength={LIMITS.FOOTER.title.max + 1}
      />
      <Textarea
        label={section.type === "FOOTER" ? "Footer text" : "Description"}
        required={section.type === "FOOTER"}
        value={footerText}
        onChange={(e) => onChange(section.type === "FOOTER" ? "text" : "description", e.target.value)}
        error={fe(section.type === "FOOTER" ? "text" : "description")}
        helper={section.type === "FOOTER" ? charCountHelper(footerText, LIMITS.FOOTER.text.max) : undefined}
      />
    </>
  );
}

