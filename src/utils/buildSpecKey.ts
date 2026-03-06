/**
 * Builds a stable, sorted, pipe-delimited key from all active variant dimensions.
 * Used to enforce multi-dimensional uniqueness in the database, 
 * automatically supporting categories with 1, 2, 3 or more dimensions
 * (like Lift Height + Compatibility + Position for Coil Spacers)
 */
export function buildSpecKey(
  variantData: {
    variant_type?: string;
    color_temperature?: string;
    variant_color?: string;
    specifications?: Record<string, any>;
  },
  activeDimensions?: { column: string }[]
): string {
  const parts: Record<string, string> = {};

  // Always include standard variant fields if they exist
  if (variantData.variant_type && String(variantData.variant_type).trim().length > 0) {
    parts['variant_type'] = String(variantData.variant_type).trim().toLowerCase();
  }
  
  if (variantData.color_temperature && String(variantData.color_temperature).trim().length > 0) {
    // some legacy rows might store '6000K' or just 6000
    parts['color_temperature'] = String(variantData.color_temperature).trim().toLowerCase();
  }
  
  if (variantData.variant_color && String(variantData.variant_color).trim().length > 0) {
    parts['variant_color'] = String(variantData.variant_color).trim().toLowerCase();
  }

  // Include dynamic specs if any
  const specs = variantData.specifications || {};
  
  // If activeDimensions are explicitly provided (e.g. from categoryConfig), use those
  // Otherwise default to including all defined specs (excluding internal ones like tags/notes)
  const columnsToCheck = activeDimensions 
    ? activeDimensions.map(d => d.column) 
    : Object.keys(specs).filter(k => k !== 'internal_notes' && k !== 'tags');

  for (const col of columnsToCheck) {
    // Do not double-add if it natively maps to standard fields
    if (['variant_type', 'socket', 'color_temperature', 'temp', 'variant_color', 'color'].includes(col)) {
        continue; 
    }
    
    const val = specs[col];
    if (val !== undefined && val !== null && String(val).trim().length > 0) {
      parts[col] = String(val).trim().toLowerCase();
    }
  }

  // A completely empty variant gets a unique stamp so it doesn't collide with other empties
  if (Object.keys(parts).length === 0) {
      return `empty_variant_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  // Sort keys alphabetically so the string is 100% stable regardless of insertion order
  return Object.keys(parts)
    .sort()
    .map(key => `${key}=${parts[key]}`)
    .join('|');
}
