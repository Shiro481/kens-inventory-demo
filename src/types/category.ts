export interface CategoryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  suffix?: string;
  options?: string[];
}

export interface VariantDimension {
  label: string;
  column: string;
  active: boolean;
}

export interface CategoryMetadata {
  id?: number;
  category_id: number;
  variant_type_label: string;
  variant_dimensions?: VariantDimension[];
  fields: CategoryField[];
  suggested_variant_types: string[];
}
