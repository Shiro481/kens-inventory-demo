
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

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', ...style }}>
      {/* Variant Dimensions (Multi-Dimension Support) */}
      {config.variantDimensions?.filter(d => d.active).map(dim => {
        const val = dim.column === 'variant_type' ? item.variant_type :
                    dim.column === 'variant_color' ? item.variant_color :
                    dim.column === 'color_temperature' ? item.color_temperature : 
                    null;
        if (!val) return null;
        return (
          <span key={dim.column} style={valueStyle}>
            <span style={{ color: '#666', marginRight: '4px', textTransform: 'uppercase', fontSize: '0.8em', ...labelStyle }}>{dim.label}:</span>
            {val}
          </span>
        );
      })}

      {/* Legacy Fields */}
      {!config.variantDimensions && config.fields.map(field => {
        let val = '';
        if (field.key.includes('.')) {
          const [parent, child] = field.key.split('.');
          val = (item as any)[parent]?.[child];
        } else {
          val = (item as any)[field.key];
        }

        if (val === undefined || val === null || val === '') return null;

        return (
          <span key={field.key} style={valueStyle}>
            <span style={{ color: '#666', marginRight: '4px', ...labelStyle }}>{field.label}:</span>
            {val}{field.suffix ? `${field.suffix}` : ''}
          </span>
        );
      })}

      {/* Legacy Fallback for color temperature if not defined in fields */}
      {item.color_temperature && !config.fields.some(f => f.key === 'color_temperature') && (
        <span style={{ color: '#00ff9d', fontWeight: '700', ...valueStyle }}>
          {item.color_temperature}{typeof item.color_temperature === 'number' ? 'K' : ''}
        </span>
      )}
    </div>
  );
}
