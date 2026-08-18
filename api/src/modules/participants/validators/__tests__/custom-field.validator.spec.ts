import { BadRequestException } from '@nestjs/common';
import { CustomFieldValidator } from '../custom-field.validator';
import type {
  CustomFieldConfig,
  TextFieldConfig,
  ChoiceFieldConfig,
  NumberFieldConfig,
  RatingFieldConfig,
  ScaleFieldConfig,
  DateTimeFieldConfig,
  ConsentFieldConfig,
  BooleanFieldConfig,
} from '../../../../common/types/custom-fields';

describe('CustomFieldValidator – All 17 Field Types', () => {
  describe('SHORT_TEXT and LONG_TEXT', () => {
    const shortTextField: TextFieldConfig = {
      id: 'f_name',
      type: 'SHORT_TEXT',
      label: 'Full Name',
      required: true,
      minLength: 2,
      maxLength: 20,
    };

    it('accepts valid string within length limits', () => {
      expect(() => CustomFieldValidator.validate(shortTextField, 'John Doe')).not.toThrow();
    });

    it('rejects text shorter than minLength', () => {
      expect(() => CustomFieldValidator.validate(shortTextField, 'J')).toThrow('must be at least 2 characters');
    });

    it('rejects text longer than maxLength', () => {
      expect(() => CustomFieldValidator.validate(shortTextField, 'A'.repeat(25))).toThrow('cannot exceed 20 characters');
    });

    it('rejects script tags in text value', () => {
      expect(() => CustomFieldValidator.validate(shortTextField, '<script>alert(1)</script>')).toThrow('unsupported content');
    });

    it('rejects non-string values', () => {
      expect(() => CustomFieldValidator.validate(shortTextField, 12345)).toThrow('must be text');
    });
  });

  describe('EMAIL', () => {
    const emailField: TextFieldConfig = {
      id: 'f_email',
      type: 'EMAIL',
      label: 'Alternate Email',
      required: true,
    };

    it('accepts valid email address', () => {
      expect(() => CustomFieldValidator.validate(emailField, 'user@example.com')).not.toThrow();
    });

    it('rejects malformed email addresses', () => {
      expect(() => CustomFieldValidator.validate(emailField, 'not-an-email')).toThrow('valid email address');
      expect(() => CustomFieldValidator.validate(emailField, 'user@')).toThrow('valid email address');
      expect(() => CustomFieldValidator.validate(emailField, '@example.com')).toThrow('valid email address');
    });
  });

  describe('PHONE', () => {
    const phoneField: TextFieldConfig = {
      id: 'f_phone',
      type: 'PHONE',
      label: 'Phone Number',
      required: true,
    };

    it('accepts valid phone numbers', () => {
      expect(() => CustomFieldValidator.validate(phoneField, '+1 234 567 8900')).not.toThrow();
      expect(() => CustomFieldValidator.validate(phoneField, '+251911223344')).not.toThrow();
      expect(() => CustomFieldValidator.validate(phoneField, '(555) 123-4567')).not.toThrow();
    });

    it('rejects malformed phone numbers', () => {
      expect(() => CustomFieldValidator.validate(phoneField, 'abc')).toThrow('valid phone number');
      expect(() => CustomFieldValidator.validate(phoneField, '123')).toThrow('valid phone number');
    });
  });

  describe('URL', () => {
    const urlField: TextFieldConfig = {
      id: 'f_url',
      type: 'URL',
      label: 'Website',
      required: true,
    };

    it('accepts valid http and https URLs', () => {
      expect(() => CustomFieldValidator.validate(urlField, 'https://example.com')).not.toThrow();
      expect(() => CustomFieldValidator.validate(urlField, 'http://localhost:3000')).not.toThrow();
    });

    it('rejects javascript: and dangerous schemes', () => {
      expect(() => CustomFieldValidator.validate(urlField, 'javascript:alert(1)')).toThrow('unsupported content');
      expect(() => CustomFieldValidator.validate(urlField, 'ftp://example.com')).toThrow('valid URL');
      expect(() => CustomFieldValidator.validate(urlField, 'not-a-url')).toThrow('valid URL');
    });
  });

  describe('SINGLE_SELECT and DROPDOWN', () => {
    const selectField: ChoiceFieldConfig = {
      id: 'f_role',
      type: 'SINGLE_SELECT',
      label: 'Role',
      required: true,
      options: [
        { label: 'Developer', value: 'DEV' },
        { label: 'Designer', value: 'DES' },
      ],
    };

    it('accepts an existing option value', () => {
      expect(() => CustomFieldValidator.validate(selectField, 'DEV')).not.toThrow();
      expect(() => CustomFieldValidator.validate(selectField, 'DES')).not.toThrow();
    });

    it('rejects an option value that is not configured', () => {
      expect(() => CustomFieldValidator.validate(selectField, 'MANAGER')).toThrow('Invalid option');
    });

    it('rejects non-string values', () => {
      expect(() => CustomFieldValidator.validate(selectField, 123)).toThrow('must be a string selection');
    });
  });

  describe('MULTI_SELECT', () => {
    const multiField: ChoiceFieldConfig = {
      id: 'f_skills',
      type: 'MULTI_SELECT',
      label: 'Skills',
      required: true,
      options: [
        { label: 'React', value: 'REACT' },
        { label: 'Node', value: 'NODE' },
        { label: 'Python', value: 'PYTHON' },
      ],
      minSelections: 1,
      maxSelections: 2,
    };

    it('accepts valid array of options within min/max bounds', () => {
      expect(() => CustomFieldValidator.validate(multiField, ['REACT'])).not.toThrow();
      expect(() => CustomFieldValidator.validate(multiField, ['REACT', 'NODE'])).not.toThrow();
    });

    it('rejects fewer selections than minSelections', () => {
      expect(() => CustomFieldValidator.validate(multiField, [])).toThrow('is required');
    });

    it('rejects more selections than maxSelections', () => {
      expect(() => CustomFieldValidator.validate(multiField, ['REACT', 'NODE', 'PYTHON'])).toThrow(
        'cannot exceed 2 selections',
      );
    });

    it('rejects duplicate selections in submitted array', () => {
      expect(() => CustomFieldValidator.validate(multiField, ['REACT', 'REACT'])).toThrow(
        'Duplicate option',
      );
    });

    it('rejects non-configured options in multi-select', () => {
      expect(() => CustomFieldValidator.validate(multiField, ['REACT', 'RUST'])).toThrow('Invalid option');
    });
  });

  describe('BOOLEAN', () => {
    const boolField: BooleanFieldConfig = {
      id: 'f_bool',
      type: 'BOOLEAN',
      label: 'Subscribe',
      required: true,
    };

    it('accepts true and false boolean values', () => {
      expect(() => CustomFieldValidator.validate(boolField, true)).not.toThrow();
      expect(() => CustomFieldValidator.validate(boolField, false)).not.toThrow();
    });

    it('rejects non-boolean values', () => {
      expect(() => CustomFieldValidator.validate(boolField, 'true')).toThrow('is required');
    });
  });

  describe('CONSENT', () => {
    const consentField: ConsentFieldConfig = {
      id: 'f_terms',
      type: 'CONSENT',
      label: 'Terms of Service',
      required: true,
    };

    it('accepts true when consent is required', () => {
      expect(() => CustomFieldValidator.validate(consentField, true)).not.toThrow();
    });

    it('rejects false when consent is required', () => {
      expect(() => CustomFieldValidator.validate(consentField, false)).toThrow('must be accepted');
    });

    it('rejects missing value when consent is required', () => {
      expect(() => CustomFieldValidator.validate(consentField, undefined)).toThrow('must be accepted');
    });
  });

  describe('NUMBER', () => {
    const numField: NumberFieldConfig = {
      id: 'f_age',
      type: 'NUMBER',
      label: 'Age',
      required: true,
      min: 18,
      max: 100,
    };

    it('accepts valid number within bounds', () => {
      expect(() => CustomFieldValidator.validate(numField, 25)).not.toThrow();
      expect(() => CustomFieldValidator.validate(numField, 18)).not.toThrow();
      expect(() => CustomFieldValidator.validate(numField, 100)).not.toThrow();
    });

    it('rejects numbers below min', () => {
      expect(() => CustomFieldValidator.validate(numField, 17)).toThrow('must be >= 18');
    });

    it('rejects numbers above max', () => {
      expect(() => CustomFieldValidator.validate(numField, 101)).toThrow('must be <= 100');
    });

    it('rejects NaN and Infinity', () => {
      expect(() => CustomFieldValidator.validate(numField, NaN)).toThrow('must be a valid number');
      expect(() => CustomFieldValidator.validate(numField, Infinity)).toThrow('must be a valid number');
    });
  });

  describe('RATING', () => {
    const ratingField: RatingFieldConfig = {
      id: 'f_rate',
      type: 'RATING',
      label: 'Rate us',
      required: true,
      minRating: 1,
      maxRating: 5,
    };

    it('accepts valid integer ratings', () => {
      expect(() => CustomFieldValidator.validate(ratingField, 1)).not.toThrow();
      expect(() => CustomFieldValidator.validate(ratingField, 5)).not.toThrow();
    });

    it('rejects out of range rating', () => {
      expect(() => CustomFieldValidator.validate(ratingField, 0)).toThrow('between 1 and 5');
      expect(() => CustomFieldValidator.validate(ratingField, 6)).toThrow('between 1 and 5');
    });

    it('rejects non-integer float rating', () => {
      expect(() => CustomFieldValidator.validate(ratingField, 3.5)).toThrow('must be an integer rating');
    });
  });

  describe('SCALE', () => {
    const scaleField: ScaleFieldConfig = {
      id: 'f_scale',
      type: 'SCALE',
      label: 'Satisfaction',
      required: true,
      min: 1,
      max: 7,
    };

    it('accepts valid integer scale value', () => {
      expect(() => CustomFieldValidator.validate(scaleField, 4)).not.toThrow();
    });

    it('rejects scale value outside range', () => {
      expect(() => CustomFieldValidator.validate(scaleField, 0)).toThrow('between 1 and 7');
      expect(() => CustomFieldValidator.validate(scaleField, 8)).toThrow('between 1 and 7');
    });
  });

  describe('DATE and DATE_TIME', () => {
    const dateField: DateTimeFieldConfig = {
      id: 'f_date',
      type: 'DATE',
      label: 'Birthday',
      required: true,
      minDate: '2000-01-01',
      maxDate: '2025-12-31',
    };

    it('accepts valid date within range', () => {
      expect(() => CustomFieldValidator.validate(dateField, '2010-05-15')).not.toThrow();
    });

    it('rejects date before minDate', () => {
      expect(() => CustomFieldValidator.validate(dateField, '1999-12-31')).toThrow('cannot be before 2000-01-01');
    });

    it('rejects date after maxDate', () => {
      expect(() => CustomFieldValidator.validate(dateField, '2026-01-01')).toThrow('cannot be after 2025-12-31');
    });

    it('rejects invalid date format', () => {
      expect(() => CustomFieldValidator.validate(dateField, 'invalid-date')).toThrow('must be a valid date');
    });
  });

  describe('validateAll and Unknown Fields', () => {
    const fields: CustomFieldConfig[] = [
      { id: 'f_name', type: 'SHORT_TEXT', label: 'Name', required: true },
      { id: 'f_role', type: 'SINGLE_SELECT', label: 'Role', required: false, options: [{ label: 'Dev', value: 'DEV' }] },
    ];

    it('accepts valid complete answers', () => {
      expect(() =>
        CustomFieldValidator.validateAll(fields, {
          f_name: 'Alice',
          f_role: 'DEV',
        }),
      ).not.toThrow();
    });

    it('rejects unknown/injected fields', () => {
      expect(() =>
        CustomFieldValidator.validateAll(fields, {
          f_name: 'Alice',
          adminPassword: 'secretPassword123',
        }),
      ).toThrow('Unknown field: adminPassword');
    });

    it('fails when required field is missing', () => {
      expect(() =>
        CustomFieldValidator.validateAll(fields, {
          f_role: 'DEV',
        }),
      ).toThrow('Field Name is required');
    });

    it('allows optional field to be omitted', () => {
      expect(() =>
        CustomFieldValidator.validateAll(fields, {
          f_name: 'Alice',
        }),
      ).not.toThrow();
    });
  });
});
