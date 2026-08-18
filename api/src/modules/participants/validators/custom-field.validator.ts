import { BadRequestException } from '@nestjs/common';
import type {
  CustomFieldConfig,
  LocationFieldConfig,
  ChoiceFieldConfig,
  TextFieldConfig,
  NumberFieldConfig,
  RatingFieldConfig,
  ScaleFieldConfig,
  DateTimeFieldConfig,
} from '../../../common/types/custom-fields';
import { COUNTRY_CODE_SET, LANGUAGE_CODE_SET } from '../../../common/locale-data';

export class CustomFieldValidator {
  /**
   * Validates a single custom field value against its definition.
   * Throws BadRequestException on failure.
   */
  static validate(field: CustomFieldConfig, value: any): void {
    const fieldLabel = field.label || field.id;

    // Required checks
    if (field.required) {
      if (field.type === 'CONSENT') {
        if (value !== true) {
          throw new BadRequestException(`Field ${fieldLabel} must be accepted`);
        }
        return;
      }

      if (field.type === 'BOOLEAN') {
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`Field ${fieldLabel} is required`);
        }
        return;
      }

      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0)
      ) {
        throw new BadRequestException(`Field ${fieldLabel} is required`);
      }
    }

    // Skip further validation if optional and empty
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      return;
    }

    switch (field.type) {
      case 'SHORT_TEXT':
      case 'LONG_TEXT':
        this.validateText(field, value, field.type === 'SHORT_TEXT' ? 500 : 5000);
        break;

      case 'EMAIL':
        this.validateText(field, value, 255);
        this.validateRegex(field, value.trim(), /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'valid email address');
        break;

      case 'PHONE':
        this.validateText(field, value, 50);
        this.validateRegex(field, value.trim(), /^\+?[0-9\s\-()]{7,25}$/, 'valid phone number');
        break;

      case 'URL':
        this.validateText(field, value, 2048);
        this.validateUrl(field, value.trim());
        break;

      case 'SINGLE_SELECT':
      case 'DROPDOWN': {
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field ${fieldLabel} must be a string selection`);
        }
        const choiceField = field as ChoiceFieldConfig;
        const validValues = (choiceField.options || []).map((o) => o.value);
        if (!validValues.includes(value)) {
          throw new BadRequestException(`Invalid option for field ${fieldLabel}`);
        }
        break;
      }

      case 'MULTI_SELECT': {
        if (!Array.isArray(value)) {
          throw new BadRequestException(`Field ${fieldLabel} must be a list of selections`);
        }
        const choiceField = field as ChoiceFieldConfig;
        const validValues = new Set((choiceField.options || []).map((o) => o.value));

        // Check for duplicates
        const seen = new Set<string>();
        for (const v of value) {
          if (typeof v !== 'string' || !validValues.has(v)) {
            throw new BadRequestException(`Invalid option '${v}' for field ${fieldLabel}`);
          }
          if (seen.has(v)) {
            throw new BadRequestException(`Duplicate option '${v}' selected for field ${fieldLabel}`);
          }
          seen.add(v);
        }

        const min = choiceField.minSelections || 0;
        const max = choiceField.maxSelections !== undefined ? choiceField.maxSelections : 50;

        if (value.length < min) {
          throw new BadRequestException(`Field ${fieldLabel} requires at least ${min} selections`);
        }
        if (value.length > max) {
          throw new BadRequestException(`Field ${fieldLabel} cannot exceed ${max} selections`);
        }
        break;
      }

      case 'BOOLEAN':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`Field ${fieldLabel} must be a boolean`);
        }
        break;

      case 'CONSENT':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`Field ${fieldLabel} must be a boolean (checked/unchecked)`);
        }
        if (field.required && value !== true) {
          throw new BadRequestException(`Field ${fieldLabel} must be accepted`);
        }
        break;

      case 'NUMBER': {
        if (typeof value !== 'number' || !Number.isFinite(value) || isNaN(value)) {
          throw new BadRequestException(`Field ${fieldLabel} must be a valid number`);
        }
        const numField = field as NumberFieldConfig;
        if (numField.min !== undefined && value < numField.min) {
          throw new BadRequestException(`Field ${fieldLabel} must be >= ${numField.min}`);
        }
        if (numField.max !== undefined && value > numField.max) {
          throw new BadRequestException(`Field ${fieldLabel} must be <= ${numField.max}`);
        }
        break;
      }

      case 'RATING': {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          throw new BadRequestException(`Field ${fieldLabel} must be an integer rating`);
        }
        const ratingField = field as RatingFieldConfig;
        const rMin = ratingField.minRating || 1;
        const rMax = ratingField.maxRating || 5;
        if (value < rMin || value > rMax) {
          throw new BadRequestException(`Field ${fieldLabel} must be between ${rMin} and ${rMax}`);
        }
        break;
      }

      case 'SCALE': {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          throw new BadRequestException(`Field ${fieldLabel} must be an integer scale value`);
        }
        const scaleField = field as ScaleFieldConfig;
        const sMin = scaleField.min || 1;
        const sMax = scaleField.max || 7;
        if (value < sMin || value > sMax) {
          throw new BadRequestException(`Field ${fieldLabel} must be between ${sMin} and ${sMax}`);
        }
        break;
      }

      case 'DATE':
      case 'DATE_TIME': {
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field ${fieldLabel} must be a date string`);
        }
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          throw new BadRequestException(`Field ${fieldLabel} must be a valid date`);
        }
        const dtField = field as DateTimeFieldConfig;
        if (dtField.minDate) {
          const minD = new Date(dtField.minDate);
          if (!isNaN(minD.getTime()) && d.getTime() < minD.getTime()) {
            throw new BadRequestException(`Field ${fieldLabel} cannot be before ${dtField.minDate}`);
          }
        }
        if (dtField.maxDate) {
          const maxD = new Date(dtField.maxDate);
          if (!isNaN(maxD.getTime()) && d.getTime() > maxD.getTime()) {
            throw new BadRequestException(`Field ${fieldLabel} cannot be after ${dtField.maxDate}`);
          }
        }
        break;
      }

      case 'COUNTRY': {
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field ${fieldLabel} must be a country code string`);
        }
        const trimmedVal = value.trim();
        if (!COUNTRY_CODE_SET.has(trimmedVal)) {
          throw new BadRequestException(`Field ${fieldLabel}: "${value}" is not a valid ISO country code`);
        }
        const countryField = field as LocationFieldConfig;
        if (
          countryField.optionMode === 'SELECTED' &&
          Array.isArray(countryField.selectedOptions) &&
          countryField.selectedOptions.length > 0 &&
          !countryField.selectedOptions.includes(trimmedVal)
        ) {
          throw new BadRequestException(`Field ${fieldLabel}: "${value}" is not an allowed country`);
        }
        break;
      }

      case 'LANGUAGE': {
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field ${fieldLabel} must be a language code string`);
        }
        const trimmedVal = value.trim();
        if (!LANGUAGE_CODE_SET.has(trimmedVal)) {
          throw new BadRequestException(`Field ${fieldLabel}: "${value}" is not a valid language code`);
        }
        const languageField = field as LocationFieldConfig;
        if (
          languageField.optionMode === 'SELECTED' &&
          Array.isArray(languageField.selectedOptions) &&
          languageField.selectedOptions.length > 0 &&
          !languageField.selectedOptions.includes(trimmedVal)
        ) {
          throw new BadRequestException(`Field ${fieldLabel}: "${value}" is not an allowed language`);
        }
        break;
      }

      default:
        throw new BadRequestException(`Unknown field type for ${fieldLabel}`);
    }
  }

  private static validateText(field: CustomFieldConfig, value: any, absoluteMax: number) {
    const fieldLabel = field.label || field.id;
    if (typeof value !== 'string') {
      throw new BadRequestException(`Field ${fieldLabel} must be text`);
    }

    if (/<\s*script|javascript:/i.test(value)) {
      throw new BadRequestException(`Field ${fieldLabel} contains unsupported content`);
    }

    const txtField = field as TextFieldConfig;
    const trimmed = value.trim();

    if (txtField.minLength !== undefined && trimmed.length < txtField.minLength) {
      throw new BadRequestException(`Field ${fieldLabel} must be at least ${txtField.minLength} characters`);
    }

    const max = Math.min(txtField.maxLength || absoluteMax, absoluteMax);
    if (value.length > max) {
      throw new BadRequestException(`Field ${fieldLabel} cannot exceed ${max} characters`);
    }
  }

  private static validateRegex(field: CustomFieldConfig, value: string, regex: RegExp, description: string) {
    const fieldLabel = field.label || field.id;
    if (!regex.test(value)) {
      throw new BadRequestException(`Field ${fieldLabel} must be a ${description}`);
    }
  }

  private static validateUrl(field: CustomFieldConfig, value: string) {
    const fieldLabel = field.label || field.id;
    if (/<\s*script|javascript:/i.test(value)) {
      throw new BadRequestException(`Field ${fieldLabel} contains unsupported content`);
    }
    if (!/^https?:\/\/.+/i.test(value)) {
      throw new BadRequestException(`Field ${fieldLabel} must be a valid URL starting with http:// or https://`);
    }
  }

  /**
   * Validates multiple answers against a list of fields and rejects unknown field keys.
   */
  static validateAll(fields: CustomFieldConfig[], answers: Record<string, any>): void {
    if (!fields) return;
    const validFieldIds = new Set(fields.map((f) => f.id));

    // Reject unknown / unexpected fields
    if (answers && typeof answers === 'object') {
      for (const key of Object.keys(answers)) {
        if (!validFieldIds.has(key)) {
          throw new BadRequestException(`Unknown field: ${key}`);
        }
      }
    }

    for (const field of fields) {
      const val = answers ? answers[field.id] : undefined;
      this.validate(field, val);
    }
  }
}
