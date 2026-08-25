import { BadRequestException } from '@nestjs/common';
import { SignupConfigValidator } from '../signup-config.validator';
import { FIELD_VALIDATION_LIMITS } from '../../../common/constants/field-validation.defaults';

describe('SignupConfigValidator', () => {
  const validQuestionsStep = {
    id: 'step_questions_1',
    type: 'QUESTIONS',
    enabled: true,
    fields: [
      {
        id: 'field_name',
        type: 'SHORT_TEXT',
        label: 'Full Name',
        description: 'Your legal name',
        required: true,
        placeholder: 'Jane Doe',
        minLength: 2,
        maxLength: 50,
      },
      {
        id: 'field_role',
        type: 'SINGLE_SELECT',
        label: 'Role',
        required: true,
        options: [
          { label: 'Developer', value: 'DEV' },
          { label: 'Designer', value: 'DESIGNER' },
        ],
      },
      {
        id: 'field_skills',
        type: 'MULTI_SELECT',
        label: 'Skills',
        required: false,
        options: [
          { label: 'React', value: 'REACT' },
          { label: 'Node', value: 'NODE' },
          { label: 'Python', value: 'PYTHON' },
        ],
        minSelections: 1,
        maxSelections: 2,
      },
      {
        id: 'field_experience',
        type: 'NUMBER',
        label: 'Years of Experience',
        required: false,
        min: 0,
        max: 50,
      },
      {
        id: 'field_rating',
        type: 'RATING',
        label: 'Interest Level',
        required: false,
        minRating: 1,
        maxRating: 5,
      },
      {
        id: 'field_scale',
        type: 'SCALE',
        label: 'Satisfaction',
        required: false,
        min: 1,
        max: 7,
        leftLabel: 'Low',
        rightLabel: 'High',
      },
      {
        id: 'field_country',
        type: 'COUNTRY',
        label: 'Country',
        required: true,
        optionMode: 'SELECTED',
        selectedOptions: ['US', 'CA', 'ET'],
        defaultValue: 'US',
      },
      {
        id: 'field_terms',
        type: 'CONSENT',
        label: 'I accept terms',
        required: true,
      },
    ],
  };

  const validReferralStep = {
    id: 'step_referral_1',
    type: 'REFERRAL',
    enabled: true,
  };

  it('accepts valid steps configuration', () => {
    const result = SignupConfigValidator.validateSteps([validQuestionsStep, validReferralStep]);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('QUESTIONS');
    expect(result[1].type).toBe('REFERRAL');
  });

  describe('Step-level validation', () => {
    it('rejects non-array steps', () => {
      expect(() => SignupConfigValidator.validateSteps(null)).toThrow(BadRequestException);
      expect(() => SignupConfigValidator.validateSteps({})).toThrow(BadRequestException);
      expect(() => SignupConfigValidator.validateSteps('string')).toThrow(BadRequestException);
    });

    it('rejects step without id', () => {
      expect(() =>
        SignupConfigValidator.validateSteps([{ type: 'REFERRAL', enabled: true }]),
      ).toThrow('invalid or missing id');
    });

    it('rejects duplicate step ids', () => {
      expect(() =>
        SignupConfigValidator.validateSteps([
          { id: 'dup_step', type: 'QUESTIONS', enabled: true, fields: [] },
          { id: 'dup_step', type: 'REFERRAL', enabled: true },
        ]),
      ).toThrow('Duplicate step id');
    });

    it('rejects duplicate step types', () => {
      expect(() =>
        SignupConfigValidator.validateSteps([
          { id: 'q1', type: 'QUESTIONS', enabled: true, fields: [] },
          { id: 'q2', type: 'QUESTIONS', enabled: true, fields: [] },
        ]),
      ).toThrow('Only one QUESTIONS step is allowed');
    });

    it('rejects unsupported step type', () => {
      expect(() =>
        SignupConfigValidator.validateSteps([{ id: 's1', type: 'UNKNOWN', enabled: true }]),
      ).toThrow('unsupported type');
    });
  });

  describe('Field-level validation', () => {
    it('rejects missing field id', () => {
      expect(() =>
        SignupConfigValidator.validateFields([
          { type: 'SHORT_TEXT', label: 'Name', required: true },
        ]),
      ).toThrow('valid identifier id');
    });

    it('rejects duplicate field ids', () => {
      expect(() =>
        SignupConfigValidator.validateFields([
          { id: 'dup_field', type: 'SHORT_TEXT', label: 'Name', required: true },
          { id: 'dup_field', type: 'SHORT_TEXT', label: 'Name 2', required: true },
        ]),
      ).toThrow('Duplicate field id');
    });

    it('rejects unsupported field type', () => {
      expect(() =>
        SignupConfigValidator.validateFields([
          { id: 'f1', type: 'INVALID_TYPE', label: 'Label', required: true },
        ]),
      ).toThrow('unsupported field type');
    });

    it('rejects empty or missing field label', () => {
      expect(() =>
        SignupConfigValidator.validateFields([
          { id: 'f1', type: 'SHORT_TEXT', label: '   ', required: true },
        ]),
      ).toThrow('label is required');
    });

    it('rejects field label over 100 chars', () => {
      expect(() =>
        SignupConfigValidator.validateFields([
          { id: 'f1', type: 'SHORT_TEXT', label: 'A'.repeat(101), required: true },
        ]),
      ).toThrow('100 characters or less');
    });

    it('rejects script tags in label', () => {
      expect(() =>
        SignupConfigValidator.validateFields([
          { id: 'f1', type: 'SHORT_TEXT', label: '<script>alert(1)</script>', required: true },
        ]),
      ).toThrow('contains unsupported content');
    });

    it('rejects description over 300 chars', () => {
      expect(() =>
        SignupConfigValidator.validateFields([
          { id: 'f1', type: 'SHORT_TEXT', label: 'Label', description: 'A'.repeat(301), required: true },
        ]),
      ).toThrow('300 characters or less');
    });
  });

  describe('Type-specific field config validation', () => {
    describe('Text fields (SHORT_TEXT, LONG_TEXT, EMAIL, PHONE, URL)', () => {
      it('accepts valid placeholder up to 150 chars with emojis and punctuation', () => {
        const validated = SignupConfigValidator.validateFields([
          { id: 'f1', type: 'SHORT_TEXT', label: 'Role', placeholder: 'e.g. Product Designer 🌍 & Founder!' },
        ]);
        expect((validated[0] as any).placeholder).toBe('e.g. Product Designer 🌍 & Founder!');
      });

      it('rejects placeholder over 150 chars', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'SHORT_TEXT', label: 'Name', placeholder: 'A'.repeat(151) },
          ]),
        ).toThrow('150 characters or less');
      });

      it('rejects script tags in placeholder', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'SHORT_TEXT', label: 'Name', placeholder: '<script>alert(1)</script>' },
          ]),
        ).toThrow('contains unsupported content');
      });

      it('preserves legacy description for backward compatibility', () => {
        const validated = SignupConfigValidator.validateFields([
          { id: 'f1', type: 'SHORT_TEXT', label: 'Role', description: 'Legacy help text', placeholder: 'e.g. Dev' },
        ]);
        expect(validated[0].description).toBe('Legacy help text');
        expect((validated[0] as any).placeholder).toBe('e.g. Dev');
      });

      it('rejects minLength > maxLength', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'SHORT_TEXT', label: 'Name', minLength: 20, maxLength: 10 },
          ]),
        ).toThrow('minLength cannot be greater than maxLength');
      });

      it('rejects negative minLength', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'SHORT_TEXT', label: 'Name', minLength: -1 },
          ]),
        ).toThrow(`must be an integer between 0 and ${FIELD_VALIDATION_LIMITS.MAX_MIN_LENGTH}`);
      });
    });

    describe('Choice fields (SINGLE_SELECT, MULTI_SELECT, DROPDOWN)', () => {
      it('accepts placeholder on DROPDOWN field', () => {
        const validated = SignupConfigValidator.validateFields([
          {
            id: 'f1',
            type: 'DROPDOWN',
            label: 'Role',
            placeholder: 'Select your role',
            options: [{ label: 'Dev', value: 'DEV' }],
          },
        ]);
        expect((validated[0] as any).placeholder).toBe('Select your role');
      });
      it('rejects choice field with empty options array', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'SINGLE_SELECT', label: 'Choice', options: [] },
          ]),
        ).toThrow('must have at least 1 option');
      });

      it('rejects duplicate option values', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            {
              id: 'f1',
              type: 'SINGLE_SELECT',
              label: 'Choice',
              options: [
                { label: 'Option 1', value: 'OPT_1' },
                { label: 'Option 2', value: 'opt_1' },
              ],
            },
          ]),
        ).toThrow('is duplicated');
      });

      it('rejects duplicate option labels', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            {
              id: 'f1',
              type: 'SINGLE_SELECT',
              label: 'Choice',
              options: [
                { label: 'Option 1', value: 'OPT_1' },
                { label: 'Option 1', value: 'OPT_2' },
              ],
            },
          ]),
        ).toThrow('is duplicated');
      });

      it('rejects minSelections > maxSelections in MULTI_SELECT', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            {
              id: 'f1',
              type: 'MULTI_SELECT',
              label: 'Choice',
              options: [
                { label: 'Opt 1', value: 'O1' },
                { label: 'Opt 2', value: 'O2' },
                { label: 'Opt 3', value: 'O3' },
              ],
              minSelections: 3,
              maxSelections: 1,
            },
          ]),
        ).toThrow('minSelections cannot be greater than maxSelections');
      });

      it('rejects maxSelections greater than available options count', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            {
              id: 'f1',
              type: 'MULTI_SELECT',
              label: 'Choice',
              options: [
                { label: 'Opt 1', value: 'O1' },
                { label: 'Opt 2', value: 'O2' },
              ],
              maxSelections: 5,
            },
          ]),
        ).toThrow('cannot exceed number of options');
      });
    });

    describe('NUMBER field', () => {
      it('rejects min > max', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'NUMBER', label: 'Age', min: 100, max: 10 },
          ]),
        ).toThrow('minimum cannot be greater than maximum');
      });

      it('rejects NaN min value', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'NUMBER', label: 'Age', min: 'abc' as any },
          ]),
        ).toThrow('min must be a valid number');
      });
    });

    describe('RATING field', () => {
      it('rejects minRating > maxRating', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'RATING', label: 'Rate', minRating: 5, maxRating: 2 },
          ]),
        ).toThrow('minRating cannot be greater than maxRating');
      });

      it('rejects maxRating > 10', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'RATING', label: 'Rate', minRating: 1, maxRating: 15 },
          ]),
        ).toThrow('must be an integer between 1 and 10');
      });
    });

    describe('SCALE field', () => {
      it('rejects min >= max', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'SCALE', label: 'Scale', min: 7, max: 1 },
          ]),
        ).toThrow('min must be less than max');
      });

      it('rejects scale range > 20', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            { id: 'f1', type: 'SCALE', label: 'Scale', min: 1, max: 100 },
          ]),
        ).toThrow('range cannot exceed 20 points');
      });
    });

    describe('COUNTRY & LANGUAGE fields', () => {
      it('rejects invalid country code in selectedOptions', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            {
              id: 'f1',
              type: 'COUNTRY',
              label: 'Country',
              optionMode: 'SELECTED',
              selectedOptions: ['XX'],
            },
          ]),
        ).toThrow('is not a valid country code');
      });

      it('rejects defaultValue not in selectedOptions', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            {
              id: 'f1',
              type: 'COUNTRY',
              label: 'Country',
              optionMode: 'SELECTED',
              selectedOptions: ['US', 'CA'],
              defaultValue: 'GB',
            },
          ]),
        ).toThrow('must be in selected country list');
      });

      it('rejects empty selectedOptions when optionMode is SELECTED', () => {
        expect(() =>
          SignupConfigValidator.validateFields([
            {
              id: 'f1',
              type: 'COUNTRY',
              label: 'Country',
              optionMode: 'SELECTED',
              selectedOptions: [],
            },
          ]),
        ).toThrow('requires at least one selected country');
      });
    });
  });
});
