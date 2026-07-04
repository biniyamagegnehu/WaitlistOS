"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/errors";

interface AuthFormProps<T extends z.ZodSchema> {
  schema: T;
  defaultValues?: z.infer<T>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  submitText: string;
  isSubmitting?: boolean;
  children: (methods: ReturnType<typeof useForm<z.infer<T>>>) => React.ReactNode;
  onSuccess?: () => void;
  onSuccessMessage?: string;
}

export function AuthForm<T extends z.ZodSchema>({
  schema,
  defaultValues,
  onSubmit,
  submitText,
  isSubmitting = false,
  children,
  onSuccess,
  onSuccessMessage = "Success",
}: AuthFormProps<T>) {
  const { toast } = useToast();
  const [internalSubmitting, setInternalSubmitting] = React.useState(false);

  const methods = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: z.infer<T>) => {
    try {
      setInternalSubmitting(true);
      await onSubmit(data);
      toast({
        title: onSuccessMessage,
        variant: "success",
      });
      onSuccess?.();
      methods.reset();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "An error occurred");
      toast({
        title: message,
        variant: "error",
      });
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4">
      {children(methods)}
      <Button
        type="submit"
        loading={isSubmitting || internalSubmitting}
        className="w-full"
        disabled={isSubmitting || internalSubmitting}
      >
        {submitText}
      </Button>
    </form>
  );
}
