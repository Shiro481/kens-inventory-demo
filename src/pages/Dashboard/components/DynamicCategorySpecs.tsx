
import React from 'react';
import { useCategoryMetadata } from '../../../hooks/useCategoryMetadata';
import type { InventoryItem } from '../../../types/inventory';

interface DynamicCategorySpecsProps {
  item: InventoryItem;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  valueStyle?: React.CSSProperties;
}

/**
 * DynamicCategorySpecs - A component that safely uses the useCategoryMetadata hook
 * for an individual item. This allows it to be used within maps/lists.
 */
export default function DynamicCategorySpecs({ 
  item, 
  style, 
  labelStyle, 
  valueStyle 
}: DynamicCategorySpecsProps) {
  const { config } = useCategoryMetadata(item.category);
  const displayedValues = new Set<string>();

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '4px', 
      marginTop: '6px',
      ...style 
    }}>
      {/* Variant Dimensions (Multi-Dimension Support) */}
      {config.variantDimensions?.filter(d => d.active).map(dim => {
        let val = null;
        if (dim.column === 'variant_type') val = item.variant_type;
        else if (dim.column === 'variant_color') val = item.variant_color;
        else if (dim.column === 'color_temperature') val = item.color_temperature;
        else val = (item as any).specifications?.[dim.column];
        
        if (!val || val === 0) return null;
        const valStr = String(val).trim();
        if (!valStr || displayedValues.has(valStr.toLowerCase())) return null;
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

      {/* Technical Fields (Attributes that are NOT dimensions) */}
      {config.fields.filter(field => {
        // Skip rendering if this field is already handled as an active dimension
        return !config.variantDimensions?.some(d => d.active && (d.column === field.key || (field.key === 'color_temperature' && (d.column === 'variant_color' || d.column === 'color_temperature' || d.column === 'variant_type'))));
      }).map(field => {
        let val = '';
        if (field.key.includes('.')) {
          const [parent, child] = field.key.split('.');
          val = (item as any)[parent]?.[child];
        } else {
          val = (item as any)[field.key];
        }

        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'number' && val === 0) return null;
        
        const valStr = String(val).trim();
        // Avoid duplicates and avoid showing values that are already part of the name
        if (!valStr || displayedValues.has(valStr.toLowerCase()) || item.name.toLowerCase().includes(valStr.toLowerCase())) return null;
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
    </div>
  );
}
