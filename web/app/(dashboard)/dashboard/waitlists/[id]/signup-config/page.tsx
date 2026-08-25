"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { getSignupConfig, updateSignupConfig } from "@/services/dashboard";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, GripVertical, Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import { CustomFieldConfig, FieldRegistryEntry } from "@/types/custom-fields";
import { FieldPickerModal } from "@/components/dashboard/waitlists/signup-config/FieldPickerModal";
import { FieldConfigEditor } from "@/components/dashboard/waitlists/signup-config/FieldConfigEditor";
import { validateSignupSteps } from "@/lib/signup-config-validation";

type Step = {
  id: string;
  type: string;
  enabled: boolean;
  fields?: CustomFieldConfig[];
};

export default function SignupConfigPage() {
  const params = useParams();
  const waitlistId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  
  const [isFieldPickerOpen, setIsFieldPickerOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchConfig();
  }, [waitlistId]);

  const fetchConfig = async () => {
    try {
      const data = await getSignupConfig(waitlistId);
      setEnabled(data.enabled);
      setSteps(data.steps || []);
    } catch {
      toast.error("Failed to load signup config");
    } finally {
      setLoading(false);
    }
  };

  // Real-time validation computation
  const validationResult = useMemo(() => {
    return validateSignupSteps(steps);
  }, [steps]);

  const handleSave = async () => {
    if (enabled && !validationResult.valid) {
      toast.error(`Please resolve the ${validationResult.errors.length} configuration issue(s) before saving.`);
      return;
    }

    setSaving(true);
    try {
      await updateSignupConfig(waitlistId, enabled, steps);
      toast.success("Signup config saved successfully");
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const addQuestionsStep = () => {
    if (steps.some((s) => s.type === "QUESTIONS")) {
      toast.error("Questions step already exists");
      return;
    }
    setSteps([
      ...steps,
      {
        id: crypto.randomUUID(),
        type: "QUESTIONS",
        enabled: true,
        fields: [],
      },
    ]);
  };

  const addReferralStep = () => {
    if (steps.some((s) => s.type === "REFERRAL")) {
      toast.error("Referral step already exists");
      return;
    }
    setSteps([
      ...steps,
      {
        id: crypto.randomUUID(),
        type: "REFERRAL",
        enabled: true,
      },
    ]);
  };

  const handleAddField = (fieldReg: FieldRegistryEntry) => {
    if (activeStepIndex === null) return;
    const newSteps = [...steps];
    if (!newSteps[activeStepIndex].fields) newSteps[activeStepIndex].fields = [];
    
    const newField: CustomFieldConfig = {
      id: crypto.randomUUID(), // stable ID
      type: fieldReg.type,
      label: fieldReg.name,
      required: false,
      ...fieldReg.defaultConfig,
    } as CustomFieldConfig;

    newSteps[activeStepIndex].fields!.push(newField);
    setSteps(newSteps);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const errorCount = validationResult.errors.length;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Multi-Step Signup</h1>
          <p className="text-muted-foreground mt-2">
            Configure additional qualification steps and referrals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {enabled && !validationResult.valid && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              {errorCount} {errorCount === 1 ? "issue" : "issues"} to fix
            </span>
          )}
          <Button onClick={handleSave} disabled={saving || (enabled && !validationResult.valid)}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Validation Summary Alert Banner */}
      {enabled && !validationResult.valid && errorCount > 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Please fix {errorCount} configuration error{errorCount > 1 ? "s" : ""} before saving
              </h4>
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                {validationResult.fieldTypeErrors.map((fieldTypeErr, i) => (
                  <li key={i}>
                    {fieldTypeErr.errors.length} error{fieldTypeErr.errors.length > 1 ? "s" : ""} in {fieldTypeErr.fieldTypeName}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Enable Multi-Step Signup</h3>
            <p className="text-sm text-muted-foreground">
              Turn on to show the configured steps after signup.
            </p>
          </div>
          <input 
            type="checkbox" 
            checked={enabled} 
            onChange={(e) => setEnabled(e.target.checked)} 
            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
      </div>

      {enabled && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <Button variant="outline" onClick={addQuestionsStep}>
              <Plus className="mr-2 h-4 w-4" /> Add Questions Step
            </Button>
            <Button variant="outline" onClick={addReferralStep}>
              <Plus className="mr-2 h-4 w-4" /> Add Referral Step
            </Button>
          </div>

          <div className="space-y-6">
            {steps.map((step, stepIndex) => (
              <div
                key={step.id}
                className="rounded-lg border bg-card p-6 shadow-sm flex flex-col gap-4"
              >
                {/* STEP HEADER */}
                <div className="flex items-center justify-between mb-4 border-b pb-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <h3 className="font-semibold text-xl">
                      {step.type === "QUESTIONS" ? "Questions Step" : "Referral Step"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input 
                        type="checkbox"
                        checked={step.enabled}
                        onChange={(e) => {
                          const newSteps = [...steps];
                          newSteps[stepIndex].enabled = e.target.checked;
                          setSteps(newSteps);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Enabled
                    </label>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const newSteps = [...steps];
                        newSteps.splice(stepIndex, 1);
                        setSteps(newSteps);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* QUESTIONS FIELDS */}
                {step.type === "QUESTIONS" && step.enabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-foreground">Form Fields</h4>
                        <p className="text-sm text-muted-foreground">Add questions to qualify your waitlist.</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveStepIndex(stepIndex);
                          setIsFieldPickerOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Field
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {step.fields?.map((field, fIndex) => (
                        <FieldConfigEditor 
                          key={field.id}
                          field={field}
                          errors={validationResult.fieldErrorsMap[field.id]}
                          onChange={(updated) => {
                            const newSteps = [...steps];
                            newSteps[stepIndex].fields![fIndex] = updated;
                            setSteps(newSteps);
                          }}
                          onDelete={() => {
                            const newSteps = [...steps];
                            newSteps[stepIndex].fields!.splice(fIndex, 1);
                            setSteps(newSteps);
                          }}
                        />
                      ))}
                      {step.fields?.length === 0 && (
                        <div className="text-center p-8 border border-dashed rounded-lg bg-accent/20">
                          <p className="text-sm text-muted-foreground mb-4">
                            No fields added yet.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveStepIndex(stepIndex);
                              setIsFieldPickerOpen(true);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add your first field
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <FieldPickerModal 
        isOpen={isFieldPickerOpen} 
        onClose={() => setIsFieldPickerOpen(false)} 
        onSelect={handleAddField} 
      />
    </div>
  );
}
