import { BadRequestException } from '@nestjs/common';
import type { CustomFieldConfig, LocationFieldConfig } from '../../../common/types/custom-fields';
import { COUNTRY_CODE_SET, LANGUAGE_CODE_SET } from '../../../common/locale-data';

export class CustomFieldValidator {
  /**
   * Validates a single custom field value against its definition.
   * Throws BadRequestException on failure.
   */
  static validate(field: CustomFieldConfig, value: any): void {
    if (field.required && (value === undefined || value === null || value === '')) {
      throw new BadRequestException(`Field ${field.label || field.id} is required`);
    }

    // Skip further validation if optional and empty
    if (value === undefined || value === null || value === '') return;

    switch (field.type) {
      case 'SHORT_TEXT':
      case 'LONG_TEXT':
        this.validateText(field, value, field.type === 'SHORT_TEXT' ? 500 : 5000);
        break;
      case 'EMAIL':
        this.validateText(field, value, 255);
        this.validateRegex(field, value, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'valid email address');
        break;
      case 'PHONE':
        this.validateText(field, value, 50);
        // Simple E.164-like phone validation
        this.validateRegex(field, value, /^\+?[1-9]\d{1,14}$/, 'valid phone number');
        break;
      case 'URL':
        this.validateText(field, value, 2048);
        this.validateRegex(field, value, /^https?:\/\/.+/, 'valid URL');
        break;
      case 'SINGLE_SELECT':
      case 'DROPDOWN':
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field ${field.label} must be a string selection`);
        }
        if (!field.options?.some((o) => o.value === value)) {
          throw new BadRequestException(`Invalid option for field ${field.label}`);
        }
        break;
      case 'MULTI_SELECT':
        if (!Array.isArray(value)) {
          throw new BadRequestException(`Field ${field.label} must be a list of selections`);
        }
        const min = field.minSelections || 0;
        const max = field.maxSelections || 20; // Hard limit 20
        if (value.length < min) throw new BadRequestException(`Field ${field.label} requires at least ${min} selections`);
        if (value.length > max) throw new BadRequestException(`Field ${field.label} cannot exceed ${max} selections`);
        
        for (const v of value) {
          if (!field.options?.some((o) => o.value === v)) {
            throw new BadRequestException(`Invalid option '${v}' for field ${field.label}`);
          }
        }
        break;
      case 'BOOLEAN':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`Field ${field.label} must be a boolean`);
        }
        break;
      case 'NUMBER':
        if (typeof value !== 'number' || isNaN(value)) {
          throw new BadRequestException(`Field ${field.label} must be a number`);
        }
        if (field.min !== undefined && value < field.min) throw new BadRequestException(`Field ${field.label} must be >= ${field.min}`);
        if (field.max !== undefined && value > field.max) throw new BadRequestException(`Field ${field.label} must be <= ${field.max}`);
        break;
      case 'RATING':
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          throw new BadRequestException(`Field ${field.label} must be an integer rating`);
        }
        const rMin = field.minRating || 1;
        const rMax = field.maxRating || 5;
        if (value < rMin || value > rMax) throw new BadRequestException(`Field ${field.label} must be between ${rMin} and ${rMax}`);
        break;
      case 'SCALE':
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          throw new BadRequestException(`Field ${field.label} must be an integer scale value`);
        }
        const sMin = field.min || 1;
        const sMax = field.max || 7;
        if (value < sMin || value > sMax) throw new BadRequestException(`Field ${field.label} must be between ${sMin} and ${sMax}`);
        break;
      case 'DATE':
      case 'DATE_TIME':
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field ${field.label} must be a date string`);
        }
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          throw new BadRequestException(`Field ${field.label} must be a valid date`);
        }
        break;
      case 'COUNTRY': {
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field ${field.label} must be a country code string`);
        }
        // Validate against the full known country set
        if (!COUNTRY_CODE_SET.has(value)) {
          throw new BadRequestException(`Field ${field.label}: "${value}" is not a valid ISO country code`);
        }
        // If the founder restricted to selected options, ensure the submitted code is allowed
        const countryField = field as LocationFieldConfig;
        if (
          countryField.optionMode === 'SELECTED' &&
          Array.isArray(countryField.selectedOptions) &&
          countryField.selectedOptions.length > 0 &&
          !countryField.selectedOptions.includes(value)
        ) {
          throw new BadRequestException(`Field ${field.label}: "${value}" is not an allowed country`);
        }
        break;
      }
      case 'LANGUAGE': {
        if (typeof value !== 'string') {
          throw new BadRequestException(`Field ${field.label} must be a language code string`);
        }
        // Validate against the full known language set
        if (!LANGUAGE_CODE_SET.has(value)) {
          throw new BadRequestException(`Field ${field.label}: "${value}" is not a valid language code`);
        }
        // If the founder restricted to selected options, ensure the submitted code is allowed
        const languageField = field as LocationFieldConfig;
        if (
          languageField.optionMode === 'SELECTED' &&
          Array.isArray(languageField.selectedOptions) &&
          languageField.selectedOptions.length > 0 &&
          !languageField.selectedOptions.includes(value)
        ) {
          throw new BadRequestException(`Field ${field.label}: "${value}" is not an allowed language`);
        }
        break;
      }
      case 'CONSENT':
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`Field ${field.label} must be a boolean (checked/unchecked)`);
        }
        if (field.required && value !== true) {
          throw new BadRequestException(`Field ${field.label} must be accepted`);
        }
        break;
      default:
        throw new BadRequestException(`Unknown field type for ${(field as any).label || 'unknown'}`);
    }
  }

  private static validateText(field: CustomFieldConfig, value: any, absoluteMax: number) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`Field ${field.label} must be text`);
    }
    const txtField = field as any; // Cast to access length constraints
    if (txtField.minLength !== undefined && value.length < txtField.minLength) {
      throw new BadRequestException(`Field ${field.label} must be at least ${txtField.minLength} characters`);
    }
    const max = Math.min(txtField.maxLength || absoluteMax, absoluteMax);
    if (value.length > max) {
      throw new BadRequestException(`Field ${field.label} cannot exceed ${max} characters`);
    }
  }

  private static validateRegex(field: CustomFieldConfig, value: string, regex: RegExp, description: string) {
    if (!regex.test(value)) {
      throw new BadRequestException(`Field ${field.label} must be a ${description}`);
    }
  }

  /**
   * Validates multiple answers against a list of fields.
   */
  static validateAll(fields: CustomFieldConfig[], answers: Record<string, any>): void {
    if (!fields || !answers) return;
    for (const field of fields) {
      this.validate(field, answers[field.id]);
    }
  }
}
