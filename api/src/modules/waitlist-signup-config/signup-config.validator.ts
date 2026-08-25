import { BadRequestException } from '@nestjs/common';
import { COUNTRY_CODE_SET, LANGUAGE_CODE_SET } from '../../common/locale-data';
import { FIELD_VALIDATION_LIMITS, resolveTextValidation } from '../../common/constants/field-validation.defaults';
import type {
  CustomFieldConfig,
  FieldType,
  LocationFieldConfig,
  ChoiceFieldConfig,
  TextFieldConfig,
  NumberFieldConfig,
  RatingFieldConfig,
  ScaleFieldConfig,
  DateTimeFieldConfig,
} from '../../common/types/custom-fields';

export const SUPPORTED_FIELD_TYPES: FieldType[] = [
  'SHORT_TEXT',
  'LONG_TEXT',
  'EMAIL',
  'PHONE',
  'URL',
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'DROPDOWN',
  'BOOLEAN',
  'RATING',
  'SCALE',
  'NUMBER',
  'DATE',
  'DATE_TIME',
  'COUNTRY',
  'LANGUAGE',
  'CONSENT',
];

export const STEP_TYPES = ['QUESTIONS', 'REFERRAL'] as const;

export interface SignupStepConfig {
  id: string;
  type: (typeof STEP_TYPES)[number];
  enabled: boolean;
  fields?: CustomFieldConfig[];
}

export class SignupConfigValidator {
  /**
   * Validates the whole steps configuration array.
   */
  static validateSteps(steps: unknown): SignupStepConfig[] {
    if (!Array.isArray(steps)) {
      throw new BadRequestException('Steps must be an array');
    }

    if (steps.length > 10) {
      throw new BadRequestException('Cannot have more than 10 steps');
    }

    const stepIds = new Set<string>();
    const stepTypes = new Set<string>();
    const validatedSteps: SignupStepConfig[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step || typeof step !== 'object' || Array.isArray(step)) {
        throw new BadRequestException(`Step ${i + 1} is invalid`);
      }

      const id = typeof step.id === 'string' ? step.id.trim() : '';
      if (!id || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
        throw new BadRequestException(`Step ${i + 1} has an invalid or missing id`);
      }
      if (stepIds.has(id)) {
        throw new BadRequestException(`Duplicate step id: ${id}`);
      }
      stepIds.add(id);

      const type = step.type;
      if (!STEP_TYPES.includes(type)) {
        throw new BadRequestException(`Step ${id} has unsupported type: ${type}`);
      }
      if (stepTypes.has(type)) {
        throw new BadRequestException(`Only one ${type} step is allowed`);
      }
      stepTypes.add(type);

      const enabled = typeof step.enabled === 'boolean' ? step.enabled : true;

      let validatedFields: CustomFieldConfig[] | undefined = undefined;
      if (type === 'QUESTIONS') {
        if (step.fields !== undefined && !Array.isArray(step.fields)) {
          throw new BadRequestException(`Questions step ${id} fields must be an array`);
        }
        validatedFields = this.validateFields(step.fields || []);
      }

      validatedSteps.push({
        id,
        type,
        enabled,
        ...(validatedFields ? { fields: validatedFields } : {}),
      });
    }

