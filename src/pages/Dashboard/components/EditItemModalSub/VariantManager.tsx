import React from 'react';
import { Info, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import styles from '../EditItemModal.module.css';

interface VariantManagerProps {
  productVariants: any[];
  showVariantForm: boolean;
  newVariantData: any;
  isAddingNewTypeInVariantForm: boolean;
  config: any;
  filteredVariantTypes: string[];
  onAddVariant: () => void;
  onDeleteVariant: (id: number) => void;
  onSetShowVariantForm: (val: boolean) => void;
  onSetNewVariantData: (data: any | ((prev: any) => any)) => void;
  onSetIsAddingNewType: (val: boolean) => void;
  onSetEditingVariantId: (id: number | null) => void;
  isSavingVariant: boolean;
  allItems: any[];
}

export default function VariantManager({
  productVariants,
  showVariantForm,
  newVariantData,
  isAddingNewTypeInVariantForm,
  config,
  filteredVariantTypes,
  onAddVariant,
  onDeleteVariant,
  onSetShowVariantForm,
  onSetNewVariantData,
  onSetIsAddingNewType,
  onSetEditingVariantId,
  isSavingVariant,
  allItems
}: VariantManagerProps) {
  const [newModeDims, setNewModeDims] = React.useState<Record<string, boolean>>({});

  const topLevelColumns = ['name', 'sku', 'barcode', 'brand', 'selling_price', 'stock_quantity', 'cost_price', 'voltage', 'wattage', 'color_temperature', 'variant_color', 'variant_type', 'lumens', 'beam_type', 'description', 'image_url', 'supplier_id'];

  const getDimensionValues = (key: string) => {
    const isColor = key === 'color' || key === 'variant_color';
    const isKelvin = key === 'color_temperature' || key === 'temp';
    const isStandard = topLevelColumns.includes(key);

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
        // Map common spec names to their DB column equivalents if needed
        const dbKey = key === 'stock' ? 'stock_quantity' : (key === 'price' ? 'selling_price' : key);
        val = (item as any)[dbKey] || (item as any)[key];
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

  const updateValue = (column: string, newVal: any) => {
    const isColor = column === 'variant_color' || column === 'color';
    const isKelvin = column === 'color_temperature' || column === 'temp';
    const isStandard = topLevelColumns.includes(column);

    if (isColor) {
      onSetNewVariantData((prev: any) => ({
        ...prev, 
        color: newVal,
        specifications: { 
          ...(prev.specifications || {}), 
          color: newVal 
        }
      }));
    } else if (isKelvin) {
      onSetNewVariantData((prev: any) => ({
        ...prev, 
        color_temperature: newVal,
        specifications: { 
          ...(prev.specifications || {}), 
          color_temperature: newVal 
        }
      }));
    } else if (isStandard) {
      onSetNewVariantData((prev: any) => ({
        ...prev,
        [column]: newVal
      }));
    } else {
      onSetNewVariantData((prev: any) => ({
        ...prev, 
        specifications: { 
          ...(prev.specifications || {}), 
          [column]: newVal 
        }
      }));
    }
  };

  const getParsedSpecs = (specs: any) => {
    if (!specs) return {};
    if (typeof specs === 'object') return specs;
    try { return JSON.parse(specs); } catch { return {}; }
  };

  return (
    <div className={styles.variantSection}>
      <div className={styles.variantHeader}>
        <h3>MANAGE VARIANTS <Info size={12} style={{ opacity: 0.3 }} /></h3>
      </div>
      
      {productVariants.length > 0 && (
        <div className={styles.variantList}>
          {productVariants.map((v: any) => (
            <div key={v.id} className={styles.variantCard}>
              <div className={styles.variantInfo}>
                <div className={styles.variantInfoMain}>
                  <span className={styles.variantTag}>{v.variant_type || 'General'}</span>
                  {config.variantDimensions?.filter((d: any) => d.active && d.column !== 'variant_type').map((dim: any) => {
                    const col = dim.column;
                    let val = '';
                    if (col === 'variant_color' || col === 'color') val = v.variant_color || getParsedSpecs(v.specifications)?.color;
                    else if (col === 'color_temperature' || col === 'temp') val = v.color_temperature || getParsedSpecs(v.specifications)?.color_temperature;
                    else val = v[col] || getParsedSpecs(v.specifications)?.[col];
                    
                    if (!val) return null;
                    return <span key={col} className={styles.variantTag} style={{ background: '#111', color: '#666' }}>{val}</span>;
                  })}
                  <span style={{ marginLeft: 'auto', opacity: 0.5 }}>{v.variant_sku || v.sku || 'No SKU'}</span>
                </div>
                <div className={styles.variantInfoSub}>
                   STOCK: <span style={{ color: (v.stock_quantity || 0) < (v.min_stock_level || 5) ? '#ff4444' : '#888' }}>{v.stock_quantity || 0}</span>
                   <span style={{ opacity: 0.3, margin: '0 6px' }}>|</span>
                   SELL: ₱{(v.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={styles.deleteVariantBtn} style={{ opacity: 1 }} onClick={() => {
                  onSetEditingVariantId(v.id);
                  onSetNewVariantData({
                    id: v.id,
                    variant_type: v.variant_type || '',
                    sku: v.variant_sku || v.sku || '',
                    barcode: v.barcode || '',
                    selling_price: parseFloat(v.selling_price || 0),
                    stock: parseInt(v.stock_quantity || 0),
                    cost_price: parseFloat(v.cost_price || 0),
                    color: v.variant_color || getParsedSpecs(v.specifications)?.color || '',
                    color_temperature: v.color_temperature || getParsedSpecs(v.specifications)?.color_temperature || '',
                    specifications: getParsedSpecs(v.specifications),
                    description: v.description || '',
                    notes: getParsedSpecs(v.specifications)?.internal_notes || ''
                  });
                  onSetShowVariantForm(true);
                }} title="Edit Variant">
                  <Pencil size={14} />
                </button>
                <button className={styles.deleteVariantBtn} style={{ opacity: 1 }} onClick={() => onDeleteVariant(v.id)} title="Delete Variant">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showVariantForm ? (
        <div className={styles.variantFormContainer}>
          <div className={styles.variantFormHeader}>
            {newVariantData.id ? 'Edit Variant' : 'Add New Variant'}
          </div>
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>SKU</label>
              <input 
                type="text" 
                className={styles.formInput} 
                value={newVariantData.sku || ''} 
                onChange={e => onSetNewVariantData((prev: any) => ({...prev, sku: e.target.value}))} 
                placeholder="Variant SKU" 
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Barcode</label>
              <input 
                type="text" 
                className={styles.formInput} 
                value={newVariantData.barcode || ''} 
                onChange={e => onSetNewVariantData((prev: any) => ({...prev, barcode: e.target.value}))} 
                placeholder="Unique barcode" 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Selling Price</label>
              <input 
                type="number" 
                className={styles.formInput} 
                value={newVariantData.selling_price || 0} 
                onChange={e => onSetNewVariantData((prev: any) => ({...prev, selling_price: parseFloat(e.target.value) || 0}))} 
              />
            </div>

            <div className={styles.formGroup}>
              <label>Stock</label>
              <input 
                type="number" 
                className={styles.formInput} 
                value={newVariantData.stock || 0} 
                onChange={e => onSetNewVariantData((prev: any) => ({...prev, stock: parseInt(e.target.value) || 0}))} 
              />
            </div>

            {/* Dimensions Loop */}
            {config.variantDimensions?.filter((d: any) => d.active).map((dim: any) => {
              const column = dim.column;
              const normalizedDimLabel = dim.label.toLowerCase().replace(':', '').trim();
              const normalizedTypeLabel = (config.variantTypeLabel || 'Variant Type').toLowerCase().replace(':', '').trim();
              const isPrimaryType = column === 'variant_type' || column === 'socket' || normalizedDimLabel === normalizedTypeLabel;
              
              const isColorDim = column === 'variant_color' || column === 'color';
              const isKelvinDim = column === 'color_temperature' || column === 'temp';
              const isStandard = topLevelColumns.includes(column);
              const isNewMode = newModeDims[column];

              let val = '';
              if (isColorDim) val = newVariantData.color || '';
              else if (isKelvinDim) val = newVariantData.color_temperature || '';
              else if (isPrimaryType) val = newVariantData.variant_type || '';
              else if (isStandard) val = newVariantData[column] || '';
              else val = newVariantData.specifications?.[column] || '';
              
              const existingValues = getDimensionValues(column);
              const showDropdown = existingValues.length > 0 && !isNewMode;

              return (
                <div key={column} className={styles.formGroup}>
                  <label>
                    {dim.label} 
                    {isPrimaryType && <span style={{ color: 'var(--brand-neon)', marginLeft: '4px' }}>*</span>}
                  </label>
                  {isPrimaryType ? (
                    !isAddingNewTypeInVariantForm && !isNewMode ? (
                      <select 
                        className={styles.formInput} 
                        value={newVariantData.variant_type || ''} 
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (valStr === '__NEW__') {
                            onSetIsAddingNewType(true);
                            onSetNewVariantData((prev: any) => ({ ...prev, variant_type: '' }));
                          } else {
                            onSetIsAddingNewType(false);
                            onSetNewVariantData((prev: any) => ({ ...prev, variant_type: valStr }));
                          }
                        }}
                      >
                        <option value="">Select {dim.label}</option>
                        {newVariantData.variant_type && !filteredVariantTypes.includes(newVariantData.variant_type) && (
                           <option value={newVariantData.variant_type}>{newVariantData.variant_type}</option>
                        )}
                        {filteredVariantTypes?.map(type => <option key={type} value={type}>{type}</option>)}
                        <option value="__NEW__">+ Add New {dim.label}</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          className={styles.formInput} 
                          value={newVariantData.variant_type} 
                          onChange={e => {
                            const newVal = e.target.value;
                            onSetNewVariantData((prev: any) => ({...prev, variant_type: newVal}));
                          }} 
                          placeholder={`Enter ${dim.label.toLowerCase()}`}
                          autoFocus 
                          style={{ flex: 1 }} 
                        />
                        <button onClick={() => { onSetIsAddingNewType(false); toggleNewMode(column, false); }} className={styles.cancelBtn} style={{ padding: '0 10px', border: '1px solid #333' }}>Cancel</button>
                      </div>
                    )
                  ) : (
                    showDropdown ? (
                      <select
                        className={styles.formInput}
                        value={existingValues.includes(String(val)) ? String(val) : ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '__NEW__') {
                            toggleNewMode(column, true);
                          } else {
                            updateValue(column, v);
                          }
                        }}
                      >
                        <option value="">Select {dim.label}</option>
                        {existingValues.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                        <option value="__NEW__">+ Add New Value</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          className={styles.formInput} 
                          value={val} 
                          onChange={e => updateValue(column, e.target.value)} 
                          placeholder={`e.g. ${dim.label}`} 
                          autoFocus={isNewMode}
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
                    )
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.variantFormActions}>
            <button className={styles.variantCancelBtn} onClick={() => { 
              onSetShowVariantForm(false); 
              onSetEditingVariantId(null); 
              onSetNewVariantData({ variant_type: '', cost_price: 0, selling_price: 0, stock: 0, min_stock_level: 5, color: '', color_temperature: '', description: '', sku: '', notes: '', specifications: {} }); 
            }}>
              Cancel
            </button>
            <button 
              className={styles.variantSaveBtn} 
              onClick={onAddVariant} 
              disabled={isSavingVariant}
              style={{ opacity: isSavingVariant ? 0.7 : 1 }}
            >
              {isSavingVariant ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Loader2 size={16} className={styles.spin} />
                  Saving...
                </div>
              ) : (
                'Save Variant'
              )}
            </button>
          </div>
        </div>
      ) : (
        <button className={styles.addVariantTrigger} onClick={() => onSetShowVariantForm(true)}>
          <Plus size={14} /> Add New Variant
        </button>
      )}
    </div>
  );
}
