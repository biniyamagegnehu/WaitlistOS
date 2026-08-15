"use client";

import React from "react";
import { CustomFieldConfig, FieldOption, LocationFieldConfig } from "@/types/custom-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Trash2, GripVertical, Plus, Settings2 } from "lucide-react";
import { LocationOptionPicker } from "./LocationOptionPicker";
import { ALL_COUNTRIES, ALL_LANGUAGES } from "@/lib/locale-data";
import { cn } from "@/lib/cn";

interface FieldConfigEditorProps {
  field: CustomFieldConfig;
  onChange: (updatedField: CustomFieldConfig) => void;
  onDelete: () => void;
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

export function FieldConfigEditor({ field, onChange, onDelete }: FieldConfigEditorProps) {
  const updateField = (changes: Partial<CustomFieldConfig>) => {
    onChange({ ...field, ...changes } as CustomFieldConfig);
  };

  const hasOptions = ["SINGLE_SELECT", "MULTI_SELECT", "DROPDOWN"].includes(field.type);
  const friendlyType = field.type.replace(/_/g, " ");

  return (
    <Card className="shadow-sm border-border/60 transition-all hover:border-border/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="cursor-grab hover:bg-muted p-1.5 rounded-md text-muted-foreground transition-colors active:cursor-grabbing">
            <GripVertical className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            {friendlyType}
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
          <Input
            label="Label / Question"
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
            placeholder="e.g. What is your job title?"
            className="bg-background"
          />
          <Input
            label="Description (Optional)"
            value={field.description || ""}
            onChange={(e) => updateField({ description: e.target.value })}
            placeholder="Help text for the user"
            className="bg-background"
          />
        </div>

        {/* DYNAMIC PROPERTIES */}
        {["SHORT_TEXT", "LONG_TEXT"].includes(field.type) && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input label="Min Length" type="number" value={(field as any).minLength || ""} onChange={e => updateField({ minLength: e.target.value ? parseInt(e.target.value) : undefined })} />
            <Input label="Max Length" type="number" value={(field as any).maxLength || ""} onChange={e => updateField({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })} />
          </div>
        )}

        {field.type === "NUMBER" && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input label="Minimum" type="number" value={(field as any).min || ""} onChange={e => updateField({ min: e.target.value ? parseFloat(e.target.value) : undefined })} />
            <Input label="Maximum" type="number" value={(field as any).max || ""} onChange={e => updateField({ max: e.target.value ? parseFloat(e.target.value) : undefined })} />
          </div>
        )}

        {field.type === "SCALE" && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input label="Left Label" value={(field as any).leftLabel || ""} onChange={e => updateField({ leftLabel: e.target.value })} placeholder="e.g. Very Low" />
            <Input label="Right Label" value={(field as any).rightLabel || ""} onChange={e => updateField({ rightLabel: e.target.value })} placeholder="e.g. Very High" />
            <Input label="Min Value" type="number" value={(field as any).min || 1} onChange={e => updateField({ min: e.target.value ? parseInt(e.target.value) : undefined })} />
            <Input label="Max Value" type="number" value={(field as any).max || 7} onChange={e => updateField({ max: e.target.value ? parseInt(e.target.value) : undefined })} />
          </div>
        )}

        {field.type === "RATING" && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input label="Min Rating" type="number" value={(field as any).minRating || 1} onChange={e => updateField({ minRating: e.target.value ? parseInt(e.target.value) : undefined })} />
            <Input label="Max Rating" type="number" value={(field as any).maxRating || 5} onChange={e => updateField({ maxRating: e.target.value ? parseInt(e.target.value) : undefined })} />
          </div>
        )}

        {field.type === "MULTI_SELECT" && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Input label="Min Selections" type="number" value={(field as any).minSelections || ""} onChange={e => updateField({ minSelections: e.target.value ? parseInt(e.target.value) : undefined })} />
            <Input label="Max Selections" type="number" value={(field as any).maxSelections || ""} onChange={e => updateField({ maxSelections: e.target.value ? parseInt(e.target.value) : undefined })} />
          </div>
        )}

        {/* OPTIONS LIST FOR CHOICE FIELDS */}
        {hasOptions && (
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Options</label>
              <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" onClick={() => {
                const opts = [...((field as any).options || [])];
                opts.push({ label: `Option ${opts.length + 1}`, value: `OPTION_${opts.length + 1}` });
                updateField({ options: opts });
              }}>
                <Plus className="mr-1 h-3 w-3" /> Add Option
              </Button>
            </div>
            
            <div className="space-y-2 bg-muted/10 p-3 rounded-lg border border-border/50">
              {((field as any).options || []).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">No options added yet.</div>
              )}
              {((field as any).options || []).map((opt: FieldOption, i: number) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <Input
                    className="flex-1 bg-background h-9 text-sm"
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
                    className="flex-1 bg-muted/30 h-9 font-mono text-xs text-muted-foreground"
                    value={opt.value}
                    placeholder="OPTION_VALUE"
                    onChange={e => {
                      const opts = [...((field as any).options || [])];
                      opts[i].value = e.target.value;
                      updateField({ options: opts });
                    }}
                  />
                  <Button variant="ghost" size="sm" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10" onClick={() => {
                    const opts = [...((field as any).options || [])];
                    opts.splice(i, 1);
                    updateField({ options: opts });
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
