import React from 'react';
import { useCategoryMetadata } from '../../../hooks/useCategoryMetadata';

interface DynamicCategorySpecsProps {
  item: any;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  valueStyle?: React.CSSProperties;
}

/**
 * DynamicCategorySpecs - A component that safely uses the useCategoryMetadata hook
 * for an individual item. This allows it to be used within maps/lists.
 *
 * Modified to render ALL active dimensions from the category metadata
 * in a simple, vertical list format to match the original clean aesthetic.
 */
export default function DynamicCategorySpecs({ 
  item, 
  style, 
  labelStyle, 
  valueStyle 
}: DynamicCategorySpecsProps) {
  const { config } = useCategoryMetadata(item.category);
  const displayedKeys = new Set<string>();
  const displayedValues = new Set<string>();

  // Robust helper to parse specifications if it's a string
  const getParsedSpecs = (specs: any) => {
    if (!specs) return {};
    if (typeof specs === 'object') return specs;
    try {
      return JSON.parse(specs);
    } catch (e) {
      console.error('Error parsing specifications:', e);
      return {};
    }
  };

  const currentSpecs = getParsedSpecs(item.specifications);

  // Robust helper to find a value in specifications regardless of case
  const getSafeSpecValue = (specs: any, key: string) => {
    if (!specs || typeof specs !== 'object') return null;
    if (specs[key] !== undefined && specs[key] !== null) {
        displayedKeys.add(key.toLowerCase());
        return specs[key];
    }
    
    // Try case-insensitive match
    const lowerKey = key.toLowerCase();
    const foundKey = Object.keys(specs).find(k => k.toLowerCase() === lowerKey);
    if (foundKey) {
        displayedKeys.add(foundKey.toLowerCase());
        return specs[foundKey];
    }
    return null;
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '4px', 
      marginTop: '4px',
      ...style 
    }}>
      {/* Dynamic Variant Dimensions: Renders ALL active dimensions from Category Metadata */}
      {config.variantDimensions?.filter(d => d.active).map(dim => {
        let val = null;
        const col = (dim.column || '').toLowerCase();
        
        // 1. Check for standard column mappings and their common aliases
        if (col === 'variant_type' || col === 'socket') {
            val = item.variant_type || (item.specifications && getSafeSpecValue(getParsedSpecs(item.specifications), 'socket'));
            displayedKeys.add('variant_type');
            displayedKeys.add('socket');
        }
        else if (col === 'variant_color' || col === 'color') {
            val = item.variant_color || (item.specifications && getSafeSpecValue(getParsedSpecs(item.specifications), 'color'));
            displayedKeys.add('variant_color');
            displayedKeys.add('color');
        }
        else if (col === 'color_temperature' || col === 'temp') {
            val = item.color_temperature || (item.specifications && getSafeSpecValue(getParsedSpecs(item.specifications), 'color_temperature'));
            displayedKeys.add('color_temperature');
            displayedKeys.add('temp');
            if (val && !isNaN(Number(val)) && !val.toString().endsWith('K')) val = `${val}K`;
        }
        else {
            // 2. Check top-level (exact then lower) then specifications
            val = (item as any)[dim.column] ?? (item as any)[col] ?? getSafeSpecValue(currentSpecs, dim.column);
            if (val !== undefined && val !== null) {
                displayedKeys.add(col);
            }
        }
        
        if (val === undefined || val === null || val === '') return null;
        const valStr = String(val).trim();
        if (!valStr || valStr.toLowerCase() === 'undefined') return null;
        
        displayedValues.add(valStr.toLowerCase());

        return (
          <div key={dim.column} style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              color: '#555', 
              textTransform: 'uppercase', 
              fontSize: '9px', 
              fontWeight: 'bold',
              minWidth: '70px',
              ...labelStyle 
            }}>{dim.label}:</span>
            <span style={{ fontWeight: '600' }}>{val}</span>
          </div>
        );
      })}

      {/* Technical Fields list */}
      {config.fields.filter(field => {
        // Skip rendering if this field is already handled as an active dimension
        return !config.variantDimensions?.some(d => d.active && (d.column === field.key || d.column === field.key.toLowerCase() || (field.key === 'color_temperature' && (d.column === 'variant_color' || d.column === 'color_temperature' || d.column === 'variant_type'))));
      }).map(field => {
        let val = '';
        if (field.key.includes('.')) {
          const [parent, child] = field.key.split('.');
          val = (item as any)[parent]?.[child];
        } else {
          // Check top-level first, then specifications
          val = (item as any)[field.key] ?? getSafeSpecValue(currentSpecs, field.key);
        }

        if (val === undefined || val === null || val === '') return null;
        
        const valStr = String(val).trim();
        // Avoid duplicates. Note: Removed the name inclusion check to ensure important specs like PCD always show.
        if (!valStr || valStr.toLowerCase() === 'undefined' || displayedValues.has(valStr.toLowerCase())) return null;
        
        displayedKeys.add(field.key.toLowerCase());
        displayedValues.add(valStr.toLowerCase());

        return (
          <div key={field.key} style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              color: '#555', 
              textTransform: 'uppercase', 
              fontSize: '9px', 
              fontWeight: 'bold',
              minWidth: '70px',
              ...labelStyle 
            }}>{field.label}:</span>
            <span style={{ fontWeight: '600' }}>{val}{field.suffix ? `${field.suffix}` : ''}</span>
          </div>
        );
      })}

      {/* Fallback for Important Hidden Specs (e.g. PCD if missing from config) */}
      {(() => {
        const pcdVal = getSafeSpecValue(currentSpecs, 'pcd');
        if (pcdVal && !displayedValues.has(String(pcdVal).toLowerCase())) {
          displayedKeys.add('pcd');
          displayedValues.add(String(pcdVal).toLowerCase());
          return (
            <div key="fallback-pcd" style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                color: '#555', 
                textTransform: 'uppercase', 
                fontSize: '9px', 
                fontWeight: 'bold',
                minWidth: '70px',
                ...labelStyle 
              }}>PCD:</span>
              <span style={{ fontWeight: '600' }}>{pcdVal}</span>
            </div>
          );
        }
        return null;
      })()}

      {/* Catch-all for other non-internal specifications not handled by config loops */}
      {(() => {
        // Collect all potential technical specs, including from nested 'specs' object
        const allTechnicalEntries = {
          ...currentSpecs,
          ...(currentSpecs.specs || {})
        };

        const internalFields = ['tags', 'last_restock', 'internal_notes', 'color', 'socket', 'specs', 'variant_type', 'variant_color', 'color_temperature'];

        return Object.entries(allTechnicalEntries).filter(([key]) => {
          return !internalFields.includes(key) && !displayedKeys.has(key.toLowerCase());
        }).map(([key, val]) => {
          if (val === undefined || val === null || val === '' || val === 0) return null;
          
          const valStr = String(val).trim();
          if (!valStr || valStr.toLowerCase() === 'undefined' || displayedValues.has(valStr.toLowerCase())) return null;
          
          // Final check to avoid showing meaningless keys or already shown values
          if (key.startsWith('field_') || key.startsWith('spec_')) {
              // For generated keys, only show if the value is unique
              if (displayedValues.has(valStr.toLowerCase())) return null;
          }
          displayedKeys.add(key.toLowerCase());
          displayedValues.add(valStr.toLowerCase());

          // Simple formatting for key
          const displayLabel = key.replace(/_/g, ' ').toUpperCase();

          return (
            <div key={key} style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ 
                color: '#555', 
                textTransform: 'uppercase', 
                fontSize: '9px', 
                fontWeight: 'bold',
                minWidth: '70px',
                ...labelStyle 
              }}>{displayLabel}:</span>
              <span style={{ fontWeight: '600' }}>{valStr}</span>
            </div>
          );
        });
      })()}
    </div>
  );
}