    return validatedSteps;
  }

  /**
   * Validates a list of custom field configurations.
   */
  static validateFields(fields: unknown[]): CustomFieldConfig[] {
    if (!Array.isArray(fields)) {
      throw new BadRequestException('Fields must be an array');
    }

    if (fields.length > 50) {
      throw new BadRequestException('Cannot have more than 50 custom fields in a step');
    }

    const fieldIds = new Set<string>();
    const validatedFields: CustomFieldConfig[] = [];

    for (let i = 0; i < fields.length; i++) {
      const rawField = fields[i];
      if (!rawField || typeof rawField !== 'object' || Array.isArray(rawField)) {
        throw new BadRequestException(`Field ${i + 1} is invalid`);
      }

      const field = rawField as Record<string, unknown>;

      // Validate ID
      const id = typeof field.id === 'string' ? field.id.trim() : '';
      if (!id || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
        throw new BadRequestException(`Field ${i + 1} must have a valid identifier id`);
      }
      if (fieldIds.has(id)) {
        throw new BadRequestException(`Duplicate field id: ${id}`);
      }
      fieldIds.add(id);

      // Validate Type
      const type = field.type as FieldType;
      if (!SUPPORTED_FIELD_TYPES.includes(type)) {
        throw new BadRequestException(`Field ${id} has unsupported field type: ${type}`);
      }

      // Validate Label
      const label = typeof field.label === 'string' ? field.label.trim() : '';
      if (!label) {
        throw new BadRequestException(`Field ${id} label is required`);
      }
      if (label.length > 100) {
        throw new BadRequestException(`Field ${id} label must be 100 characters or less`);
      }
      this.assertNoXss(label, `Field ${id} label`);

      // Validate Description
      const description = typeof field.description === 'string' ? field.description.trim() : '';
      if (description.length > 300) {
        throw new BadRequestException(`Field ${id} description must be 300 characters or less`);
      }
      if (description) {
        this.assertNoXss(description, `Field ${id} description`);
      }

      // Validate Required flag
      const required = typeof field.required === 'boolean' ? field.required : false;

      const baseConfig = {
        id,
        type,
        label,
        description: description || undefined,
        required,
      };

      // Type-specific validation
      const validatedField = this.validateTypeSpecificConfig(baseConfig, field);
      validatedFields.push(validatedField);
    }

    return validatedFields;
  }

  private static validatePlaceholder(id: string, raw: unknown): string | undefined {
    if (typeof raw !== 'string') return undefined;
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    if (trimmed.length > 150) {
      throw new BadRequestException(`Field ${id} placeholder must be 150 characters or less`);
    }
    this.assertNoXss(trimmed, `Field ${id} placeholder`);
    return trimmed;
  }

  private static validateTypeSpecificConfig(
    base: { id: string; type: FieldType; label: string; description?: string; required: boolean },
    raw: Record<string, unknown>,
  ): CustomFieldConfig {
    const { id, type } = base;

    switch (type) {
      case 'SHORT_TEXT':
      case 'LONG_TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL': {
        const placeholder = this.validatePlaceholder(id, raw.placeholder);

        let minLength: number | undefined = undefined;
        let maxLength: number | undefined = undefined;

        if (raw.minLength !== undefined && raw.minLength !== null && raw.minLength !== '') {
          const num = Number(raw.minLength);
          if (!Number.isInteger(num) || num < 0 || num > FIELD_VALIDATION_LIMITS.MAX_MIN_LENGTH) {
            throw new BadRequestException(`Field ${id} minLength must be an integer between 0 and ${FIELD_VALIDATION_LIMITS.MAX_MIN_LENGTH}`);
          }
          minLength = num;
        }

        if (raw.maxLength !== undefined && raw.maxLength !== null && raw.maxLength !== '') {
          const num = Number(raw.maxLength);
          if (!Number.isInteger(num) || num < 0 || num > FIELD_VALIDATION_LIMITS.MAX_MAX_LENGTH) {
            throw new BadRequestException(`Field ${id} maxLength must be an integer between 0 and ${FIELD_VALIDATION_LIMITS.MAX_MAX_LENGTH}`);
          }
          maxLength = num;
        }

        if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) {
          throw new BadRequestException(`Field ${id} minLength cannot be greater than maxLength`);
        }

        return {
          ...base,
          type,
          placeholder: placeholder || undefined,
          minLength,
          maxLength,
        } as TextFieldConfig;
      }

      case 'SINGLE_SELECT':
      case 'MULTI_SELECT':
      case 'DROPDOWN': {
        const placeholder = type === 'DROPDOWN' ? this.validatePlaceholder(id, raw.placeholder) : undefined;

        if (!Array.isArray(raw.options)) {
          throw new BadRequestException(`Field ${id} options must be an array`);
        }
        if (raw.options.length === 0) {
          throw new BadRequestException(`Field ${id} must have at least 1 option`);
        }
        if (raw.options.length > 50) {
          throw new BadRequestException(`Field ${id} cannot have more than 50 options`);
        }

        const optionValues = new Set<string>();
        const optionLabels = new Set<string>();
        const validatedOptions: Array<{ label: string; value: string }> = [];

        for (let j = 0; j < raw.options.length; j++) {
          const opt = raw.options[j];
          if (!opt || typeof opt !== 'object' || Array.isArray(opt)) {
            throw new BadRequestException(`Field ${id} option ${j + 1} is invalid`);
          }
          const optLabel = typeof opt.label === 'string' ? opt.label.trim() : '';
          const optVal = typeof opt.value === 'string' ? opt.value.trim() : '';

          if (!optLabel) {
            throw new BadRequestException(`Field ${id} option ${j + 1} label is required`);
          }
          if (optLabel.length > 100) {
            throw new BadRequestException(`Field ${id} option ${j + 1} label must be 100 characters or less`);
          }
          this.assertNoXss(optLabel, `Field ${id} option ${j + 1} label`);

          if (!optVal) {
            throw new BadRequestException(`Field ${id} option ${j + 1} value is required`);
          }
          if (optVal.length > 100) {
            throw new BadRequestException(`Field ${id} option ${j + 1} value must be 100 characters or less`);
          }
          this.assertNoXss(optVal, `Field ${id} option ${j + 1} value`);

          const normalizedVal = optVal.toLowerCase();
          if (optionValues.has(normalizedVal)) {
            throw new BadRequestException(`Field ${id} option value "${optVal}" is duplicated`);
          }
          optionValues.add(normalizedVal);

          const normalizedLabel = optLabel.toLowerCase();
          if (optionLabels.has(normalizedLabel)) {
            throw new BadRequestException(`Field ${id} option label "${optLabel}" is duplicated`);
          }
          optionLabels.add(normalizedLabel);

          validatedOptions.push({ label: optLabel, value: optVal });
        }

        let minSelections: number | undefined = undefined;
        let maxSelections: number | undefined = undefined;

        if (type === 'MULTI_SELECT') {
          if (raw.minSelections !== undefined && raw.minSelections !== null && raw.minSelections !== '') {
            const num = Number(raw.minSelections);
            if (!Number.isInteger(num) || num < 0) {
              throw new BadRequestException(`Field ${id} minSelections must be a non-negative integer`);
            }
            if (num > validatedOptions.length) {
              throw new BadRequestException(`Field ${id} minSelections cannot exceed number of options (${validatedOptions.length})`);
            }
            minSelections = num;
          }

          if (raw.maxSelections !== undefined && raw.maxSelections !== null && raw.maxSelections !== '') {
            const num = Number(raw.maxSelections);
            if (!Number.isInteger(num) || num < 1) {
              throw new BadRequestException(`Field ${id} maxSelections must be at least 1`);
            }
            if (num > validatedOptions.length) {
              throw new BadRequestException(`Field ${id} maxSelections cannot exceed number of options (${validatedOptions.length})`);
            }
            maxSelections = num;
          }

          if (minSelections !== undefined && maxSelections !== undefined && minSelections > maxSelections) {
            throw new BadRequestException(`Field ${id} minSelections cannot be greater than maxSelections`);
          }
        }

        return {
          ...base,
          type,
          placeholder: placeholder || undefined,
          options: validatedOptions,
          ...(minSelections !== undefined ? { minSelections } : {}),
          ...(maxSelections !== undefined ? { maxSelections } : {}),
        } as ChoiceFieldConfig;
      }

      case 'NUMBER': {
        const placeholder = this.validatePlaceholder(id, raw.placeholder);

        let min: number | undefined = undefined;
        let max: number | undefined = undefined;
        let step: number | undefined = undefined;

        if (raw.min !== undefined && raw.min !== null && raw.min !== '') {
          const num = Number(raw.min);
          if (!Number.isFinite(num)) {
            throw new BadRequestException(`Field ${id} min must be a valid number`);
          }
          min = num;
        }

        if (raw.max !== undefined && raw.max !== null && raw.max !== '') {
          const num = Number(raw.max);
          if (!Number.isFinite(num)) {
            throw new BadRequestException(`Field ${id} max must be a valid number`);
          }
          max = num;
        }

        if (min !== undefined && max !== undefined && min > max) {
          throw new BadRequestException(`Field ${id} minimum cannot be greater than maximum`);
        }

        if (raw.step !== undefined && raw.step !== null && raw.step !== '') {
          const num = Number(raw.step);
          if (!Number.isFinite(num) || num <= 0) {
            throw new BadRequestException(`Field ${id} step must be a positive number`);
          }
          step = num;
        }

        return {
          ...base,
          type: 'NUMBER',
          placeholder: placeholder || undefined,
          min,
          max,
          step,
        } as NumberFieldConfig;
      }

      case 'RATING': {
        let minRating = 1;
        let maxRating = 5;

        if (raw.minRating !== undefined && raw.minRating !== null && raw.minRating !== '') {
          const num = Number(raw.minRating);
          if (!Number.isInteger(num) || num < 1 || num > 10) {
            throw new BadRequestException(`Field ${id} minRating must be an integer between 1 and 10`);
          }
          minRating = num;
        }

        if (raw.maxRating !== undefined && raw.maxRating !== null && raw.maxRating !== '') {
          const num = Number(raw.maxRating);
          if (!Number.isInteger(num) || num < 1 || num > 10) {
            throw new BadRequestException(`Field ${id} maxRating must be an integer between 1 and 10`);
          }
          maxRating = num;
        }

        if (minRating > maxRating) {
          throw new BadRequestException(`Field ${id} minRating cannot be greater than maxRating`);
        }

        return {
          ...base,
          type: 'RATING',
          minRating,
          maxRating,
        } as RatingFieldConfig;
      }

      case 'SCALE': {
        let min = 1;
        let max = 7;

        if (raw.min !== undefined && raw.min !== null && raw.min !== '') {
          const num = Number(raw.min);
          if (!Number.isInteger(num)) {
            throw new BadRequestException(`Field ${id} min must be an integer`);
          }
          min = num;
        }

        if (raw.max !== undefined && raw.max !== null && raw.max !== '') {
          const num = Number(raw.max);
          if (!Number.isInteger(num)) {
            throw new BadRequestException(`Field ${id} max must be an integer`);
          }
          max = num;
        }

        if (min >= max) {
          throw new BadRequestException(`Field ${id} min must be less than max`);
        }

        if (max - min > 20) {
          throw new BadRequestException(`Field ${id} scale range cannot exceed 20 points`);
        }

        const leftLabel = typeof raw.leftLabel === 'string' ? raw.leftLabel.trim() : undefined;
        if (leftLabel && leftLabel.length > 50) {
          throw new BadRequestException(`Field ${id} leftLabel must be 50 characters or less`);
        }
        if (leftLabel) {
          this.assertNoXss(leftLabel, `Field ${id} leftLabel`);
        }

        const rightLabel = typeof raw.rightLabel === 'string' ? raw.rightLabel.trim() : undefined;
        if (rightLabel && rightLabel.length > 50) {
          throw new BadRequestException(`Field ${id} rightLabel must be 50 characters or less`);
        }
        if (rightLabel) {
          this.assertNoXss(rightLabel, `Field ${id} rightLabel`);
        }

        return {
          ...base,
          type: 'SCALE',
          min,
          max,
          leftLabel: leftLabel || undefined,
          rightLabel: rightLabel || undefined,
        } as ScaleFieldConfig;
      }

      case 'DATE':
      case 'DATE_TIME': {
        const minDate = typeof raw.minDate === 'string' ? raw.minDate.trim() : undefined;
        const maxDate = typeof raw.maxDate === 'string' ? raw.maxDate.trim() : undefined;

        if (minDate) {
          const d = new Date(minDate);
          if (isNaN(d.getTime())) {
            throw new BadRequestException(`Field ${id} minDate is not a valid date string`);
          }
        }

        if (maxDate) {
          const d = new Date(maxDate);
          if (isNaN(d.getTime())) {
            throw new BadRequestException(`Field ${id} maxDate is not a valid date string`);
          }
        }

        if (minDate && maxDate && new Date(minDate).getTime() > new Date(maxDate).getTime()) {
          throw new BadRequestException(`Field ${id} minDate cannot be after maxDate`);
        }

        return {
          ...base,
          type,
          minDate: minDate || undefined,
          maxDate: maxDate || undefined,
        } as DateTimeFieldConfig;
      }

      case 'COUNTRY':
      case 'LANGUAGE': {
        const placeholder = this.validatePlaceholder(id, raw.placeholder);
        const optionMode = raw.optionMode === 'SELECTED' ? 'SELECTED' : 'ALL';
        const codeSet = type === 'COUNTRY' ? COUNTRY_CODE_SET : LANGUAGE_CODE_SET;
        const labelType = type === 'COUNTRY' ? 'country' : 'language';

        let selectedOptions: string[] | undefined = undefined;
        if (optionMode === 'SELECTED') {
          if (!Array.isArray(raw.selectedOptions) || raw.selectedOptions.length === 0) {
            throw new BadRequestException(`Field ${id} requires at least one selected ${labelType}`);
          }
          const seen = new Set<string>();
          for (const code of raw.selectedOptions) {
            if (typeof code !== 'string' || !codeSet.has(code.trim())) {
              throw new BadRequestException(`Field ${id}: "${code}" is not a valid ${labelType} code`);
            }
            if (seen.has(code.trim())) {
              throw new BadRequestException(`Field ${id}: duplicate ${labelType} code "${code}"`);
            }
            seen.add(code.trim());
          }
          selectedOptions = Array.from(seen);
        }

        const defaultValue = typeof raw.defaultValue === 'string' ? raw.defaultValue.trim() : undefined;
        if (defaultValue) {
          if (!codeSet.has(defaultValue)) {
            throw new BadRequestException(`Field ${id} default value "${defaultValue}" is not a valid ${labelType} code`);
          }
          if (optionMode === 'SELECTED' && selectedOptions && !selectedOptions.includes(defaultValue)) {
            throw new BadRequestException(`Field ${id} default value "${defaultValue}" must be in selected ${labelType} list`);
          }
        }

        return {
          ...base,
          type,
          placeholder: placeholder || undefined,
          optionMode,
          selectedOptions: selectedOptions || [],
          defaultValue: defaultValue || '',
        } as LocationFieldConfig;
      }

      case 'BOOLEAN':
      case 'CONSENT': {
        return {
          ...base,
          type,
        };
      }

      default:
        throw new BadRequestException(`Unknown field type: ${type}`);
    }
  }

  private static assertNoXss(value: string, label: string): void {
    if (/<\s*script|javascript:/i.test(value)) {
      throw new BadRequestException(`${label} contains unsupported content`);
    }
  }
}
