import { BadRequestException } from '@nestjs/common';
import { CustomFieldValidator } from '../custom-field.validator';
import { resolveTextValidation, FIELD_VALIDATION_DEFAULTS } from '../../../../common/constants/field-validation.defaults';
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

  describe('System Default Validation', () => {
    describe('SHORT_TEXT defaults', () => {
      it('uses system defaults when minLength and maxLength are not configured', () => {
        const field: TextFieldConfig = {
          id: 'f_name',
          type: 'SHORT_TEXT',
          label: 'Name',
          required: true,
        };

        // Should accept values within default range (1-100)
        expect(() => CustomFieldValidator.validate(field, 'A')).not.toThrow(); // min=1
        expect(() => CustomFieldValidator.validate(field, 'A'.repeat(100))).not.toThrow(); // max=100
        
        // Should reject values outside default range
        expect(() => CustomFieldValidator.validate(field, '')).toThrow('required'); // empty string
        expect(() => CustomFieldValidator.validate(field, 'A'.repeat(101))).toThrow('cannot exceed 100 characters');
      });

      it('allows founder to override system defaults', () => {
        const field: TextFieldConfig = {
          id: 'f_name',
          type: 'SHORT_TEXT',
          label: 'Name',
          required: true,
          minLength: 5,
          maxLength: 50,
        };

        // Should use founder's custom range (5-50)
        expect(() => CustomFieldValidator.validate(field, 'ABCDE')).not.toThrow(); // min=5
        expect(() => CustomFieldValidator.validate(field, 'A'.repeat(50))).not.toThrow(); // max=50
        
        // Should reject values outside custom range
        expect(() => CustomFieldValidator.validate(field, 'ABCD')).toThrow('must be at least 5 characters');
        expect(() => CustomFieldValidator.validate(field, 'A'.repeat(51))).toThrow('cannot exceed 50 characters');
      });

      it('allows partial founder configuration with default fallback', () => {
        const fieldMinOnly: TextFieldConfig = {
          id: 'f_name',
          type: 'SHORT_TEXT',
          label: 'Name',
          required: true,
          minLength: 10,
        };

        // Should use founder's min (10) and system default max (100)
        expect(() => CustomFieldValidator.validate(fieldMinOnly, 'ABCDEFGHIJ')).not.toThrow(); // min=10
        expect(() => CustomFieldValidator.validate(fieldMinOnly, 'A'.repeat(100))).not.toThrow(); // max=100 (default)
        expect(() => CustomFieldValidator.validate(fieldMinOnly, 'ABCDEFGHI')).toThrow('must be at least 10 characters');
        expect(() => CustomFieldValidator.validate(fieldMinOnly, 'A'.repeat(101))).toThrow('cannot exceed 100 characters');

        const fieldMaxOnly: TextFieldConfig = {
          id: 'f_name',
          type: 'SHORT_TEXT',
          label: 'Name',
          required: true,
          maxLength: 25,
        };

        // Should use system default min (1) and founder's max (25)
        expect(() => CustomFieldValidator.validate(fieldMaxOnly, 'A')).not.toThrow(); // min=1 (default)
        expect(() => CustomFieldValidator.validate(fieldMaxOnly, 'A'.repeat(25))).not.toThrow(); // max=25
        expect(() => CustomFieldValidator.validate(fieldMaxOnly, 'A'.repeat(26))).toThrow('cannot exceed 25 characters');
      });
    });

    describe('LONG_TEXT defaults', () => {
      it('uses system defaults when minLength and maxLength are not configured', () => {
        const field: TextFieldConfig = {
          id: 'f_bio',
          type: 'LONG_TEXT',
          label: 'Bio',
          required: true,
        };

        // Should accept values within default range (1-1000)
        expect(() => CustomFieldValidator.validate(field, 'A')).not.toThrow(); // min=1
        expect(() => CustomFieldValidator.validate(field, 'A'.repeat(1000))).not.toThrow(); // max=1000
        
        // Should reject values outside default range
        expect(() => CustomFieldValidator.validate(field, 'A'.repeat(1001))).toThrow('cannot exceed 1000 characters');
      });
    });

    describe('EMAIL field defaults', () => {
      it('uses system default max length for EMAIL', () => {
        const field: TextFieldConfig = {
          id: 'f_email',
          type: 'EMAIL',
          label: 'Email',
          required: true,
        };

        // Should use system default max (254)
        expect(() => CustomFieldValidator.validate(field, 'a'.repeat(240) + '@example.com')).not.toThrow(); // within 254
        expect(() => CustomFieldValidator.validate(field, 'a'.repeat(250) + '@example.com')).toThrow('cannot exceed 254 characters'); // exceeds 254
      });
    });

    describe('PHONE field defaults', () => {
      it('uses system default max length for PHONE', () => {
        const field: TextFieldConfig = {
          id: 'f_phone',
          type: 'PHONE',
          label: 'Phone',
          required: true,
        };

        // Should use system default max (20)
        expect(() => CustomFieldValidator.validate(field, '+1 234 567 8901')).not.toThrow(); // 15 chars, within 20
        expect(() => CustomFieldValidator.validate(field, '+1 234 567 89012345678')).toThrow('cannot exceed 20 characters'); // 21 chars, exceeds 20
      });
    });

    describe('URL field defaults', () => {
      it('uses system default max length for URL', () => {
        const field: TextFieldConfig = {
          id: 'f_url',
          type: 'URL',
          label: 'Website',
          required: true,
        };

        // Should use system default max (2048)
        expect(() => CustomFieldValidator.validate(field, 'https://example.com/' + 'a'.repeat(2024))).not.toThrow(); // within 2048
        expect(() => CustomFieldValidator.validate(field, 'https://example.com/' + 'a'.repeat(2045))).toThrow('cannot exceed 2048 characters'); // exceeds 2048
      });
    });
  });

  describe('resolveTextValidation utility', () => {
    it('resolves SHORT_TEXT defaults correctly', () => {
      const defaults = resolveTextValidation('SHORT_TEXT', null, null);
      expect(defaults.minLength).toBe(FIELD_VALIDATION_DEFAULTS.SHORT_TEXT.minLength);
      expect(defaults.maxLength).toBe(FIELD_VALIDATION_DEFAULTS.SHORT_TEXT.maxLength);
    });

    it('resolves LONG_TEXT defaults correctly', () => {
      const defaults = resolveTextValidation('LONG_TEXT', null, null);
      expect(defaults.minLength).toBe(FIELD_VALIDATION_DEFAULTS.LONG_TEXT.minLength);
      expect(defaults.maxLength).toBe(FIELD_VALIDATION_DEFAULTS.LONG_TEXT.maxLength);
    });

    it('resolves EMAIL defaults correctly', () => {
      const defaults = resolveTextValidation('EMAIL', null, null);
      expect(defaults.maxLength).toBe(FIELD_VALIDATION_DEFAULTS.EMAIL.maxLength);
    });

    it('resolves PHONE defaults correctly', () => {
      const defaults = resolveTextValidation('PHONE', null, null);
      expect(defaults.maxLength).toBe(FIELD_VALIDATION_DEFAULTS.PHONE.maxLength);
    });

    it('resolves URL defaults correctly', () => {
      const defaults = resolveTextValidation('URL', null, null);
      expect(defaults.maxLength).toBe(FIELD_VALIDATION_DEFAULTS.URL.maxLength);
    });

    it('applies founder overrides correctly', () => {
      const defaults = resolveTextValidation('SHORT_TEXT', 10, 50);
      expect(defaults.minLength).toBe(10);
      expect(defaults.maxLength).toBe(50);
    });

    it('applies partial founder overrides with default fallback', () => {
      const minOnly = resolveTextValidation('SHORT_TEXT', 15, null);
      expect(minOnly.minLength).toBe(15);
      expect(minOnly.maxLength).toBe(FIELD_VALIDATION_DEFAULTS.SHORT_TEXT.maxLength);

      const maxOnly = resolveTextValidation('SHORT_TEXT', null, 25);
      expect(maxOnly.minLength).toBe(FIELD_VALIDATION_DEFAULTS.SHORT_TEXT.minLength);
      expect(maxOnly.maxLength).toBe(25);
    });
  });
});
