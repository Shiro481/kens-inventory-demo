import React from 'react';
import styles from '../EditItemModal.module.css';
import type { InventoryItem } from '../../../../types/inventory';

interface TechnicalSpecsSectionProps {
  editingItem: InventoryItem;
  config: any;
  filteredVariantTypes: string[];
  isNewVariantType: boolean;
  onInputChange: (field: string, value: any) => void;
  onTypeSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSetIsNewVariantType: (val: boolean) => void;
}

export default function TechnicalSpecsSection({
  editingItem,
  config,
  filteredVariantTypes,
  isNewVariantType,
  onInputChange,
  onTypeSelect,
  onSetIsNewVariantType
}: TechnicalSpecsSectionProps) {
  return (
    <>
      <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '16px' }}>
        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>TECHNICAL SPECIFICATIONS</h3>
      </div>
      <div className={styles.formGroup}>
        <label>{config.variantTypeLabel}</label>
        {!isNewVariantType ? (
          <select 
            className={styles.formInput} 
            value={filteredVariantTypes?.includes(editingItem.variant_type || '') ? editingItem.variant_type : ''} 
            onChange={onTypeSelect}
          >
            <option value="">Select {config.variantTypeLabel}</option>
            {filteredVariantTypes?.map(type => <option key={type} value={type}>{type}</option>)}
            <option value="__NEW__">+ Add New {config.variantTypeLabel}</option>
          </select>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              className={styles.formInput} 
              type="text" 
              autoFocus 
              placeholder={`Enter ${config.variantTypeLabel.toLowerCase()}`} 
              value={editingItem.variant_type || ''} 
              onChange={(e) => onInputChange('variant_type', e.target.value)} 
              style={{ flex: 1 }} 
            />
            <button 
              onClick={() => onSetIsNewVariantType(false)} 
              className={styles.cancelBtn} 
              style={{ padding: '0 10px', border: '1px solid #333' }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className={styles.formGroup}>
        <label>Barcode</label>
        <input 
          className={styles.formInput} 
          type="text" 
          value={editingItem.barcode || ''} 
          onChange={(e) => onInputChange('barcode', e.target.value)} 
          placeholder="Variant specific barcode" 
        />
      </div>

      {/* Top Level Columns for Products in database */}
      {(() => {
        const topLevelColumns = ['name', 'sku', 'barcode', 'brand', 'price', 'stock', 'cost_price', 'voltage', 'wattage', 'color_temperature', 'lumens', 'beam_type', 'description', 'image_url', 'supplier_id'];
        
        return config.fields.filter((field: any) => {
          // Skip fields that are already handled as active dimensions to avoid duplication
          return !config.variantDimensions?.some((d: any) => d.active && (d.column === field.key || (field.key === 'color_temperature' && d.column === 'variant_color')));
        }).map((field: any) => {
          const isStandard = topLevelColumns.includes(field.key);
          const value = field.key.includes('.') 
            ? (editingItem as any)[field.key.split('.')[0]]?.[field.key.split('.')[1]] 
            : (isStandard ? (editingItem as any)[field.key] : editingItem.specifications?.[field.key]);

          return (
            <div key={field.key} className={styles.formGroup}>
              <label>{field.label} {field.suffix ? `(${field.suffix})` : ''}</label>
              {field.type === 'select' ? (
                <select
                  className={styles.formInput}
                  value={value || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (isStandard || field.key.includes('.')) {
                      onInputChange(field.key, val);
                    } else {
                      onInputChange('specifications', {
                        ...(editingItem.specifications || {}),
                        [field.key]: val
                      });
                    }
                  }}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  className={styles.formInput} 
                  type={field.type} 
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  value={value || ''}
                  onChange={(e) => {
                    const rawVal = e.target.value;
                    const val = field.type === 'number' ? (rawVal === '' ? 0 : parseFloat(rawVal)) : rawVal;
                    if (isStandard || field.key.includes('.')) {
                      onInputChange(field.key, val);
                    } else {
                      onInputChange('specifications', {
                        ...(editingItem.specifications || {}),
                        [field.key]: val
                      });
                    }
                  }}
                />
              )}
            </div>
          );
        });
      })()}

      {/* Dynamic Variant Dimensions (Custom Dimensions) */}
      {config.variantDimensions?.filter((d: any) => d.active).map((dim: any) => {
        // Determine where to read the current value from
        const isColorDim = dim.column === 'color' || dim.column === 'variant_color';
        const isKelvinDim = dim.column === 'color_temperature' || dim.column === 'temp';

        let value = '';
        if (isColorDim) {
          // Color lives in specifications.color (or variant_color for legacy)
          value = editingItem.specifications?.color || editingItem.variant_color || '';
        } else if (isKelvinDim) {
          // Only use color_temperature DB column if it's numeric (Kelvin)
          const rawCt = editingItem.color_temperature;
          const ctIsKelvin = rawCt && !isNaN(Number(String(rawCt).replace('K', '').trim()));
          value = ctIsKelvin ? String(rawCt) : (editingItem.specifications?.color_temperature || '');
        } else {
          value = editingItem.specifications?.[dim.column] || '';
        }

        return (
          <div key={dim.column} className={styles.formGroup}>
            <label>{dim.label}</label>
            <input 
              type="text" 
              className={styles.formInput} 
              value={value}
              onChange={(e) => {
                const newVal = e.target.value;
                if (isColorDim) {
                  // Always write color to specifications.color — keeps it out of the Kelvin column
                  onInputChange('specifications', {
                    ...(editingItem.specifications || {}),
                    color: newVal
                  });
                } else if (isKelvinDim) {
                  // Only write to DB column if the value is numeric (Kelvin)
                  const isKelvin = newVal !== '' && !isNaN(Number(newVal.replace('K', '').trim()));
                  if (isKelvin) {
                    onInputChange('color_temperature', newVal.replace('K', ''));
                  } else {
                    onInputChange('specifications', {
                      ...(editingItem.specifications || {}),
                      color_temperature: newVal
                    });
                  }
                } else {
                  onInputChange('specifications', {
                    ...(editingItem.specifications || {}),
                    [dim.column]: newVal
                  });
                }
              }}
              placeholder={isColorDim ? 'e.g. Black, Red, etc.' : 
                           isKelvinDim ? 'e.g. 6000 or 6000K' : 
                           `Enter ${dim.label.toLowerCase()}`}
            />
          </div>
        );
      })}

      {(!editingItem.category || editingItem.category === 'Headlight' || editingItem.category === 'Fog Light') && (
        <div className={styles.formGroup}>
          <label>Beam Type</label>
          <select 
            className={styles.formInput} 
            value={editingItem.beam_type || ''} 
            onChange={(e) => onInputChange('beam_type', e.target.value)}
          >
            <option value="">Select Beam</option>
            <option value="Low">Low Beam</option>
            <option value="High">High Beam</option>
            <option value="High/Low">High/Low Combo</option>
            <option value="Fog">Fog Light</option>
            <option value="Signal">Signal/Indicator</option>
            <option value="Brake">Brake/Stop</option>
            <option value="Reverse">Reverse</option>
            <option value="Interior">Interior</option>
          </select>
        </div>
      )}
    </>
  );
}
