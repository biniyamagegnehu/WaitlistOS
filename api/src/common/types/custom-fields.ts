export type FieldType = 
  | "SHORT_TEXT" 
  | "LONG_TEXT" 
  | "EMAIL" 
  | "PHONE" 
  | "URL" 
  | "SINGLE_SELECT" 
  | "MULTI_SELECT" 
  | "DROPDOWN" 
  | "BOOLEAN" 
  | "RATING" 
  | "SCALE" 
  | "NUMBER" 
  | "DATE" 
  | "DATE_TIME" 
  | "COUNTRY" 
  | "LANGUAGE" 
  | "CONSENT";

export type FieldCategory = "TEXT" | "CHOICE" | "NUMBER" | "DATE_TIME" | "LOCATION" | "LEGAL";

export interface FieldOption {
  label: string;
  value: string;
}

export interface BaseFieldConfig {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: "SHORT_TEXT" | "LONG_TEXT" | "EMAIL" | "PHONE" | "URL";
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
}

export interface ChoiceFieldConfig extends BaseFieldConfig {
  type: "SINGLE_SELECT" | "MULTI_SELECT" | "DROPDOWN";
  options: FieldOption[];
  minSelections?: number; // For MULTI_SELECT
  maxSelections?: number; // For MULTI_SELECT
}

export interface BooleanFieldConfig extends BaseFieldConfig {
  type: "BOOLEAN";
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: "NUMBER";
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface RatingFieldConfig extends BaseFieldConfig {
  type: "RATING";
  minRating?: number; // Default 1
  maxRating?: number; // Default 5
}

export interface ScaleFieldConfig extends BaseFieldConfig {
  type: "SCALE";
  min?: number; // Default 1
  max?: number; // Default 7
  leftLabel?: string;
  rightLabel?: string;
}

export interface DateTimeFieldConfig extends BaseFieldConfig {
  type: "DATE" | "DATE_TIME";
  minDate?: string;
  maxDate?: string;
}

export type LocationOptionMode = "ALL" | "SELECTED";

export interface LocationFieldConfig extends BaseFieldConfig {
  type: "COUNTRY" | "LANGUAGE";
  optionMode?: LocationOptionMode; // Default: "ALL"
  selectedOptions?: string[];       // ISO codes, order-preserved
  defaultValue?: string;            // ISO code for pre-selected default
}

export interface ConsentFieldConfig extends BaseFieldConfig {
  type: "CONSENT";
}

export type CustomFieldConfig =
  | TextFieldConfig
  | ChoiceFieldConfig
  | BooleanFieldConfig
  | NumberFieldConfig
  | RatingFieldConfig
  | ScaleFieldConfig
  | DateTimeFieldConfig
  | LocationFieldConfig
  | ConsentFieldConfig;

export interface FieldRegistryEntry {
  type: FieldType;
  category: FieldCategory;
  name: string;
  description: string;
  iconName: string;
  defaultConfig: Partial<CustomFieldConfig>;
}

export const FIELD_REGISTRY: FieldRegistryEntry[] = [
  {
    type: "SHORT_TEXT",
    category: "TEXT",
    name: "Short Text",
    description: "One-line text answer",
    iconName: "Type",
    defaultConfig: { placeholder: "" },
  },
  {
    type: "LONG_TEXT",
    category: "TEXT",
    name: "Long Text",
    description: "Long-form response",
    iconName: "AlignLeft",
    defaultConfig: { placeholder: "" },
  },
  {
    type: "EMAIL",
    category: "TEXT",
    name: "Email",
    description: "Collect an additional email address",
    iconName: "Mail",
    defaultConfig: { placeholder: "name@company.com" },
  },
  {
    type: "PHONE",
    category: "TEXT",
    name: "Phone",
    description: "Collect a phone number",
    iconName: "Phone",
    defaultConfig: { placeholder: "+1 234 567 8900" },
  },
  {
    type: "URL",
    category: "TEXT",
    name: "URL",
    description: "Website or profile link",
    iconName: "Link",
    defaultConfig: { placeholder: "https://..." },
  },
  {
    type: "SINGLE_SELECT",
    category: "CHOICE",
    name: "Single Select",
    description: "Choose exactly one option",
    iconName: "CircleDot",
    defaultConfig: { options: [{ label: "Option 1", value: "OPTION_1" }] },
  },
  {
    type: "MULTI_SELECT",
    category: "CHOICE",
    name: "Multi Select",
    description: "Choose multiple options",
    iconName: "CheckSquare",
    defaultConfig: { options: [{ label: "Option 1", value: "OPTION_1" }] },
  },
  {
    type: "DROPDOWN",
    category: "CHOICE",
    name: "Dropdown",
    description: "Single selection from a large list",
    iconName: "ChevronDownSquare",
    defaultConfig: { options: [{ label: "Option 1", value: "OPTION_1" }] },
  },
  {
    type: "BOOLEAN",
    category: "CHOICE",
    name: "Yes / No",
    description: "Simple yes/no question",
    iconName: "ToggleRight",
    defaultConfig: {},
  },
  {
    type: "RATING",
    category: "CHOICE",
    name: "Rating",
    description: "Rate something using stars",
    iconName: "Star",
    defaultConfig: { minRating: 1, maxRating: 5 },
  },
  {
    type: "SCALE",
    category: "CHOICE",
    name: "Scale",
    description: "Rate between two endpoints",
    iconName: "SlidersHorizontal",
    defaultConfig: { min: 1, max: 7, leftLabel: "Low", rightLabel: "High" },
  },
  {
    type: "NUMBER",
    category: "NUMBER",
    name: "Number",
    description: "Numeric answers",
    iconName: "Hash",
    defaultConfig: {},
  },
  {
    type: "DATE",
    category: "DATE_TIME",
    name: "Date",
    description: "Collect a calendar date",
    iconName: "Calendar",
    defaultConfig: {},
  },
  {
    type: "DATE_TIME",
    category: "DATE_TIME",
    name: "Date & Time",
    description: "Collect date and time",
    iconName: "Clock",
    defaultConfig: {},
  },
  {
    type: "COUNTRY",
    category: "LOCATION",
    name: "Country",
    description: "Participant's country",
    iconName: "Globe",
    defaultConfig: { optionMode: "ALL", selectedOptions: [], defaultValue: "" },
  },
  {
    type: "LANGUAGE",
    category: "LOCATION",
    name: "Language",
    description: "Participant's preferred language",
    iconName: "Languages",
    defaultConfig: { optionMode: "ALL", selectedOptions: [], defaultValue: "" },
  },
  {
    type: "CONSENT",
    category: "LEGAL",
    name: "Consent Checkbox",
    description: "Explicit legal/privacy consent",
    iconName: "ShieldCheck",
    defaultConfig: {},
  },
];
