import * as React from "react";
import { cn } from "@/lib/cn";

interface FormFieldProps {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  helper,
  required,
  disabled,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label
          className={cn(
            "block text-sm font-medium",
            disabled ? "text-text-disabled" : "text-text-primary"
          )}
        >
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      <div className={cn(disabled && "opacity-50")}>{children}</div>
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="text-xs text-text-muted">
          {helper}
        </p>
      )}
    </div>
  );
}
