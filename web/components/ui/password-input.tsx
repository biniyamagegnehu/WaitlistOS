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
}

export function PasswordInput({
  label,
  error,
  helper,
  showStrength = false,
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
    if (strength < 33) return "bg-red-500";
    if (strength < 66) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthLabel = () => {
    if (strength < 33) return "Weak";
    if (strength < 66) return "Medium";
    return "Strong";
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="block text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        <Input
          {...props}
          type={showPassword ? "text" : "password"}
          error={error}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={togglePassword}
              className="text-zinc-500 hover:text-white transition-colors"
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
      {showStrength && props.value && (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-300", getStrengthColor())}
              style={{ width: `${strength}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">{getStrengthLabel()}</span>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="text-xs text-zinc-500">{helper}</p>
      )}
    </div>
  );
}
