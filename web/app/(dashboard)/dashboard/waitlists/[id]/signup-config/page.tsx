"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { getSignupConfig, updateSignupConfig } from "@/services/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { LoadingState } from "@/components/patterns/loading-state";
import { ErrorState } from "@/components/patterns/error-state";
import { PageContainer } from "@/components/patterns/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { Loader2, Plus, GripVertical, Trash2, AlertCircle } from "lucide-react";
import { CustomFieldConfig, FieldRegistryEntry } from "@/types/custom-fields";
import { FieldPickerModal } from "@/components/dashboard/waitlists/signup-config/FieldPickerModal";
import { FieldConfigEditor } from "@/components/dashboard/waitlists/signup-config/FieldConfigEditor";
import { validateSignupSteps } from "@/lib/signup-config-validation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

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

  const handleAddField = (fieldRegs: FieldRegistryEntry[]) => {
    if (activeStepIndex === null) return;
    const newSteps = [...steps];
    if (!newSteps[activeStepIndex].fields) newSteps[activeStepIndex].fields = [];

    const newFields: CustomFieldConfig[] = fieldRegs.map(fieldReg => ({
      id: crypto.randomUUID(), // stable ID
      type: fieldReg.type,
      label: fieldReg.name,
      required: false,
      ...fieldReg.defaultConfig,
    } as CustomFieldConfig));

    newSteps[activeStepIndex].fields!.push(...newFields);
    setSteps(newSteps);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceStepIndex = parseInt(source.droppableId);
    const destStepIndex = parseInt(destination.droppableId);

    if (sourceStepIndex === destStepIndex) {
      // Reordering within the same step
      const newSteps = [...steps];
      const step = newSteps[sourceStepIndex];
      const items = Array.from(step.fields || []);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      step.fields = items;
      setSteps(newSteps);
    }
  };

  // Prevent body scroll when multiple fields are present
  useEffect(() => {
    const hasMultipleFields = steps.some(step => step.fields && step.fields.length > 1);
    if (hasMultipleFields) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [steps]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState variant="skeleton" skeletonCount={3} />
      </PageContainer>
    );
  }

  const errorCount = validationResult.errors.length;

  return (
    <PageContainer>
      <PageHeader
        title="Multi-Step Signup"
        description="Configure additional qualification steps and referrals."
        primaryAction={
          <div className="flex items-center gap-3">
            {enabled && !validationResult.valid && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-warning">
                <AlertCircle className="h-4 w-4" />
                {errorCount} {errorCount === 1 ? "issue" : "issues"} to fix
              </span>
            )}
            <Button onClick={handleSave} disabled={saving || (enabled && !validationResult.valid)}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        }
      />

      {/* Validation Summary Alert Banner */}
      {enabled && !validationResult.valid && errorCount > 0 && (
        <Alert variant="warning" title={`Please fix ${errorCount} configuration error${errorCount > 1 ? "s" : ""} before saving`}>
          <div className="space-y-1">
            {validationResult.fieldTypeErrors.map((fieldTypeErr, i) => (
              <div key={i} className="text-xs">
                {fieldTypeErr.errors.length} error{fieldTypeErr.errors.length > 1 ? "s" : ""} in {fieldTypeErr.fieldTypeName}
              </div>
            ))}
          </div>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Enable Multi-Step Signup</h3>
              <p className="text-sm text-text-muted">
                Turn on to show the configured steps after signup.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <div className="space-y-6 min-h-0">
          <div className="flex gap-4">
            <Button variant="outline" onClick={addQuestionsStep}>
              <Plus className="mr-2 h-4 w-4" /> Add Questions Step
            </Button>
            <Button variant="outline" onClick={addReferralStep}>
              <Plus className="mr-2 h-4 w-4" /> Add Referral Step
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="space-y-6">
              {steps.map((step, stepIndex) => (
                <Card key={step.id}>
                  <CardContent className="p-6 flex flex-col gap-4">
                    {/* STEP HEADER */}
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-text-muted cursor-grab" />
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
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
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
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    </div>

                    {/* QUESTIONS FIELDS */}
                    {step.type === "QUESTIONS" && step.enabled && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-text-primary">Form Fields</h4>
                            <p className="text-sm text-text-muted">Add questions to qualify your waitlist.</p>
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

                        <Droppable droppableId={stepIndex.toString()}>
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-4 overflow-visible"
                            >
                              {step.fields?.map((field, fIndex) => (
                                <Draggable key={field.id} draggableId={field.id} index={fIndex}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={snapshot.isDragging ? "opacity-50" : ""}
                                    >
                                      <FieldConfigEditor
                                        field={field}
                                        errors={validationResult.fieldErrorsMap[field.id]}
                                        dragHandleProps={provided.dragHandleProps}
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
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                              {step.fields?.length === 0 && (
                                <div className="text-center p-8 border border-dashed rounded-lg bg-surface-muted">
                                  <p className="text-sm text-text-muted mb-4">
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
                          )}
                        </Droppable>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      <FieldPickerModal
        isOpen={isFieldPickerOpen}
        onClose={() => setIsFieldPickerOpen(false)}
        onSelect={handleAddField}
      />
    </PageContainer>
  );
}
