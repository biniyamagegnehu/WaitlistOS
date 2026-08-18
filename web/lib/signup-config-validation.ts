import type {
  CustomFieldConfig,
  FieldType,
  ChoiceFieldConfig,
  TextFieldConfig,
  NumberFieldConfig,
  RatingFieldConfig,
  ScaleFieldConfig,
  DateTimeFieldConfig,
  LocationFieldConfig,
} from "@/types/custom-fields";
import { ALL_COUNTRIES, ALL_LANGUAGES } from "@/lib/locale-data";

const COUNTRY_CODE_SET = new Set(ALL_COUNTRIES.map((c) => c.code));
const LANGUAGE_CODE_SET = new Set(ALL_LANGUAGES.map((l) => l.code));

export interface FieldValidationError {
  fieldId: string;
  property?: string; // e.g. "label", "min", "max", "options"
  message: string;
}

export interface StepValidationResult {
  valid: boolean;
  errors: FieldValidationError[];
  fieldErrorsMap: Record<string, Record<string, string>>; // fieldId -> property -> errorMessage
}

export interface ParticipantValidationResult {
  valid: boolean;
  errors: Record<string, string>; // fieldId -> error message
}

// ─────────────────────────────────────────────────────────────────────────────
// FOUNDER SIGNUP CONFIG VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

