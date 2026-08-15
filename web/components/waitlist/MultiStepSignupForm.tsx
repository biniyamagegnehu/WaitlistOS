"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { joinWaitlist, JoinWaitlistError, updateSignupProgress } from "@/services/participants";
import { trackFunnelEvent } from "./AnalyticsTracker";
import type { JoinResponse } from "@/types/participant";
import type { SignupConfig, SignupStep } from "@/types/waitlist";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2, ArrowRight, Share2, Copy, Check, Sparkles } from "lucide-react";
import { SignupFieldRenderer } from "./fields/SignupFieldRenderer";
import { CustomFieldConfig } from "@/types/custom-fields";
import { cn } from "@/lib/cn";

// ── Cookie helpers ────────────────────────────────────────────
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : undefined;
}

function getAttributionData() {
  try {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("waitlist_attribution="));
    if (cookie) {
      return JSON.parse(decodeURIComponent(cookie.split("=")[1]));
    }
  } catch {
    /* ignore */
  }
  return {};
}

// ── Schema ────────────────────────────────────────────────────
const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email").trim().toLowerCase(),
  referralCode: z.string().trim().optional(),
});
type EmailFormValues = z.infer<typeof emailSchema>;

const ERROR_MESSAGES: Record<string, string> = {
  WAITLIST_NOT_FOUND: "This waitlist does not exist.",
  EMAIL_ALREADY_JOINED: "You have already joined this waitlist.",
  INVALID_REFERRAL: "The referral link is invalid.",
  SELF_REFERRAL: "You cannot use your own referral link.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

// ── Types ─────────────────────────────────────────────────────
type Step = "EMAIL" | "QUESTIONS" | "REFERRAL" | "DONE";

interface MultiStepSignupFormProps {
  waitlistSlug: string;
  waitlistId: string;
  referralCode?: string;
  signupConfig: SignupConfig | null | undefined;
  onSuccess: (data: JoinResponse) => void;
}

// ── Framer Motion Variants ────────────────────────────────────
const fadeSlideVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: "easeIn" } }
};

