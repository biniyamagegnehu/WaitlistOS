"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CustomFieldConfig, LocationFieldConfig } from "@/types/custom-fields";
import { Star, Search, X, Check } from "lucide-react";
import { ALL_COUNTRIES, ALL_LANGUAGES, getCountryName, getLanguageName } from "@/lib/locale-data";
import { cn } from "@/lib/cn";

interface SignupFieldRendererProps {
  field: CustomFieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

export function SignupFieldRenderer({ field, value, onChange, error, disabled }: SignupFieldRendererProps) {
  const commonClasses = cn(
    "w-full rounded-lg border bg-surface/50 px-4 py-3 text-base md:text-sm shadow-sm transition-colors",
    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
    "disabled:cursor-not-allowed disabled:opacity-50",
    error ? "border-destructive focus-visible:ring-destructive/50" : "border-input hover:border-input-hover"
  );

  const inputId = `field_${field.id}`;
  const errorId = `error_${field.id}`;

  const renderField = () => {
    switch (field.type) {
      case "SHORT_TEXT":
      case "EMAIL":
      case "PHONE":
      case "URL":
        return (
          <input
            id={inputId}
            type={field.type === "SHORT_TEXT" ? "text" : field.type.toLowerCase()}
            className={commonClasses}
            placeholder={(field as any).placeholder || (field.type === "EMAIL" ? "you@example.com" : field.type === "PHONE" ? "+1 234 567 8900" : field.type === "URL" ? "https://example.com" : "Enter your answer")}
            value={value || ""}
            maxLength={(field as any).maxLength}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        );

      case "DATE":
        return (
          <input
            id={inputId}
            type="date"
            className={cn(commonClasses, "cursor-pointer")}
            value={value || ""}
            min={(field as any).minDate}
            max={(field as any).maxDate}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        );

      case "DATE_TIME":
        return (
          <input
            id={inputId}
            type="datetime-local"
            className={cn(commonClasses, "cursor-pointer")}
            value={value || ""}
            min={(field as any).minDate}
            max={(field as any).maxDate}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        );
      
      case "LONG_TEXT":
        return (
          <textarea
            id={inputId}
            className={cn(commonClasses, "min-h-[120px] resize-y leading-relaxed")}
            placeholder={(field as any).placeholder || "Enter your answer"}
            value={value || ""}
            maxLength={(field as any).maxLength}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        );

      case "NUMBER":
        return (
          <input
            id={inputId}
            type="number"
            className={commonClasses}
            placeholder={(field as any).placeholder || "Enter a number"}
            min={(field as any).min}
            max={(field as any).max}
            step={(field as any).step || "any"}
            value={value === undefined || value === null ? "" : value}
            onChange={e => {
              const num = parseFloat(e.target.value);
              onChange(isNaN(num) ? "" : num);
            }}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        );

      case "SINGLE_SELECT": {
        const options = (field as any).options || [];
        return (
          <div className="flex flex-col gap-2">
            {options.map((opt: any, i: number) => {
              const isSelected = value === opt.value;
              return (
                <div
                  key={i}
                  className={cn(
                    "relative flex cursor-pointer items-center rounded-lg border p-4 transition-all duration-200 hover:bg-muted/50",
                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !disabled && onChange(opt.value)}
                >
                  <div className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-input"
                  )}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                  </div>
                  <span className={cn("ml-3 font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      case "MULTI_SELECT": {
        const options = (field as any).options || [];
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="flex flex-col gap-2">
            {options.map((opt: any, i: number) => {
              const isSelected = selected.includes(opt.value);
              return (
                <div
                  key={i}
                  className={cn(
                    "relative flex cursor-pointer items-center rounded-lg border p-4 transition-all duration-200 hover:bg-muted/50",
                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (disabled) return;
                    if (isSelected) {
                      onChange(selected.filter((v: string) => v !== opt.value));
                    } else {
                      onChange([...selected, opt.value]);
                    }
                  }}
                >
                  <div className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-input"
                  )}>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                  </div>
                  <span className={cn("ml-3 font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      case "DROPDOWN":
        return (
          <select
            className={cn(commonClasses, "appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em] bg-[right_0.75rem_center] bg-no-repeat")}
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
          >
            <option value="" disabled>{(field as any).placeholder || "Select an option"}</option>
            {((field as any).options || []).map((opt: any, i: number) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case "RATING": {
        const max = (field as any).maxRating || 5;
        const current = value || 0;
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {Array.from({ length: max }).map((_, i) => {
              const active = i < current;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(i + 1)}
                  className={cn(
                    "p-2 rounded-full transition-all duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    active ? "text-yellow-400" : "text-muted hover:text-yellow-400/50",
                    disabled && "cursor-not-allowed hover:scale-100"
                  )}
                >
                  <Star className="h-8 w-8" fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 1.5} />
                </button>
              );
            })}
          </div>
        );
      }

      case "SCALE": {
        const min = (field as any).min || 1;
        const max = (field as any).max || 7;
        const leftLabel = (field as any).leftLabel;
        const rightLabel = (field as any).rightLabel;
        const steps = max - min + 1;
        
        return (
          <div className="space-y-4">
            <div className="flex justify-between w-full gap-2">
              {Array.from({ length: steps }).map((_, i) => {
                const val = min + i;
                const isSelected = value === val;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(val)}
                    className={cn(
                      "flex-1 flex flex-col items-center justify-center py-3 rounded-lg border transition-all duration-200",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105" 
                        : "bg-surface/50 border-input text-foreground hover:bg-muted/50 hover:border-input-hover",
                      disabled && "cursor-not-allowed opacity-50 hover:scale-100"
                    )}
                  >
                    <span className="text-lg font-medium">{val}</span>
                  </button>
                );
              })}
            </div>
            {(leftLabel || rightLabel) && (
              <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
              </div>
            )}
          </div>
        );
      }

      case "CONSENT": {
        const isSelected = value === true;
        return (
          <div
            className={cn(
              "relative flex cursor-pointer items-start rounded-lg border p-4 transition-all duration-200 hover:bg-muted/50",
              isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onChange(!value)}
          >
            <div className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
              isSelected ? "border-primary bg-primary" : "border-input"
            )}>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
            </div>
            <div className="ml-3 text-sm text-muted-foreground leading-relaxed">
              I agree to the terms and consent to this statement.
            </div>
          </div>
        );
      }

      case "COUNTRY":
      case "LANGUAGE":
        return (
          <LocationPublicSelector
            field={field as LocationFieldConfig}
            value={value}
            onChange={onChange}
            disabled={disabled}
            error={error}
          />
        );

      default:
        return <div className="text-sm text-destructive p-3 rounded-md bg-destructive/10">Unsupported field type: {field.type}</div>;
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex flex-col gap-1">
        <label htmlFor={inputId} className="text-base md:text-sm font-semibold text-foreground">
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </label>
      </div>
      
      {renderField()}
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Helper: Location Selector (COUNTRY / LANGUAGE) with portal-based dropdown
// so it never overlaps sibling fields
// ──────────────────────────────────────────────────────────────────────
function LocationPublicSelector({ 
  field, 
  value, 
  onChange, 
  disabled,
  error
}: { 
  field: LocationFieldConfig; 
  value: any; 
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const options = useMemo(() => {
    let source = field.type === "COUNTRY" ? ALL_COUNTRIES : ALL_LANGUAGES;
    if (field.optionMode === "SELECTED" && Array.isArray(field.selectedOptions)) {
      source = field.selectedOptions
        .map(code => source.find(e => e.code === code))
        .filter((e): e is {code: string; name: string} => !!e);
    }
    return source;
  }, [field]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(o => o.name.toLowerCase().includes(lower) || o.code.toLowerCase().includes(lower));
  }, [options, search]);

  // Apply default value on mount
  useEffect(() => {
    if (!value && field.defaultValue && !disabled) {
      if (options.some(o => o.code === field.defaultValue)) {
        onChange(field.defaultValue);
      }
    }
  }, [value, field.defaultValue, options, onChange, disabled]);

  const selectedName = field.type === "COUNTRY" ? getCountryName(value) : getLanguageName(value);

  // Calculate fixed position from trigger button rect
  const openDropdown = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = Math.min(320, spaceBelow - 8);
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      maxHeight: dropdownHeight,
    });
    setIsOpen(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on scroll / resize to avoid stale position
  useEffect(() => {
    if (!isOpen) return;
    const close = () => { setIsOpen(false); setSearch(""); };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  const dropdown = isOpen && !disabled && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        ...dropdownStyle,
        backgroundColor: "var(--surface, #ffffff)",
        color: "var(--foreground, #171717)",
        border: "1px solid var(--border, #e5e5e5)",
        borderRadius: "0.5rem",
        boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.15), 0 4px 10px -5px rgb(0 0 0 / 0.1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Search bar */}
      <div className="flex items-center border-b px-3 py-2.5 shrink-0">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          autoFocus
          className="flex h-9 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={`Search ${field.type === "COUNTRY" ? "country" : "language"}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="ml-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Options list */}
      <div className="overflow-y-auto p-1 flex-1">
        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">No results found.</div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filteredOptions.map(opt => (
              <button
                key={opt.code}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-left transition-colors",
                  "hover:bg-muted focus:bg-muted focus:outline-none",
                  value === opt.code && "bg-primary/10 text-primary font-medium"
                )}
                onClick={() => {
                  onChange(opt.code);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <span className="truncate">{opt.name}</span>
                {value === opt.code && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="w-full">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => isOpen ? setIsOpen(false) : openDropdown()}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border bg-surface/50 px-4 py-3 text-base md:text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          error ? "border-destructive" : "border-input hover:border-input-hover",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {value ? selectedName || value : (field.placeholder || (field.type === "COUNTRY" ? "Select your country" : "Select your language"))}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4 opacity-50 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {dropdown}
    </div>
  );
}
