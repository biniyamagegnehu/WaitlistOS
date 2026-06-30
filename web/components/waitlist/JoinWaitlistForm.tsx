"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { joinWaitlist, JoinWaitlistError } from "../../services/participants";
import { JoinResponse, JoinErrorCode } from "../../types/participant";
import { useState } from "react";

const joinSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
});

type JoinFormValues = z.infer<typeof joinSchema>;

const ERROR_MESSAGES: Record<JoinErrorCode, string> = {
  WAITLIST_NOT_FOUND: "This waitlist does not exist.",
  EMAIL_ALREADY_JOINED: "You have already joined this waitlist.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

interface JoinWaitlistFormProps {
  waitlistSlug: string;
  onSuccess: (data: JoinResponse) => void;
}

export default function JoinWaitlistForm({
  waitlistSlug,
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
  });

  const onSubmit = async (data: JoinFormValues) => {
    setServerError("");
    try {
      const result = await joinWaitlist({
        waitlistSlug,
        email: data.email,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 w-full max-w-sm mx-auto">
      <div>
        <input
          {...register("email")}
          type="email"
          placeholder="Enter your email address"
          disabled={isSubmitting}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-red-500 text-sm text-center">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="w-full bg-black text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Joining…" : "Join Waitlist"}
      </button>
    </form>
  );
}
