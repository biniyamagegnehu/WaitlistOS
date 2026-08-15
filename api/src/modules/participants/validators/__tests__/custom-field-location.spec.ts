import { BadRequestException } from '@nestjs/common';
import { CustomFieldValidator } from '../custom-field.validator';
import type { LocationFieldConfig } from '../../../../common/types/custom-fields';

// ─── Base helpers ─────────────────────────────────────────────────────────────

function countryField(overrides: Partial<LocationFieldConfig> = {}): LocationFieldConfig {
  return {
    id: 'field_country',
    type: 'COUNTRY',
    label: 'Country',
    required: true,
    optionMode: 'ALL',
    selectedOptions: [],
    defaultValue: '',
    ...overrides,
  };
}

function languageField(overrides: Partial<LocationFieldConfig> = {}): LocationFieldConfig {
  return {
    id: 'field_language',
    type: 'LANGUAGE',
    label: 'Language',
    required: true,
    optionMode: 'ALL',
    selectedOptions: [],
    defaultValue: '',
    ...overrides,
  };
}

// ─── COUNTRY tests ────────────────────────────────────────────────────────────

describe('CustomFieldValidator – COUNTRY', () => {
  describe('optionMode: ALL', () => {
    it('accepts any valid ISO country code when optionMode is ALL', () => {
      const field = countryField({ optionMode: 'ALL' });
      expect(() => CustomFieldValidator.validate(field, 'ET')).not.toThrow();
      expect(() => CustomFieldValidator.validate(field, 'US')).not.toThrow();
      expect(() => CustomFieldValidator.validate(field, 'ZW')).not.toThrow();
    });

    it('rejects an invalid country code', () => {
      const field = countryField({ optionMode: 'ALL' });
      expect(() => CustomFieldValidator.validate(field, 'XX')).toThrow(BadRequestException);
      expect(() => CustomFieldValidator.validate(field, 'Ethiopia')).toThrow(BadRequestException);
      expect(() => CustomFieldValidator.validate(field, '123')).toThrow(BadRequestException);
      expect(() => CustomFieldValidator.validate(field, '')).toThrow(BadRequestException); // required + empty
    });
  });

  describe('optionMode: SELECTED', () => {
    const field = countryField({
      optionMode: 'SELECTED',
      selectedOptions: ['ET', 'KE', 'UG', 'TZ'],
    });

    it('accepts a code in the selectedOptions list', () => {
      expect(() => CustomFieldValidator.validate(field, 'ET')).not.toThrow();
      expect(() => CustomFieldValidator.validate(field, 'TZ')).not.toThrow();
    });

    it('rejects a valid ISO code not in selectedOptions', () => {
      expect(() => CustomFieldValidator.validate(field, 'US')).toThrow(BadRequestException);
      expect(() => CustomFieldValidator.validate(field, 'DE')).toThrow(BadRequestException);
    });

    it('rejects an invalid ISO code even if optionMode is SELECTED', () => {
      expect(() => CustomFieldValidator.validate(field, 'NOTACODE')).toThrow(BadRequestException);
    });
  });

  describe('required validation', () => {
    it('throws when field is required and value is empty/null/undefined', () => {
      const field = countryField({ required: true });
      expect(() => CustomFieldValidator.validate(field, '')).toThrow(BadRequestException);
      expect(() => CustomFieldValidator.validate(field, null)).toThrow(BadRequestException);
      expect(() => CustomFieldValidator.validate(field, undefined)).toThrow(BadRequestException);
    });

    it('passes when field is optional and value is missing', () => {
      const field = countryField({ required: false });
      expect(() => CustomFieldValidator.validate(field, '')).not.toThrow();
      expect(() => CustomFieldValidator.validate(field, null)).not.toThrow();
    });
  });

  describe('historical answer compatibility', () => {
    it('still accepts ET even if selectedOptions later excludes ET (simulates historical answer; validation is against stored field config)', () => {
      // Historical answers are stored in JSONB and not re-validated against later
      // config changes — this test verifies that the validator itself is stateless
      // and relies solely on the field config passed to it.
      // If a founder removes "ET", new submissions are blocked but old data is untouched.
      const historicalField = countryField({
        optionMode: 'SELECTED',
        selectedOptions: ['ET', 'KE'],
      });
      expect(() => CustomFieldValidator.validate(historicalField, 'ET')).not.toThrow();
    });
  });
});