export function validateSignupSteps(steps: any[]): StepValidationResult {
  const errors: FieldValidationError[] = [];
  const fieldErrorsMap: Record<string, Record<string, string>> = {};

  const addError = (fieldId: string, property: string, message: string) => {
    errors.push({ fieldId, property, message });
    if (!fieldErrorsMap[fieldId]) {
      fieldErrorsMap[fieldId] = {};
    }
    fieldErrorsMap[fieldId][property] = message;
  };

  if (!Array.isArray(steps)) {
    return { valid: true, errors: [], fieldErrorsMap: {} };
  }

  for (const step of steps) {
    if (step.type === "QUESTIONS" && Array.isArray(step.fields)) {
      const fieldIds = new Set<string>();

      for (let i = 0; i < step.fields.length; i++) {
        const field: CustomFieldConfig = step.fields[i];
        if (!field) continue;

        const fieldId = field.id || `field_${i}`;

        // ID validation
        if (!field.id || !/^[a-zA-Z0-9_-]{1,64}$/.test(field.id.trim())) {
          addError(fieldId, "id", "Field ID must contain only letters, numbers, hyphens, and underscores.");
        } else if (fieldIds.has(field.id.trim())) {
          addError(fieldId, "id", `Duplicate field identifier "${field.id}".`);
        } else {
          fieldIds.add(field.id.trim());
        }

        // Label validation
        const label = typeof field.label === "string" ? field.label.trim() : "";
        if (!label) {
          addError(fieldId, "label", "Field label is required.");
        } else if (label.length > 100) {
          addError(fieldId, "label", "Field label must be 100 characters or less.");
        } else if (/<\s*script|javascript:/i.test(label)) {
          addError(fieldId, "label", "Field label contains unsupported content.");
        }

        // Description validation
        const description = typeof field.description === "string" ? field.description.trim() : "";
        if (description.length > 300) {
          addError(fieldId, "description", "Description must be 300 characters or less.");
        } else if (description && /<\s*script|javascript:/i.test(description)) {
          addError(fieldId, "description", "Description contains unsupported content.");
        }

        // Type-specific validation
        switch (field.type) {
          case "SHORT_TEXT":
          case "LONG_TEXT":
          case "EMAIL":
          case "PHONE":
          case "URL": {
            const txt = field as TextFieldConfig;
            const minLen = txt.minLength !== undefined && txt.minLength !== null && (txt.minLength as any) !== "" ? Number(txt.minLength) : undefined;
            const maxLen = txt.maxLength !== undefined && txt.maxLength !== null && (txt.maxLength as any) !== "" ? Number(txt.maxLength) : undefined;

            if (minLen !== undefined && (isNaN(minLen) || minLen < 0 || minLen > 10000)) {
              addError(fieldId, "minLength", "Min length must be between 0 and 10,000.");
            }
            if (maxLen !== undefined && (isNaN(maxLen) || maxLen < 0 || maxLen > 10000)) {
              addError(fieldId, "maxLength", "Max length must be between 0 and 10,000.");
            }
            if (minLen !== undefined && maxLen !== undefined && minLen > maxLen) {
              addError(fieldId, "minLength", "Min length cannot be greater than max length.");
            }
            break;
          }

          case "SINGLE_SELECT":
          case "MULTI_SELECT":
          case "DROPDOWN": {
            const choice = field as ChoiceFieldConfig;
            const options = choice.options || [];

            if (!Array.isArray(options) || options.length === 0) {
              addError(fieldId, "options", "You must add at least 1 option.");
            } else if (options.length > 50) {
              addError(fieldId, "options", "Cannot exceed 50 options.");
            } else {
              const optValues = new Set<string>();
              const optLabels = new Set<string>();

              for (let j = 0; j < options.length; j++) {
                const opt = options[j];
                const optLabel = typeof opt.label === "string" ? opt.label.trim() : "";
                const optVal = typeof opt.value === "string" ? opt.value.trim() : "";

                if (!optLabel) {
                  addError(fieldId, `opt_label_${j}`, `Option ${j + 1} label is required.`);
                } else if (optLabel.length > 100) {
                  addError(fieldId, `opt_label_${j}`, `Option ${j + 1} label cannot exceed 100 characters.`);
                } else if (optLabels.has(optLabel.toLowerCase())) {
                  addError(fieldId, `opt_label_${j}`, `Option label "${optLabel}" is duplicated.`);
                }
                optLabels.add(optLabel.toLowerCase());

                if (!optVal) {
                  addError(fieldId, `opt_value_${j}`, `Option ${j + 1} value is required.`);
                } else if (optVal.length > 100) {
                  addError(fieldId, `opt_value_${j}`, `Option ${j + 1} value cannot exceed 100 characters.`);
                } else if (optValues.has(optVal.toLowerCase())) {
                  addError(fieldId, `opt_value_${j}`, `Option value "${optVal}" is duplicated.`);
                }
                optValues.add(optVal.toLowerCase());
              }
            }

            if (field.type === "MULTI_SELECT") {
              const minSel = choice.minSelections !== undefined && choice.minSelections !== null && (choice.minSelections as any) !== "" ? Number(choice.minSelections) : undefined;
              const maxSel = choice.maxSelections !== undefined && choice.maxSelections !== null && (choice.maxSelections as any) !== "" ? Number(choice.maxSelections) : undefined;

              if (minSel !== undefined && (isNaN(minSel) || minSel < 0)) {
                addError(fieldId, "minSelections", "Min selections must be a positive integer.");
              } else if (minSel !== undefined && minSel > options.length) {
                addError(fieldId, "minSelections", `Min selections cannot exceed total options (${options.length}).`);
              }

              if (maxSel !== undefined && (isNaN(maxSel) || maxSel < 1)) {
                addError(fieldId, "maxSelections", "Max selections must be at least 1.");
              } else if (maxSel !== undefined && maxSel > options.length) {
                addError(fieldId, "maxSelections", `Max selections cannot exceed total options (${options.length}).`);
              }

              if (minSel !== undefined && maxSel !== undefined && minSel > maxSel) {
                addError(fieldId, "minSelections", "Min selections cannot be greater than max selections.");
              }
            }
            break;
          }

          case "NUMBER": {
            const numField = field as NumberFieldConfig;
            const min = numField.min !== undefined && numField.min !== null && (numField.min as any) !== "" ? Number(numField.min) : undefined;
            const max = numField.max !== undefined && numField.max !== null && (numField.max as any) !== "" ? Number(numField.max) : undefined;

            if (min !== undefined && !Number.isFinite(min)) {
              addError(fieldId, "min", "Min value must be a valid number.");
            }
            if (max !== undefined && !Number.isFinite(max)) {
              addError(fieldId, "max", "Max value must be a valid number.");
            }
            if (min !== undefined && max !== undefined && min > max) {
              addError(fieldId, "min", "Minimum value cannot be greater than maximum value.");
            }
            break;
          }

          case "RATING": {
            const rField = field as RatingFieldConfig;
            const minR = rField.minRating || 1;
            const maxR = rField.maxRating || 5;

            if (minR < 1 || minR > 10) {
              addError(fieldId, "minRating", "Min rating must be between 1 and 10.");
            }
            if (maxR < 1 || maxR > 10) {
              addError(fieldId, "maxRating", "Max rating must be between 1 and 10.");
            }
            if (minR > maxR) {
              addError(fieldId, "minRating", "Min rating cannot be greater than max rating.");
            }
            break;
          }

          case "SCALE": {
            const sField = field as ScaleFieldConfig;
            const minS = sField.min !== undefined ? Number(sField.min) : 1;
            const maxS = sField.max !== undefined ? Number(sField.max) : 7;

            if (isNaN(minS) || isNaN(maxS) || minS >= maxS) {
              addError(fieldId, "min", "Min value must be less than max value.");
            }
            if (maxS - minS > 20) {
              addError(fieldId, "max", "Scale range cannot exceed 20 points.");
            }
            if (sField.leftLabel && sField.leftLabel.length > 50) {
              addError(fieldId, "leftLabel", "Left label cannot exceed 50 characters.");
            }
            if (sField.rightLabel && sField.rightLabel.length > 50) {
              addError(fieldId, "rightLabel", "Right label cannot exceed 50 characters.");
            }
            break;
          }

          case "COUNTRY":
          case "LANGUAGE": {
            const locField = field as LocationFieldConfig;
            const codeSet = field.type === "COUNTRY" ? COUNTRY_CODE_SET : LANGUAGE_CODE_SET;
            const labelType = field.type === "COUNTRY" ? "country" : "language";

            if (locField.optionMode === "SELECTED") {
              if (!Array.isArray(locField.selectedOptions) || locField.selectedOptions.length === 0) {
                addError(fieldId, "selectedOptions", `Please select at least one ${labelType}.`);
              } else {
                for (const code of locField.selectedOptions) {
                  if (!codeSet.has(code)) {
                    addError(fieldId, "selectedOptions", `Invalid ${labelType} code "${code}".`);
                    break;
                  }
                }
              }
            }

            if (locField.defaultValue) {
              if (!codeSet.has(locField.defaultValue)) {
                addError(fieldId, "defaultValue", `Invalid default ${labelType} code.`);
              } else if (
                locField.optionMode === "SELECTED" &&
                Array.isArray(locField.selectedOptions) &&
                !locField.selectedOptions.includes(locField.defaultValue)
              ) {
                addError(fieldId, "defaultValue", `Default ${labelType} must be among selected options.`);
              }
            }
            break;
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrorsMap,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC PARTICIPANT ANSWER VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

export function validateParticipantAnswers(
  fields: CustomFieldConfig[],
  answers: Record<string, any>
): ParticipantValidationResult {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const value = answers[field.id];
    const err = validateSingleParticipantField(field, value);
    if (err) {
      errors[field.id] = err;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSingleParticipantField(
  field: CustomFieldConfig,
  value: any
): string | undefined {
  const label = field.label || "This field";

  // Check required
  if (field.required) {
    if (field.type === "CONSENT") {
      if (value !== true) {
        return `${label} must be accepted.`;
      }
      return undefined;
    }

    if (field.type === "BOOLEAN") {
      if (typeof value !== "boolean") {
        return `${label} is required.`;
      }
      return undefined;
    }

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return `${label} is required.`;
    }
  }

  // Skip if empty & optional
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return undefined;
  }

  switch (field.type) {
    case "SHORT_TEXT":
    case "LONG_TEXT": {
      if (typeof value !== "string") return `${label} must be text.`;
      const txt = field as TextFieldConfig;
      const trimmed = value.trim();

      if (txt.minLength !== undefined && trimmed.length < txt.minLength) {
        return `${label} must be at least ${txt.minLength} characters.`;
      }
      const max = txt.maxLength || (field.type === "SHORT_TEXT" ? 500 : 5000);
      if (value.length > max) {
        return `${label} cannot exceed ${max} characters.`;
      }
      if (/<\s*script|javascript:/i.test(value)) {
        return `${label} contains unsupported content.`;
      }
      return undefined;
    }

    case "EMAIL": {
      if (typeof value !== "string") return `${label} must be an email address.`;
      const trimmed = value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return `Please enter a valid email address.`;
      }
      if (trimmed.length > 255) return `${label} cannot exceed 255 characters.`;
      return undefined;
    }

    case "PHONE": {
      if (typeof value !== "string") return `${label} must be a phone number.`;
      const trimmed = value.trim();
      if (!/^\+?[0-9\s\-()]{7,25}$/.test(trimmed)) {
        return `Please enter a valid phone number.`;
      }
      return undefined;
    }

    case "URL": {
      if (typeof value !== "string") return `${label} must be a valid URL.`;
      const trimmed = value.trim();
      if (/<\s*script|javascript:/i.test(trimmed)) {
        return `${label} contains unsupported content.`;
      }
      if (!/^https?:\/\/.+/i.test(trimmed)) {
        return `Please enter a valid URL starting with http:// or https://`;
      }
      if (trimmed.length > 2048) return `${label} cannot exceed 2048 characters.`;
      return undefined;
    }

    case "SINGLE_SELECT":
    case "DROPDOWN": {
      if (typeof value !== "string") return `Please select an option for ${label}.`;
      const choice = field as ChoiceFieldConfig;
      const validValues = (choice.options || []).map((o) => o.value);
      if (!validValues.includes(value)) {
        return `Please select a valid option for ${label}.`;
      }
      return undefined;
    }

    case "MULTI_SELECT": {
      if (!Array.isArray(value)) return `Please select options for ${label}.`;
      const choice = field as ChoiceFieldConfig;
      const validValues = new Set((choice.options || []).map((o) => o.value));

      const seen = new Set<string>();
      for (const v of value) {
        if (!validValues.has(v)) {
          return `Invalid option selected for ${label}.`;
        }
        if (seen.has(v)) {
          return `Duplicate options selected for ${label}.`;
        }
        seen.add(v);
      }

      if (choice.minSelections && value.length < choice.minSelections) {
        return `Please select at least ${choice.minSelections} option${choice.minSelections > 1 ? "s" : ""}.`;
      }
      if (choice.maxSelections && value.length > choice.maxSelections) {
        return `You cannot select more than ${choice.maxSelections} option${choice.maxSelections > 1 ? "s" : ""}.`;
      }
      return undefined;
    }

    case "BOOLEAN": {
      if (typeof value !== "boolean") return `${label} must be true or false.`;
      return undefined;
    }

    case "CONSENT": {
      if (typeof value !== "boolean") return `${label} must be accepted.`;
      if (field.required && value !== true) {
        return `${label} must be accepted.`;
      }
      return undefined;
    }

    case "NUMBER": {
      if (typeof value !== "number" || !Number.isFinite(value) || isNaN(value)) {
        return `Please enter a valid number for ${label}.`;
      }
      const numField = field as NumberFieldConfig;
      if (numField.min !== undefined && value < numField.min) {
        return `${label} must be at least ${numField.min}.`;
      }
      if (numField.max !== undefined && value > numField.max) {
        return `${label} cannot exceed ${numField.max}.`;
      }
      return undefined;
    }

    case "RATING": {
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return `Please select a rating for ${label}.`;
      }
      const rField = field as RatingFieldConfig;
      const minR = rField.minRating || 1;
      const maxR = rField.maxRating || 5;
      if (value < minR || value > maxR) {
        return `Rating must be between ${minR} and ${maxR}.`;
      }
      return undefined;
    }

    case "SCALE": {
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return `Please select a value for ${label}.`;
      }
      const sField = field as ScaleFieldConfig;
      const minS = sField.min || 1;
      const maxS = sField.max || 7;
      if (value < minS || value > maxS) {
        return `Value must be between ${minS} and ${maxS}.`;
      }
      return undefined;
    }

    case "DATE":
    case "DATE_TIME": {
      if (typeof value !== "string") return `Please enter a valid date for ${label}.`;
      const d = new Date(value);
      if (isNaN(d.getTime())) return `Please enter a valid date for ${label}.`;
      const dtField = field as DateTimeFieldConfig;
      if (dtField.minDate && d < new Date(dtField.minDate)) {
        return `${label} cannot be before ${dtField.minDate}.`;
      }
      if (dtField.maxDate && d > new Date(dtField.maxDate)) {
        return `${label} cannot be after ${dtField.maxDate}.`;
      }
      return undefined;
    }

    case "COUNTRY": {
      if (typeof value !== "string") return `Please select a country.`;
      if (!COUNTRY_CODE_SET.has(value.trim())) return `Please select a valid country.`;
      const countryField = field as LocationFieldConfig;
      if (
        countryField.optionMode === "SELECTED" &&
        Array.isArray(countryField.selectedOptions) &&
        countryField.selectedOptions.length > 0 &&
        !countryField.selectedOptions.includes(value.trim())
      ) {
        return `Please select an allowed country.`;
      }
      return undefined;
    }

    case "LANGUAGE": {
      if (typeof value !== "string") return `Please select a language.`;
      if (!LANGUAGE_CODE_SET.has(value.trim())) return `Please select a valid language.`;
      const languageField = field as LocationFieldConfig;
      if (
        languageField.optionMode === "SELECTED" &&
        Array.isArray(languageField.selectedOptions) &&
        languageField.selectedOptions.length > 0 &&
        !languageField.selectedOptions.includes(value.trim())
      ) {
        return `Please select an allowed language.`;
      }
      return undefined;
    }

    default:
      return undefined;
  }
}
