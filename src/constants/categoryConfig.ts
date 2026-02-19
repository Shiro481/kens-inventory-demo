export interface CategoryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: string[];
  suffix?: string;
}

export interface VariantDimension {
  label: string;
  column: 'variant_type' | 'variant_color' | 'color_temperature';
  active: boolean;
}

export interface CategoryConfig {
  variantTypeLabel: string; // Primary dimension (legacy support)
  variantDimensions?: VariantDimension[];
  fields: CategoryField[];
  suggestedVariantTypes?: string[]; 
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'Headlight': {
    variantTypeLabel: 'Socket Type',
    suggestedVariantTypes: [
      'H1', 'H3', 'H4', 'H7', 'H8', 'H9', 'H11', 'H13', 'H15', 'H16',
      '9005 (HB3)', '9006 (HB4)', '9012 (HIR2)', '880/881',
      'D1S', 'D2S', 'D3S', 'D4S'
    ],
    fields: [
      { key: 'color_temperature', label: 'Color Temp', type: 'text', placeholder: 'e.g. 6000K', suffix: 'K' },
      { key: 'wattage', label: 'Wattage', type: 'number', placeholder: 'e.g. 55', suffix: 'W' },
      { key: 'voltage', label: 'Voltage', type: 'number', placeholder: 'e.g. 12', suffix: 'V' },
      { key: 'lumens', label: 'Lumens', type: 'number', placeholder: 'e.g. 8000' }
    ]
  },
  'Fog Light': {
    variantTypeLabel: 'Socket Type',
    suggestedVariantTypes: ['H8', 'H11', 'H16', '9005', '9006', '880', '881'],
    fields: [
      { key: 'color_temperature', label: 'Color Temp', type: 'text', placeholder: 'e.g. 3000K', suffix: 'K' },
      { key: 'wattage', label: 'Wattage', type: 'number', placeholder: 'e.g. 35', suffix: 'W' }
    ]
  },
  'Signal Light': {
    variantTypeLabel: 'Socket Type',
    suggestedVariantTypes: ['T20 (7440/7443)', 'T25 (3156/3157)', '1156 (BA15S)', '1157 (BAY15D)', 'BA9S'],
    fields: [
       { key: 'color_temperature', label: 'Color', type: 'text', placeholder: 'e.g. Amber' }
    ]
  },
  'Interior Light': {
    variantTypeLabel: 'Socket Type',
    suggestedVariantTypes: ['T10 (W5W)', 'T15 (W16W)', 'Festoon 31mm', 'Festoon 36mm', 'Festoon 39mm', 'Festoon 41mm'],
    fields: [
       { key: 'color_temperature', label: 'Color', type: 'text', placeholder: 'e.g. Cool White' }
    ]
  },
  'Brake Light': {
    variantTypeLabel: 'Socket Type',
    suggestedVariantTypes: ['T20 (7440/7443)', 'T25 (3156/3157)', '1156 (BA15S)', '1157 (BAY15D)'],
    fields: [
       { key: 'color_temperature', label: 'Color', type: 'text', placeholder: 'e.g. Red' }
    ]
  },
  'Wiper': {
    variantTypeLabel: 'Size',
    suggestedVariantTypes: ['14"', '16"', '17"', '18"', '19"', '20"', '21"', '22"', '24"', '26"', '28"'],
    fields: [
      { key: 'color_temperature', label: 'Color', type: 'text', placeholder: 'e.g. Black' }
    ]
  },
  'Horn': {
    variantTypeLabel: 'Tone / Type',
    suggestedVariantTypes: ['Electric', 'Air Horn', 'Snail Type', 'Disc Type', 'High Tone', 'Low Tone', 'Set'],
    fields: [
      { key: 'voltage', label: 'Voltage', type: 'number', placeholder: 'e.g. 12', suffix: 'V' },
      { key: 'specifications.sound_level', label: 'Sound Level', type: 'text', placeholder: 'e.g. 110dB' }
    ]
  }
};

export const DEFAULT_CONFIG: CategoryConfig = {
  variantTypeLabel: 'Type / Size',
  fields: [
    { key: 'color_temperature', label: 'Color / Type', type: 'text', placeholder: 'e.g. 6000K' }
  ]
};

export const getCategoryConfig = (categoryName?: string): CategoryConfig => {
  if (!categoryName) return DEFAULT_CONFIG;
  return CATEGORY_CONFIG[categoryName] || DEFAULT_CONFIG;
};