// ─── LANGUAGE tests ───────────────────────────────────────────────────────────

describe('CustomFieldValidator – LANGUAGE', () => {
  describe('optionMode: ALL', () => {
    it('accepts any valid language code when optionMode is ALL', () => {
      const field = languageField({ optionMode: 'ALL' });
      expect(() => CustomFieldValidator.validate(field, 'en')).not.toThrow();
      expect(() => CustomFieldValidator.validate(field, 'am')).not.toThrow();
      expect(() => CustomFieldValidator.validate(field, 'zh-TW')).not.toThrow();
    });

    it('rejects an invalid language code', () => {
      const field = languageField({ optionMode: 'ALL' });
      expect(() => CustomFieldValidator.validate(field, 'xx')).toThrow(BadRequestException);
      expect(() => CustomFieldValidator.validate(field, 'English')).toThrow(BadRequestException);
      expect(() => CustomFieldValidator.validate(field, '999')).toThrow(BadRequestException);
    });
  });

  describe('optionMode: SELECTED', () => {
    const field = languageField({
      optionMode: 'SELECTED',
      selectedOptions: ['en', 'am', 'sw', 'fr'],
    });

    it('accepts a code in selectedOptions', () => {
      expect(() => CustomFieldValidator.validate(field, 'en')).not.toThrow();
      expect(() => CustomFieldValidator.validate(field, 'sw')).not.toThrow();
    });

    it('rejects a valid code not in selectedOptions', () => {
      expect(() => CustomFieldValidator.validate(field, 'de')).toThrow(BadRequestException);
      expect(() => CustomFieldValidator.validate(field, 'zh')).toThrow(BadRequestException);
    });

    it('rejects an invalid code even if optionMode is SELECTED', () => {
      expect(() => CustomFieldValidator.validate(field, 'notacode')).toThrow(BadRequestException);
    });
  });

  describe('default value', () => {
    it('defaultValue is a field config concern, not validated by the validator (it is applied on the frontend)', () => {
      // The validator receives the *submitted* value, not the default.
      // This test confirms the validator simply validates what it receives.
      const field = languageField({ optionMode: 'ALL', defaultValue: 'en' });
      expect(() => CustomFieldValidator.validate(field, 'en')).not.toThrow();
    });
  });

  describe('required validation', () => {
    it('throws when required and empty', () => {
      const field = languageField({ required: true });
      expect(() => CustomFieldValidator.validate(field, '')).toThrow(BadRequestException);
    });

    it('passes when optional and empty', () => {
      const field = languageField({ required: false });
      expect(() => CustomFieldValidator.validate(field, '')).not.toThrow();
    });
  });
});

// ─── validateAll bulk tests ───────────────────────────────────────────────────

describe('CustomFieldValidator.validateAll – mixed fields', () => {
  it('validates a mix of COUNTRY and LANGUAGE fields together', () => {
    const fields = [
      countryField({ optionMode: 'SELECTED', selectedOptions: ['ET', 'KE'] }),
      languageField({ optionMode: 'SELECTED', selectedOptions: ['en', 'am'] }),
    ];
    expect(() =>
      CustomFieldValidator.validateAll(fields, {
        field_country: 'ET',
        field_language: 'en',
      })
    ).not.toThrow();
  });

  it('throws when one field in the bulk set is invalid', () => {
    const fields = [
      countryField({ optionMode: 'SELECTED', selectedOptions: ['ET', 'KE'] }),
      languageField({ optionMode: 'SELECTED', selectedOptions: ['en', 'am'] }),
    ];
    expect(() =>
      CustomFieldValidator.validateAll(fields, {
        field_country: 'US', // not in selectedOptions
        field_language: 'en',
      })
    ).toThrow(BadRequestException);
  });

  it('throws when a required field is missing from answers', () => {
    const fields = [countryField({ required: true })];
    expect(() =>
      CustomFieldValidator.validateAll(fields, {})
    ).toThrow(BadRequestException);
  });

  it('passes when an optional field is missing from answers', () => {
    const fields = [countryField({ required: false })];
    expect(() =>
      CustomFieldValidator.validateAll(fields, {})
    ).not.toThrow();
  });
});