// ── Main component ────────────────────────────────────────────
export default function MultiStepSignupForm({
  waitlistSlug,
  waitlistId,
  referralCode: initialReferralCode,
  signupConfig,
  onSuccess,
}: MultiStepSignupFormProps) {
  const sessionId = getCookie("waitlist_session");

  // Compute which steps are enabled from config
  const enabledSteps = (() => {
    if (!signupConfig?.enabled) return [] as SignupStep[];
    return (signupConfig.steps || []).filter((s) => s.enabled);
  })();

  const hasQuestionStep = enabledSteps.some((s) => s.type === "QUESTIONS");
  const hasReferralStep = enabledSteps.some((s) => s.type === "REFERRAL");
  const questionsStep = enabledSteps.find((s) => s.type === "QUESTIONS");
  const isMultiStep = hasQuestionStep || hasReferralStep;

  // ── State
  const [currentStep, setCurrentStep] = useState<Step>("EMAIL");
  const [joined, setJoined] = useState<JoinResponse | null>(null);
  const [serverError, setServerError] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});
  const [customFieldErrors, setCustomFieldErrors] = useState<Record<string, string>>({});
  const [submittingQuestions, setSubmittingQuestions] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const formFocusTracked = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      referralCode: initialReferralCode || "",
    },
  });

  // Track FORM_FOCUS
  const handleFocus = () => {
    if (!formFocusTracked.current && sessionId) {
      formFocusTracked.current = true;
      trackFunnelEvent(waitlistId, sessionId, "FORM_FOCUS");
    }
  };

  // ── Email submit ──────────────────────────────────────────
  const onEmailSubmit = async (data: EmailFormValues) => {
    setServerError("");
    const attribution = getAttributionData();
    try {
      const result = await joinWaitlist({
        waitlistSlug,
        email: data.email,
        ...(data.referralCode ? { referralCode: data.referralCode } : {}),
        ...(attribution.source ? { source: attribution.source } : {}),
        ...(attribution.medium ? { medium: attribution.medium } : {}),
        ...(attribution.campaign ? { campaign: attribution.campaign } : {}),
        ...(attribution.referrer ? { referrer: attribution.referrer } : {}),
        ...(attribution.landingPath ? { landingPath: attribution.landingPath } : {}),
        sessionId,
      });

      setJoined(result);

      if (result.signupStatus === "PARTIAL" && isMultiStep) {
        // Advance to first additional step
        if (hasQuestionStep) {
          setCurrentStep("QUESTIONS");
          if (sessionId) trackFunnelEvent(waitlistId, sessionId, "QUESTIONS_STARTED");
        } else if (hasReferralStep) {
          setCurrentStep("REFERRAL");
          if (sessionId) trackFunnelEvent(waitlistId, sessionId, "REFERRAL_STEP_VIEWED");
        }
      } else {
        // Single step or config disabled — directly done
        toast.success("Successfully joined the waitlist!");
        onSuccess(result);
      }
    } catch (err) {
      if (err instanceof JoinWaitlistError) {
        toast.error(ERROR_MESSAGES[err.code] || ERROR_MESSAGES.SERVER_ERROR);
        setServerError(ERROR_MESSAGES[err.code] || ERROR_MESSAGES.SERVER_ERROR);
      } else {
        toast.error(ERROR_MESSAGES.SERVER_ERROR);
        setServerError(ERROR_MESSAGES.SERVER_ERROR);
      }
    }
  };

  // ── Questions submit ──────────────────────────────────────
  const validateQuestions = () => {
    if (!questionsStep?.fields) return true;
    const errs: Record<string, string> = {};
    for (const field of questionsStep.fields as CustomFieldConfig[]) {
      const val = customFieldValues[field.id];
      if (field.required && (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0))) {
        errs[field.id] = `${field.label} is required`;
      }
    }
    setCustomFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onQuestionsSubmit = async () => {
    if (!validateQuestions() || !joined) return;
    setSubmittingQuestions(true);
    try {
      const isLastStep = !hasReferralStep;
      await updateSignupProgress(joined.id, {
        customFields: customFieldValues,
        completeStep: isLastStep,
        sessionId,
      });

      if (sessionId) trackFunnelEvent(waitlistId, sessionId, "QUESTIONS_COMPLETED");

      if (hasReferralStep) {
        setCurrentStep("REFERRAL");
        if (sessionId) trackFunnelEvent(waitlistId, sessionId, "REFERRAL_STEP_VIEWED");
      } else {
        // All steps done
        await updateSignupProgress(joined.id, { completeStep: true, sessionId });
        if (sessionId) {
          trackFunnelEvent(waitlistId, sessionId, "SIGNUP_COMPLETED");
        }
        toast.success("Successfully joined the waitlist!");
        onSuccess(joined);
      }
    } catch {
      toast.error("Failed to save your answers. Please try again.");
    } finally {
      setSubmittingQuestions(false);
    }
  };

  // ── Referral step done ────────────────────────────────────
  const onReferralDone = async () => {
    if (!joined) return;
    try {
      await updateSignupProgress(joined.id, { completeStep: true, sessionId });
      if (sessionId) trackFunnelEvent(waitlistId, sessionId, "SIGNUP_COMPLETED");
    } catch {
      /* fail silently — don't block user */
    }
    toast.success("You're all set! Welcome to the waitlist.");
    onSuccess(joined);
  };

  // ── Copy referral link ─────────────────────────────────────
  const copyLink = () => {
    if (!joined) return;
    const url = `${window.location.origin}${window.location.pathname}?ref=${joined.referralCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      if (sessionId) trackFunnelEvent(waitlistId, sessionId, "REFERRAL_SHARED");
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // ── Step indicator ─────────────────────────────────────────
  const allSteps: Step[] = ["EMAIL", ...(hasQuestionStep ? ["QUESTIONS" as Step] : []), ...(hasReferralStep ? ["REFERRAL" as Step] : [])];
  const stepIndex = allSteps.indexOf(currentStep);

  return (
    <div className="w-full">
      {isMultiStep && (
        <div className="mb-8">
          <StepIndicator steps={allSteps} current={stepIndex} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── EMAIL STEP ───────────────────────────────────── */}
        {currentStep === "EMAIL" && (
          <motion.div
            key="EMAIL"
            variants={fadeSlideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mx-auto w-full max-w-sm"
          >
            <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email address"
                disabled={isSubmitting}
                error={errors.email?.message}
                {...register("email")}
                onFocus={handleFocus}
                required
                className="h-12"
              />
              <input type="hidden" {...register("referralCode")} />
              {serverError && <Alert variant="error">{serverError}</Alert>}
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium shadow-sm transition-all hover:shadow-md"
                loading={isSubmitting}
                disabled={isSubmitting || !isValid}
              >
                {isMultiStep ? (
                  <span className="flex items-center gap-2">
                    Continue <ArrowRight className="h-4 w-4" />
                  </span>
                ) : (
                  "Join Waitlist"
                )}
              </Button>
            </form>
          </motion.div>
        )}

        {/* ── QUESTIONS STEP ───────────────────────────────── */}
        {currentStep === "QUESTIONS" && questionsStep && (
          <motion.div
            key="QUESTIONS"
            variants={fadeSlideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mx-auto w-full max-w-md"
          >
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">A few quick questions</h3>
              <p className="text-muted-foreground mt-2">Help us personalize your experience.</p>
            </div>
            
            <div className="space-y-8">
              {(questionsStep.fields || []).map((field: any) => (
                <div key={field.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both" style={{ animationDelay: '100ms' }}>
                  <SignupFieldRenderer
                    field={field}
                    value={customFieldValues[field.id]}
                    onChange={(val) => setCustomFieldValues(prev => ({ ...prev, [field.id]: val }))}
                    error={customFieldErrors[field.id]}
                    disabled={submittingQuestions}
                  />
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-8 h-12 text-base font-medium shadow-sm transition-all hover:shadow-md"
              onClick={onQuestionsSubmit}
              loading={submittingQuestions}
              disabled={submittingQuestions}
            >
              <span className="flex items-center gap-2">
                {hasReferralStep ? "Continue" : "Complete Signup"}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </motion.div>
        )}

        {/* ── REFERRAL STEP ────────────────────────────────── */}
        {currentStep === "REFERRAL" && joined && (
          <motion.div
            key="REFERRAL"
            variants={fadeSlideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mx-auto w-full max-w-md"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner border border-primary/10">
                <Sparkles className="h-8 w-8" />
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">Move up the waitlist!</h3>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  You're in! Want early access? Share your unique link to skip the line.
                </p>
              </div>

              <div className="w-full">
                <div className="group relative flex items-center gap-2 rounded-xl border border-input bg-surface-muted p-2 pr-2.5 transition-all hover:border-primary/50">
                  <div className="flex-1 overflow-hidden px-2">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {`${typeof window !== "undefined" ? window.location.origin : ""}${typeof window !== "undefined" ? window.location.pathname : ""}?ref=${joined.referralCode}`}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className={cn(
                      "shrink-0 h-9 transition-all",
                      copiedLink ? "bg-success text-success-foreground hover:bg-success" : ""
                    )} 
                    onClick={copyLink}
                  >
                    {copiedLink ? (
                      <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Copied</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Copy className="h-3.5 w-3.5" /> Copy</span>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 pt-2">
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground h-12" onClick={onReferralDone}>
                  Skip for now, I'll wait
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Step Indicator ─────────────────────────────────────────────
function StepIndicator({ steps, current }: { steps: Step[]; current: number }) {
  const labels: Record<Step, string> = {
    EMAIL: "Email",
    QUESTIONS: "Questions",
    REFERRAL: "Share",
    DONE: "Done",
  };

  return (
    <div className="relative flex items-center justify-between w-full max-w-sm mx-auto px-2">
      {/* Background Line */}
      <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-[2px] bg-border/60 z-0" />
      
      {/* Active Line */}
      <motion.div 
        className="absolute left-[10%] top-1/2 -translate-y-1/2 h-[2px] bg-primary z-0 origin-left"
        initial={{ width: 0 }}
        animate={{ width: `${(current / (steps.length - 1)) * 80}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />

      {steps.map((step, i) => {
        const isActive = i === current;
        const isPast = i < current;
        
        return (
          <div key={step} className="relative z-10 flex flex-col items-center gap-2">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isPast || isActive ? "var(--color-primary)" : "var(--color-surface)",
                borderColor: isPast || isActive ? "var(--color-primary)" : "var(--color-border)",
                color: isPast || isActive ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                scale: isActive ? 1.15 : 1
              }}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold shadow-sm transition-colors duration-300",
                isActive && "ring-4 ring-primary/20"
              )}
            >
              {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </motion.div>
            <span className={cn(
              "absolute -bottom-6 text-[11px] font-medium transition-colors duration-300 whitespace-nowrap",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}>
              {labels[step]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
