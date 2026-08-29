import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, helper, id, leftIcon, rightIcon, required, size = "md", ...props },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    const sizeClasses = {
      sm: "h-8 text-xs", // 32px
      md: "h-10 text-sm", // 40px
      lg: "h-11 text-sm", // 44px
    };

    return (
      <div className="flex w-full flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
            {required && <span className="ml-1 text-error">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex w-full rounded-md border border-border bg-surface ring-offset-background shadow-sm transition-all duration-200",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-placeholder",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:border-border-focus",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:text-text-disabled disabled:bg-surface-muted",
              "hover:border-border-strong",
              error && "border-border-error focus-visible:ring-border-error focus-visible:border-border-error",
              leftIcon && rightIcon && "pl-10 pr-10",
              leftIcon && !rightIcon && "pl-10 pr-3",
              !leftIcon && rightIcon && "pl-3 pr-10",
              !leftIcon && !rightIcon && "px-3",
              "py-2",
              sizeClasses[size],
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helper
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-error" role="alert">
            {error}
          </p>
        )}
        {helper && !error && (
          <p id={`${inputId}-helper`} className="text-xs text-text-muted">
            {helper}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
