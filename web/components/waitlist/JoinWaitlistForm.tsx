"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { joinWaitlist, JoinWaitlistError } from "../../services/participants";
import { JoinResponse, JoinErrorCode } from "../../types/participant";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import toast from "react-hot-toast";
import { trackFunnelEvent } from "./AnalyticsTracker";

/** Read a document cookie by name (only works for non-httpOnly cookies). */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : undefined;
}

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3000") + "/api";

function trackFunnelEventBySlug(
  waitlistSlug: string,
  sessionId: string,
  eventType: "PAGE_VISIT" | "FORM_FOCUS" | "SIGNUP_SUBMITTED" | "QUESTIONS_STARTED" | "QUESTIONS_COMPLETED" | "SIGNUP_COMPLETED" | "REFERRAL_STEP_VIEWED" | "REFERRAL_SHARED",
) {
  // First fetch waitlist to get ID
  fetch(`${API_BASE}/w/${waitlistSlug}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.success && data.data?.waitlist?.id) {
        trackFunnelEvent(data.data.waitlist.id, sessionId, eventType);
      }
    })
    .catch(() => {
      // Fail silently
    });
}

const joinSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
  referralCode: z.string().trim().optional(),
});

type JoinFormValues = z.infer<typeof joinSchema>;

const ERROR_MESSAGES: Record<JoinErrorCode, string> = {
  WAITLIST_NOT_FOUND: "This waitlist does not exist.",
  EMAIL_ALREADY_JOINED: "You have already joined this waitlist.",
  INVALID_REFERRAL: "The referral link is invalid.",
  SELF_REFERRAL: "You cannot use your own referral link.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

interface JoinWaitlistFormProps {
  waitlistSlug: string;
  referralCode?: string;
  onSuccess: (data: JoinResponse) => void;
}

export default function JoinWaitlistForm({
  waitlistSlug,
  referralCode: initialReferralCode,
  onSuccess,
}: JoinWaitlistFormProps) {
  const [serverError, setServerError] = useState<string>("");
  const formFocusTracked = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      referralCode: initialReferralCode || "",
    },
  });

  // Track FORM_FOCUS on first interaction with any form field
  const handleFocus = () => {
    if (!formFocusTracked.current) {
      formFocusTracked.current = true;
      const sessionId = getCookie("waitlist_session");
      if (sessionId) {
        // We need the waitlistId - fetch it from the waitlist data
        // For now, we'll track by slug in a separate call
        trackFunnelEventBySlug(waitlistSlug, sessionId, "FORM_FOCUS");
      }
    }
  };

  const onSubmit = async (data: JoinFormValues) => {
    setServerError("");
    try {
      // Only forward the fields the backend DTO explicitly accepts.
      // Do NOT spread the full cookie — it also contains `timestamp` and other
      // internal fields that the backend will reject (whitelist validation).
      let source: string | undefined;
      let medium: string | undefined;
      let campaign: string | undefined;
      let referrer: string | undefined;
      let landingPath: string | undefined;

      try {
        const attributionCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("waitlist_attribution="));
        if (attributionCookie) {
          const cookieValue = decodeURIComponent(attributionCookie.split("=")[1]);
          const parsed = JSON.parse(cookieValue);
          source = parsed.source || undefined;
          medium = parsed.medium || undefined;
          campaign = parsed.campaign || undefined;
          referrer = parsed.referrer || undefined;
          landingPath = parsed.landingPath || undefined;
        }
      } catch {
        // malformed cookie — proceed without attribution
      }

      const result = await joinWaitlist({
        waitlistSlug,
        email: data.email,
        ...(data.referralCode ? { referralCode: data.referralCode } : {}),
        ...(source ? { source } : {}),
        ...(medium ? { medium } : {}),
        ...(campaign ? { campaign } : {}),
        ...(referrer ? { referrer } : {}),
        ...(landingPath ? { landingPath } : {}),
        sessionId: getCookie("waitlist_session"),
      });
      toast.success("Successfully joined the waitlist!");
      onSuccess(result);
    } catch (err) {
      if (err instanceof JoinWaitlistError) {
        toast.error(ERROR_MESSAGES[err.code]);
        setServerError(ERROR_MESSAGES[err.code]);
      } else {
        toast.error(ERROR_MESSAGES.SERVER_ERROR);
        setServerError(ERROR_MESSAGES.SERVER_ERROR);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto w-full max-w-sm space-y-4"
    >
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email address"
        disabled={isSubmitting}
        error={errors.email?.message}
        {...register("email")}
        onFocus={handleFocus}
        required
      />

      {/* Hidden referral code field - automatically applied from URL parameter */}
      <input type="hidden" {...register("referralCode")} />

      {serverError && <Alert variant="error">{serverError}</Alert>}

      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        disabled={isSubmitting || !isValid}
      >
        Join Waitlist
      </Button>
    </form>
  );
}
