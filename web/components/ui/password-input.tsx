"use client";

import * as React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/cn";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helper?: string;
  showStrength?: boolean;
  required?: boolean;
}

export function PasswordInput({
  label,
  error,
  helper,
  showStrength = false,
  required,
  className,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [strength, setStrength] = React.useState(0);

  const togglePassword = () => setShowPassword(!showPassword);

  const calculateStrength = (password: string) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return Math.min((score / 6) * 100, 100);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (showStrength) {
      setStrength(calculateStrength(e.target.value));
    }
    props.onChange?.(e);
  };

  const getStrengthColor = () => {
    if (strength < 33) return "bg-destructive";
    if (strength < 66) return "bg-accent";
    return "bg-primary";
  };

  const getStrengthLabel = () => {
    if (strength < 33) return "Weak";
    if (strength < 66) return "Medium";
    return "Strong";
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}
      <div className="relative">
        <Input
          {...props}
          type={showPassword ? "text" : "password"}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={togglePassword}
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          onChange={handlePasswordChange}
          className={cn("pr-10", className)}
        />
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      {showStrength && props.value && (
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className={cn("h-full transition-all duration-300", getStrengthColor())}
              style={{ width: `${strength}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{getStrengthLabel()}</span>
        </div>
      )}
      {helper && !error && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  );
}
