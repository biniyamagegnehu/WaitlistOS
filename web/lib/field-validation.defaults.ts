/**
 * Centralized field validation defaults for Multi-Step Signup
 * 
 * These constants define the system default validation constraints for each field type.
 * When founders leave configuration empty, these defaults are used.
 * 
 * IMPORTANT: These are the authoritative defaults used by both frontend and backend.
 * Do not duplicate these values in other files.
 * 
 * NOTE: This file must be kept in sync with api/src/common/constants/field-validation.defaults.ts
 */

export const FIELD_VALIDATION_DEFAULTS = {
  // Text-based fields
  SHORT_TEXT: {
    minLength: 1,
    maxLength: 100,
  },
  LONG_TEXT: {
    minLength: 1,
    maxLength: 1000,
  },
  NAME: {
    minLength: 2,
    maxLength: 100,
  },
  EMAIL: {
    maxLength: 254,
  },
  PHONE: {
    maxLength: 20,
  },
  URL: {
    maxLength: 2048,
  },
} as const;

/**
 * Platform safety limits - maximum allowed values for founder configuration
 * These prevent unreasonable configurations that could cause performance issues
 */
export const FIELD_VALIDATION_LIMITS = {
  MAX_MIN_LENGTH: 10000,
  MAX_MAX_LENGTH: 10000,
} as const;

/**
 * Type-safe accessor for field validation defaults
 */
export function getFieldDefaults(fieldType: string) {
  switch (fieldType) {
    case "SHORT_TEXT":
      return FIELD_VALIDATION_DEFAULTS.SHORT_TEXT;
    case "LONG_TEXT":
      return FIELD_VALIDATION_DEFAULTS.LONG_TEXT;
    case "NAME":
      return FIELD_VALIDATION_DEFAULTS.NAME;
    case "EMAIL":
      return FIELD_VALIDATION_DEFAULTS.EMAIL;
    case "PHONE":
      return FIELD_VALIDATION_DEFAULTS.PHONE;
    case "URL":
      return FIELD_VALIDATION_DEFAULTS.URL;
    default:
      return null;
  }
}

/**
 * Resolves effective validation constraints for a text field
 * Combines founder configuration with system defaults
 * 
 * @param fieldType - The type of field (SHORT_TEXT, LONG_TEXT, EMAIL, PHONE, URL)
 * @param founderMinLength - Founder-configured minimum length (null/undefined if not configured)
 * @param founderMaxLength - Founder-configured maximum length (null/undefined if not configured)
 * @returns Effective validation constraints
 */
export function resolveTextValidation(
  fieldType: "SHORT_TEXT" | "LONG_TEXT" | "EMAIL" | "PHONE" | "URL",
  founderMinLength: number | null | undefined,
  founderMaxLength: number | null | undefined,
): { minLength: number; maxLength: number } {
  const defaults = getFieldDefaults(fieldType);
  
  if (!defaults) {
    // For fields without defaults, return reasonable constraints
    return {
      minLength: founderMinLength ?? 0,
      maxLength: founderMaxLength ?? 1000,
    };
  }

  return {
    minLength: founderMinLength ?? (('minLength' in defaults && defaults.minLength) ? defaults.minLength : 0),
    maxLength: founderMaxLength ?? (('maxLength' in defaults && defaults.maxLength) ? defaults.maxLength : 1000),
  };
}
