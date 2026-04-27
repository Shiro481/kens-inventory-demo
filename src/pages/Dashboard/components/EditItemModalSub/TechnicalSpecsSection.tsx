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
  allItems: InventoryItem[];
}

export default function TechnicalSpecsSection({
  editingItem,
  config,
  filteredVariantTypes,
  isNewVariantType,
  onInputChange,
  onTypeSelect,
  onSetIsNewVariantType,
  allItems
}: TechnicalSpecsSectionProps) {
  const [newModeDims, setNewModeDims] = React.useState<Record<string, boolean>>({});

  const topLevelColumns = ['name', 'sku', 'barcode', 'brand', 'price', 'stock', 'cost_price', 'voltage', 'wattage', 'color_temperature', 'variant_color', 'variant_type', 'lumens', 'beam_type', 'description', 'image_url', 'supplier_id'];

  const getDimensionValues = (key: string, isStandardInput: boolean) => {
    const isColor = key === 'color' || key === 'variant_color';
    const isKelvin = key === 'color_temperature' || key === 'temp';
    const isStandard = isStandardInput || topLevelColumns.includes(key);

    const values = new Set<string>();
    allItems.forEach(item => {
      let val: any = '';
      if (isColor) {
        val = item.variant_color || item.specifications?.color;
      } else if (isKelvin) {
        const rawCt = item.color_temperature;
        const ctIsKelvin = rawCt && !isNaN(Number(String(rawCt).replace('K', '').trim()));
        val = ctIsKelvin ? String(rawCt) : item.specifications?.color_temperature;
      } else if (isStandard) {
        val = (item as any)[key];
      } else if (key.includes('.')) {
        const [parent, child] = key.split('.');
        val = (item as any)[parent]?.[child];
      } else {
        val = item.specifications?.[key];
      }

      if (val !== undefined && val !== null && String(val).trim() !== '') {
        values.add(String(val).trim());
      }
    });
    return Array.from(values).sort();
  };

  const toggleNewMode = (key: string, isNew: boolean) => {
    setNewModeDims(prev => ({ ...prev, [key]: isNew }));
  };

  const updateValue = (key: string, newVal: any, isStandardInput: boolean, isColor: boolean, isKelvin: boolean) => {
    const isStandard = isStandardInput || topLevelColumns.includes(key);
    if (isColor) {
      onInputChange('variant_color', newVal);
      onInputChange('specifications', {
        ...(editingItem.specifications || {}),
        color: newVal
      });
    } else if (isKelvin) {
      onInputChange('color_temperature', newVal);
      onInputChange('specifications', {
        ...(editingItem.specifications || {}),
        color_temperature: newVal
      });
    } else if (isStandard || key.includes('.')) {
      onInputChange(key, newVal);
    } else {
      onInputChange('specifications', {
        ...(editingItem.specifications || {}),
        [key]: newVal
      });
    }
  };

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
        return config.fields.filter((field: any) => {
          // Skip fields that are already handled as active dimensions to avoid duplication
          return !config.variantDimensions?.some((d: any) => d.active && (d.column === field.key || (field.key === 'color_temperature' && d.column === 'variant_color')));
        }).map((field: any) => {
          const isStandard = topLevelColumns.includes(field.key);
          const isColor = field.key === 'color' || field.key === 'variant_color';
          const isKelvin = field.key === 'color_temperature' || field.key === 'temp';
          const isNewMode = newModeDims[field.key];

          const rawValue = field.key.includes('.') 
            ? (editingItem as any)[field.key.split('.')[0]]?.[field.key.split('.')[1]] 
            : (isStandard ? (editingItem as any)[field.key] : editingItem.specifications?.[field.key]);
          const value = rawValue || '';

          const existingValues = (field.type === 'text' || field.type === 'select') ? getDimensionValues(field.key, isStandard) : [];
          const showDropdown = existingValues.length > 0 && !isNewMode;

          return (
            <div key={field.key} className={styles.formGroup}>
              <label>{field.label} {field.suffix ? `(${field.suffix})` : ''}</label>
              {field.type === 'select' || showDropdown ? (
                <select
                  className={styles.formInput}
                  value={existingValues.includes(String(value)) ? String(value) : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__NEW__') {
                      toggleNewMode(field.key, true);
                    } else {
                      updateValue(field.key, val, isStandard, isColor, isKelvin);
                    }
                  }}
                >
                  <option value="">Select {field.label}</option>
                  {existingValues.map(v => <option key={v} value={v}>{v}</option>)}
                  {field.options?.filter((o: string) => !existingValues.includes(o)).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="__NEW__">+ Add New {field.label}</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    className={styles.formInput} 
                    type={field.type} 
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    value={value}
                    autoFocus={isNewMode}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      const val = field.type === 'number' ? (rawVal === '' ? 0 : parseFloat(rawVal)) : rawVal;
                      updateValue(field.key, val, isStandard, isColor, isKelvin);
                    }}
                    style={{ flex: 1 }}
                  />
                  {isNewMode && (
                    <button 
                      onClick={() => toggleNewMode(field.key, false)} 
                      className={styles.cancelBtn} 
                      style={{ padding: '0 10px', border: '1px solid #333' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        });
      })()}

      {/* Dynamic Variant Dimensions (Custom Dimensions) */}
      {config.variantDimensions?.filter((d: any) => d.active).filter((d: any) => {
        // Skip duplicating the primary variant type field
        return d.column !== 'variant_type';
      }).map((dim: any) => {
        const column = dim.column;
        const isColorDim = column === 'color' || column === 'variant_color';
        const isKelvinDim = column === 'color_temperature' || column === 'temp';
        const isNewMode = newModeDims[column];
        const isStandard = topLevelColumns.includes(column);

        let value = '';
        if (isColorDim) {
          value = editingItem.variant_color || editingItem.specifications?.color || '';
        } else if (isKelvinDim) {
          const rawCt = editingItem.color_temperature;
          const ctIsKelvin = rawCt && !isNaN(Number(String(rawCt).replace('K', '').trim()));
          value = ctIsKelvin ? String(rawCt) : (editingItem.specifications?.color_temperature || '');
        } else if (isStandard) {
          value = (editingItem as any)[column] || '';
        } else {
          value = editingItem.specifications?.[column] || '';
        }

        const existingValues = getDimensionValues(column, isStandard);
        const showDropdown = existingValues.length > 0 && !isNewMode;

        return (
          <div key={column} className={styles.formGroup}>
            <label>{dim.label}</label>
            {showDropdown ? (
              <select
                className={styles.formInput}
                value={existingValues.includes(String(value)) ? String(value) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__NEW__') {
                    toggleNewMode(column, true);
                  } else {
                    updateValue(column, val, isStandard, isColorDim, isKelvinDim);
                  }
                }}
              >
                <option value="">Select {dim.label}</option>
                {existingValues.map(v => <option key={v} value={v}>{v}</option>)}
                <option value="__NEW__">+ Add New Value</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={value}
                  autoFocus={isNewMode}
                  onChange={(e) => updateValue(column, e.target.value, isStandard, isColorDim, isKelvinDim)}
                  placeholder={isColorDim ? 'e.g. Black, Red, etc.' : 
                               isKelvinDim ? 'e.g. 6000 or 6000K' : 
                               `Enter ${dim.label.toLowerCase()}`}
                  style={{ flex: 1 }}
                />
                {isNewMode && (
                  <button 
                    onClick={() => toggleNewMode(column, false)} 
                    className={styles.cancelBtn} 
                    style={{ padding: '0 10px', border: '1px solid #333' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
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
