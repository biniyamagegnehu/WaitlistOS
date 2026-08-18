"use client";

import React, { useState, useId } from "react";
import { CustomFieldConfig, FieldOption, FieldType, LocationFieldConfig, FIELD_REGISTRY } from "@/types/custom-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2, GripVertical, Plus, ChevronDown, AlertCircle } from "lucide-react";
import { LocationOptionPicker } from "./LocationOptionPicker";
import { ALL_COUNTRIES, ALL_LANGUAGES } from "@/lib/locale-data";
import { cn } from "@/lib/cn";

interface FieldConfigEditorProps {
  field: CustomFieldConfig;
  onChange: (updatedField: CustomFieldConfig) => void;
  onDelete: () => void;
  errors?: Record<string, string>;
}
const PLACEHOLDER_SUPPORTED_TYPES = new Set<FieldType>([
  "SHORT_TEXT",
  "LONG_TEXT",
  "EMAIL",
  "PHONE",
  "URL",
  "DROPDOWN",
  "NUMBER",
  "COUNTRY",
  "LANGUAGE",
]);

function Switch({ checked, onChange, id }: { checked: boolean; onChange: (c: boolean) => void; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}
function CharCounter({ value, max }: { value: string; max: number }) {
  if (!value || value.length < max * 0.5) return null;
  const isOver = value.length > max;
  return (
    <span className={cn("text-xs font-medium ml-auto", isOver ? "text-destructive font-semibold" : "text-muted-foreground")}>
      {value.length}/{max}
    </span>
  );
}

export function FieldConfigEditor({ field, onChange, onDelete, errors = {} }: FieldConfigEditorProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const uniqueId = useId();
  const labelInputId = `field-label-${field.id || uniqueId}`;
  const placeholderInputId = `field-placeholder-${field.id || uniqueId}`;
  const typeSelectId = `field-type-${field.id || uniqueId}`;
  const requiredSwitchId = `field-req-${field.id || uniqueId}`;

  const updateField = (changes: Partial<CustomFieldConfig>) => {
    onChange({ ...field, ...changes } as CustomFieldConfig);
  };

  const handleTypeChange = (newType: FieldType) => {
    if (newType === field.type) return;
    const reg = FIELD_REGISTRY.find(r => r.type === newType);
    const newDefaults = reg?.defaultConfig || {};

    // Preserve common attributes across type switch
    const newField: CustomFieldConfig = {
      id: field.id,
      label: field.label,
      required: field.required,
      ...newDefaults,
      type: newType,
    } as CustomFieldConfig;

    // Retain placeholder if new type supports it
    if (PLACEHOLDER_SUPPORTED_TYPES.has(newType)) {
      if ((field as any).placeholder !== undefined) {
        (newField as any).placeholder = (field as any).placeholder;
      }
    }

    onChange(newField);
  };

  const hasOptions = ["SINGLE_SELECT", "MULTI_SELECT", "DROPDOWN"].includes(field.type);
  const supportsPlaceholder = PLACEHOLDER_SUPPORTED_TYPES.has(field.type);

  // Check which advanced controls apply
  const hasAdvancedControls = [
    "SHORT_TEXT", "LONG_TEXT", "NUMBER", "MULTI_SELECT",
    "SCALE", "RATING", "DATE", "DATE_TIME", "COUNTRY", "LANGUAGE"
  ].includes(field.type);

  const advancedKeys = [
    "minLength", "maxLength", "min", "max", "step", "minSelections",
    "maxSelections", "minRating", "maxRating", "leftLabel", "rightLabel",
    "minDate", "maxDate", "selectedOptions", "defaultValue"
  ];
  const hasAdvancedErrors = advancedKeys.some(k => Boolean(errors[k]));
  const hasAnyErrors = Object.keys(errors).length > 0;

  // Auto-expand advanced settings if it contains validation errors
  const isAdvancedExpanded = isAdvancedOpen || hasAdvancedErrors;

  return (
    <Card className={cn("shadow-sm border-border/60 transition-all hover:border-border/80", hasAnyErrors && "border-destructive/60")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
          <div className="cursor-grab hover:bg-muted p-1.5 rounded-md text-muted-foreground transition-colors active:cursor-grabbing shrink-0" title="Drag to reorder">
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Field Type Switcher */}
          <div className="flex items-center gap-2 min-w-0">
            <label htmlFor={typeSelectId} className="sr-only">Field Type</label>
            <div className="relative">
              <select
                id={typeSelectId}
                value={field.type}
                onChange={(e) => handleTypeChange(e.target.value as FieldType)}
                className="h-8 pl-2.5 pr-8 text-xs font-semibold rounded-md border border-input bg-background/80 hover:bg-background text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer transition-colors appearance-none"
              >
                {FIELD_REGISTRY.map((entry) => (
                  <option key={entry.type} value={entry.type}>
                    {entry.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
            </div>

            {hasAnyErrors && (
              <span className="flex items-center gap-1 text-xs text-destructive font-normal truncate">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Issues to fix</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <label htmlFor={requiredSwitchId} className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Required
            </label>
            <Switch id={requiredSwitchId} checked={field.required} onChange={(c) => updateField({ required: c })} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            title="Delete field"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Label Input */}
          <div className={cn(!supportsPlaceholder && "md:col-span-2")}>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={labelInputId} className="text-xs font-semibold text-foreground">
                Label <span className="text-destructive">*</span>
              </label>
              <CharCounter value={field.label || ""} max={100} />
            </div>
            <p className="text-[11px] text-muted-foreground mb-1.5">
              What participants see above the field.
            </p>
            <Input
              id={labelInputId}
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="e.g. What is your role?"
              className={cn("bg-background h-9 text-sm", errors.label && "border-destructive focus-visible:ring-destructive")}
              error={errors.label}
              maxLength={101}
            />
          </div>

          {/* Placeholder Input (only when applicable) */}
          {supportsPlaceholder && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={placeholderInputId} className="text-xs font-semibold text-foreground">
                  Placeholder
                </label>
                <CharCounter value={(field as any).placeholder || ""} max={150} />
              </div>
              <p className="text-[11px] text-muted-foreground mb-1.5">
                Example text shown inside the field.
              </p>
              <Input
                id={placeholderInputId}
                value={(field as any).placeholder ?? ""}
                onChange={(e) => updateField({ placeholder: e.target.value })}
                placeholder={
                  field.type === "EMAIL" ? "you@example.com" :
                  field.type === "PHONE" ? "+1 234 567 8900" :
                  field.type === "URL" ? "https://example.com" :
                  field.type === "NUMBER" ? "Enter a number" :
                  field.type === "DROPDOWN" ? "Select an option" :
                  field.type === "COUNTRY" ? "Select your country" :
                  field.type === "LANGUAGE" ? "Select your language" :
                  "e.g. Founder, Developer"
                }
                className={cn("bg-background h-9 text-sm", errors.placeholder && "border-destructive focus-visible:ring-destructive")}
                error={errors.placeholder}
                maxLength={151}
              />
            </div>
          )}
        </div>

        {/* OPTIONS LIST FOR CHOICE FIELDS */}
        {hasOptions && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Options <span className="text-destructive">*</span>
                </label>
                <p className="text-[11px] text-muted-foreground">Choices available for the participant.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 rounded-full px-2.5 text-xs"
                onClick={() => {
                  const opts = [...((field as any).options || [])];
                  opts.push({ label: `Option ${opts.length + 1}`, value: `OPTION_${opts.length + 1}` });
                  updateField({ options: opts });
                }}
              >
                <Plus className="mr-1 h-3 w-3" /> Add Option
              </Button>
            </div>

            {errors.options && (
              <p className="text-xs text-destructive font-medium">{errors.options}</p>
            )}
            
            <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-border/50">
              {((field as any).options || []).length === 0 && (
                <div className="text-xs text-destructive text-center py-3">No options added yet. Please add at least 1 option.</div>
              )}
              {((field as any).options || []).map((opt: FieldOption, i: number) => {
                const labelError = errors[`opt_label_${i}`];
                const valueError = errors[`opt_value_${i}`];
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2 group">
                      <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1 shrink-0">
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>
                      <Input
                        className={cn("flex-1 bg-background h-8 text-xs", labelError && "border-destructive")}
                        value={opt.label}
                        placeholder="Option Label"
                        onChange={e => {
                          const opts = [...((field as any).options || [])];
                          const oldValue = opts[i].value;
                          const looksUntouched = oldValue === opts[i].label.toUpperCase().replace(/\s+/g, '_');
                          
                          opts[i].label = e.target.value;
                          if (looksUntouched) {
                            opts[i].value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
                          }
                          updateField({ options: opts });
                        }}
                      />
                      <Input
                        className={cn("w-32 bg-muted/30 h-8 font-mono text-[11px] text-muted-foreground", valueError && "border-destructive text-destructive")}
                        value={opt.value}
                        placeholder="OPTION_VALUE"
                        onChange={e => {
                          const opts = [...((field as any).options || [])];
                          opts[i].value = e.target.value;
                          updateField({ options: opts });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const opts = [...((field as any).options || [])];
                          opts.splice(i, 1);
                          updateField({ options: opts });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {(labelError || valueError) && (
                      <p className="text-[11px] text-destructive pl-7">{labelError || valueError}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ADVANCED SETTINGS COLLAPSIBLE SECTION */}
        {hasAdvancedControls && (
          <div className="pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1 focus-visible:outline-none"
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isAdvancedExpanded && "rotate-180")} />
              <span>Advanced settings</span>
              {hasAdvancedErrors && (
                <span className="ml-1 text-[11px] text-destructive font-semibold">(issues to fix)</span>
              )}
            </button>

            {isAdvancedExpanded && (
              <div className="mt-3 p-3.5 rounded-lg bg-muted/15 border border-border/40 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Text length limits */}
                {["SHORT_TEXT", "LONG_TEXT"].includes(field.type) && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Min Length"
                      type="number"
                      min={0}
                      className="h-8 text-xs bg-background"
                      value={(field as any).minLength ?? ""}
                      onChange={e => updateField({ minLength: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                      error={errors.minLength}
                    />
                    <Input
                      label="Max Length"
                      type="number"
                      min={0}
                      className="h-8 text-xs bg-background"
                      value={(field as any).maxLength ?? ""}
                      onChange={e => updateField({ maxLength: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                      error={errors.maxLength}
                    />
                  </div>
                )}

                {/* Number bounds */}
                {field.type === "NUMBER" && (
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Minimum"
                      type="number"
                      className="h-8 text-xs bg-background"
                      value={(field as any).min ?? ""}
                      onChange={e => updateField({ min: e.target.value !== "" ? parseFloat(e.target.value) : undefined })}
                      error={errors.min}
                    />
                    <Input
                      label="Maximum"
                      type="number"
                      className="h-8 text-xs bg-background"
                      value={(field as any).max ?? ""}
                      onChange={e => updateField({ max: e.target.value !== "" ? parseFloat(e.target.value) : undefined })}
                      error={errors.max}
                    />
                    <Input
                      label="Step"
                      type="number"
                      className="h-8 text-xs bg-background"
                      value={(field as any).step ?? ""}
                      onChange={e => updateField({ step: e.target.value !== "" ? parseFloat(e.target.value) : undefined })}
                      error={errors.step}
                    />
                  </div>
                )}

                {/* Multi-select selection limits */}
                {field.type === "MULTI_SELECT" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Min Selections"
                      type="number"
                      min={0}
                      className="h-8 text-xs bg-background"
                      value={(field as any).minSelections ?? ""}
                      onChange={e => updateField({ minSelections: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                      error={errors.minSelections}
                    />
                    <Input
                      label="Max Selections"
                      type="number"
                      min={1}
                      className="h-8 text-xs bg-background"
                      value={(field as any).maxSelections ?? ""}
                      onChange={e => updateField({ maxSelections: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                      error={errors.maxSelections}
                    />
                  </div>
                )}

                {/* Scale parameters */}
                {field.type === "SCALE" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Left Label (e.g. Low)"
                        className="h-8 text-xs bg-background"
                        value={(field as any).leftLabel || ""}
                        onChange={e => updateField({ leftLabel: e.target.value })}
                        placeholder="e.g. Low"
                        error={errors.leftLabel}
                        maxLength={51}
                      />
                      <Input
                        label="Right Label (e.g. High)"
                        className="h-8 text-xs bg-background"
                        value={(field as any).rightLabel || ""}
                        onChange={e => updateField({ rightLabel: e.target.value })}
                        placeholder="e.g. High"
                        error={errors.rightLabel}
                        maxLength={51}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Min Value"
                        type="number"
                        className="h-8 text-xs bg-background"
                        value={(field as any).min ?? 1}
                        onChange={e => updateField({ min: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                        error={errors.min}
                      />
                      <Input
                        label="Max Value"
                        type="number"
                        className="h-8 text-xs bg-background"
                        value={(field as any).max ?? 7}
                        onChange={e => updateField({ max: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                        error={errors.max}
                      />
                    </div>
                  </div>
                )}

                {/* Rating parameters */}
                {field.type === "RATING" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Min Rating"
                      type="number"
                      min={1}
                      max={10}
                      className="h-8 text-xs bg-background"
                      value={(field as any).minRating ?? 1}
                      onChange={e => updateField({ minRating: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                      error={errors.minRating}
                    />
                    <Input
                      label="Max Rating"
                      type="number"
                      min={1}
                      max={10}
                      className="h-8 text-xs bg-background"
                      value={(field as any).maxRating ?? 5}
                      onChange={e => updateField({ maxRating: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                      error={errors.maxRating}
                    />
                  </div>
                )}

                {/* Date limits */}
                {["DATE", "DATE_TIME"].includes(field.type) && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Min Date"
                      type={field.type === "DATE" ? "date" : "datetime-local"}
                      className="h-8 text-xs bg-background"
                      value={(field as any).minDate || ""}
                      onChange={e => updateField({ minDate: e.target.value || undefined })}
                      error={errors.minDate}
                    />
                    <Input
                      label="Max Date"
                      type={field.type === "DATE" ? "date" : "datetime-local"}
                      className="h-8 text-xs bg-background"
                      value={(field as any).maxDate || ""}
                      onChange={e => updateField({ maxDate: e.target.value || undefined })}
                      error={errors.maxDate}
                    />
                  </div>
                )}

                {/* Country / Language options picker */}
                {(field.type === "COUNTRY" || field.type === "LANGUAGE") && (
                  <div>
                    <LocationOptionPicker
                      mode={field.type}
                      allEntries={field.type === "COUNTRY" ? ALL_COUNTRIES : ALL_LANGUAGES}
                      optionMode={(field as LocationFieldConfig).optionMode ?? "ALL"}
                      selectedCodes={(field as LocationFieldConfig).selectedOptions ?? []}
                      defaultValue={(field as LocationFieldConfig).defaultValue ?? ""}
                      onOptionModeChange={(m) => updateField({ optionMode: m } as Partial<LocationFieldConfig>)}
                      onSelectedCodesChange={(codes) => updateField({ selectedOptions: codes } as Partial<LocationFieldConfig>)}
                      onDefaultValueChange={(code) => updateField({ defaultValue: code } as Partial<LocationFieldConfig>)}
                    />
                    {errors.selectedOptions && (
                      <p className="text-xs text-destructive mt-1">{errors.selectedOptions}</p>
                    )}
                    {errors.defaultValue && (
                      <p className="text-xs text-destructive mt-1">{errors.defaultValue}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
