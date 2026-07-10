"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { joinWaitlist, JoinWaitlistError } from "../../services/participants";
import { JoinResponse, JoinErrorCode } from "../../types/participant";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

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

  const onSubmit = async (data: JoinFormValues) => {
    setServerError("");
    try {
      const result = await joinWaitlist({
        waitlistSlug,
        email: data.email,
        ...(data.referralCode ? { referralCode: data.referralCode } : {}),
      });
      onSuccess(result);
    } catch (err) {
      if (err instanceof JoinWaitlistError) {
        setServerError(ERROR_MESSAGES[err.code]);
      } else {
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
