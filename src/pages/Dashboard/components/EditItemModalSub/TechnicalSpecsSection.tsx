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

      {config.fields.map((field: any) => (
        <div key={field.key} className={styles.formGroup}>
          <label>{field.label} {field.suffix ? `(${field.suffix})` : ''}</label>
          {field.type === 'select' ? (
            <select
              className={styles.formInput}
              value={(field.key.includes('.') ? (editingItem as any)[field.key.split('.')[0]]?.[field.key.split('.')[1]] : (editingItem as any)[field.key]) || ''}
              onChange={(e) => onInputChange(field.key, e.target.value)}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              className={styles.formInput} 
              type={field.type} 
              placeholder={field.placeholder}
              value={(field.key.includes('.') ? (editingItem as any)[field.key.split('.')[0]]?.[field.key.split('.')[1]] : (editingItem as any)[field.key]) || ''}
              onChange={(e) => {
                const val = e.target.value;
                onInputChange(field.key, field.type === 'number' ? (val === '' ? 0 : parseFloat(val)) : val);
              }}
            />
          )}
        </div>
      ))}

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
