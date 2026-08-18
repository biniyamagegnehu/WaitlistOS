"use client";

import React from "react";
import { CustomFieldConfig, FieldOption, LocationFieldConfig } from "@/types/custom-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, GripVertical, Plus, Settings2, AlertCircle } from "lucide-react";
import { LocationOptionPicker } from "./LocationOptionPicker";
import { ALL_COUNTRIES, ALL_LANGUAGES } from "@/lib/locale-data";
import { cn } from "@/lib/cn";

interface FieldConfigEditorProps {
  field: CustomFieldConfig;
  onChange: (updatedField: CustomFieldConfig) => void;
  onDelete: () => void;
  errors?: Record<string, string>;
}

function Switch({ checked, onChange, id }: { checked: boolean; onChange: (c: boolean) => void; id?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
  const updateField = (changes: Partial<CustomFieldConfig>) => {
    onChange({ ...field, ...changes } as CustomFieldConfig);
  };

  const hasOptions = ["SINGLE_SELECT", "MULTI_SELECT", "DROPDOWN"].includes(field.type);
  const friendlyType = field.type.replace(/_/g, " ");

  const hasAnyErrors = Object.keys(errors).length > 0;

  return (
    <Card className={cn("shadow-sm border-border/60 transition-all hover:border-border/80", hasAnyErrors && "border-destructive/60")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="cursor-grab hover:bg-muted p-1.5 rounded-md text-muted-foreground transition-colors active:cursor-grabbing">
            <GripVertical className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            {friendlyType}
            {hasAnyErrors && (
              <span className="flex items-center gap-1 text-xs text-destructive font-normal">
                <AlertCircle className="h-3.5 w-3.5" /> Issues to fix
              </span>
            )}
          </CardTitle>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <label htmlFor={`req-${field.id}`} className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              Required
            </label>
            <Switch id={`req-${field.id}`} checked={field.required} onChange={(c) => updateField({ required: c })} />
          </div>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 space-y-6">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">
                Label / Question <span className="text-destructive">*</span>
              </label>
              <CharCounter value={field.label || ""} max={100} />
            </div>
            <Input
              value={field.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="e.g. What is your job title?"
              className={cn("bg-background", errors.label && "border-destructive focus-visible:ring-destructive")}
              error={errors.label}
              maxLength={101}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground">Description (Optional)</label>
              <CharCounter value={field.description || ""} max={300} />
            </div>
            <Input
              value={field.description || ""}
              onChange={(e) => updateField({ description: e.target.value })}
              placeholder="Help text for the user"
              className={cn("bg-background", errors.description && "border-destructive focus-visible:ring-destructive")}
              error={errors.description}
              maxLength={301}
            />
          </div>
        </div>

        {/* DYNAMIC PROPERTIES */}
        {["SHORT_TEXT", "LONG_TEXT"].includes(field.type) && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              label="Min Length"
              type="number"
              min={0}
              value={(field as any).minLength ?? ""}
              onChange={e => updateField({ minLength: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
              error={errors.minLength}
            />
            <Input
              label="Max Length"
              type="number"
              min={0}
              value={(field as any).maxLength ?? ""}
              onChange={e => updateField({ maxLength: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
              error={errors.maxLength}
            />
          </div>
        )}

        {field.type === "NUMBER" && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              label="Minimum"
              type="number"
              value={(field as any).min ?? ""}
              onChange={e => updateField({ min: e.target.value !== "" ? parseFloat(e.target.value) : undefined })}
              error={errors.min}
            />
            <Input
              label="Maximum"
              type="number"
              value={(field as any).max ?? ""}
              onChange={e => updateField({ max: e.target.value !== "" ? parseFloat(e.target.value) : undefined })}
              error={errors.max}
            />
          </div>
        )}

        {field.type === "SCALE" && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Left Label (e.g. Low)"
                value={(field as any).leftLabel || ""}
                onChange={e => updateField({ leftLabel: e.target.value })}
                placeholder="e.g. Very Low"
                error={errors.leftLabel}
                maxLength={51}
              />
              <Input
                label="Right Label (e.g. High)"
                value={(field as any).rightLabel || ""}
                onChange={e => updateField({ rightLabel: e.target.value })}
                placeholder="e.g. Very High"
                error={errors.rightLabel}
                maxLength={51}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Min Value"
                type="number"
                value={(field as any).min ?? 1}
                onChange={e => updateField({ min: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                error={errors.min}
              />
              <Input
                label="Max Value"
                type="number"
                value={(field as any).max ?? 7}
                onChange={e => updateField({ max: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
                error={errors.max}
              />
            </div>
          </div>
        )}

        {field.type === "RATING" && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              label="Min Rating"
              type="number"
              min={1}
              max={10}
              value={(field as any).minRating ?? 1}
              onChange={e => updateField({ minRating: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
              error={errors.minRating}
            />
            <Input
              label="Max Rating"
              type="number"
              min={1}
              max={10}
              value={(field as any).maxRating ?? 5}
              onChange={e => updateField({ maxRating: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
              error={errors.maxRating}
            />
          </div>
        )}

        {field.type === "MULTI_SELECT" && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input
              label="Min Selections"
              type="number"
              min={0}
              value={(field as any).minSelections ?? ""}
              onChange={e => updateField({ minSelections: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
              error={errors.minSelections}
            />
            <Input
              label="Max Selections"
              type="number"
              min={1}
              value={(field as any).maxSelections ?? ""}
              onChange={e => updateField({ maxSelections: e.target.value !== "" ? parseInt(e.target.value) : undefined })}
              error={errors.maxSelections}
            />
          </div>
        )}

        {/* OPTIONS LIST FOR CHOICE FIELDS */}
        {hasOptions && (
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Options <span className="text-destructive">*</span>
              </label>
              <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => {
                const opts = [...((field as any).options || [])];
                opts.push({ label: `Option ${opts.length + 1}`, value: `OPTION_${opts.length + 1}` });
                updateField({ options: opts });
              }}>
                <Plus className="mr-1 h-3 w-3" /> Add Option
              </Button>
            </div>

            {errors.options && (
              <p className="text-xs text-destructive font-medium">{errors.options}</p>
            )}
            
            <div className="space-y-2 bg-muted/10 p-3 rounded-lg border border-border/50">
              {((field as any).options || []).length === 0 && (
                <div className="text-sm text-destructive text-center py-4">No options added yet. Please add at least 1 option.</div>
              )}
              {((field as any).options || []).map((opt: FieldOption, i: number) => {
                const labelError = errors[`opt_label_${i}`];
                const valueError = errors[`opt_value_${i}`];
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2 group">
                      <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <Input
                        className={cn("flex-1 bg-background h-9 text-sm", labelError && "border-destructive")}
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
                        className={cn("flex-1 bg-muted/30 h-9 font-mono text-xs text-muted-foreground", valueError && "border-destructive text-destructive")}
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
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const opts = [...((field as any).options || [])];
                          opts.splice(i, 1);
                          updateField({ options: opts });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {(labelError || valueError) && (
                      <p className="text-xs text-destructive pl-7">{labelError || valueError}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LOCATION CONFIG (COUNTRY / LANGUAGE) */}
        {(field.type === "COUNTRY" || field.type === "LANGUAGE") && (
          <div className="pt-2">
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
      </CardContent>
    </Card>
  );
}
