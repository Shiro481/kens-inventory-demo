import { Info, Plus, Pencil, Trash2 } from 'lucide-react';
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
  onSetNewVariantData: (data: any) => void;
  onSetIsAddingNewType: (val: boolean) => void;
  onSetEditingVariantId: (id: number | null) => void;
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
  onSetEditingVariantId
}: VariantManagerProps) {
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
                <div className={styles.variantInfoMain} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {config.variantDimensions?.filter((d: any) => d.active).map((dim: any) => {
                    let val = null;
                    const isTypeColumn = dim.column === 'variant_type' || dim.column === 'socket';
                    if (isTypeColumn) {
                      val = v.variant_type || v.variant_definitions?.variant_name || getParsedSpecs(v.specifications)?.socket;
                    } else if (dim.column === 'variant_color' || dim.column === 'color') {
                      val = v.variant_color || getParsedSpecs(v.specifications)?.color;
                    } else if (dim.column === 'color_temperature' || dim.column === 'temp') {
                      val = v.color_temperature || getParsedSpecs(v.specifications)?.color_temperature || getParsedSpecs(v.specifications)?.temp;
                    } else {
                      val = getParsedSpecs(v.specifications)?.[dim.column];
                    }
                    
                    if (!val) return null;
                    return (
                      <span key={dim.column} className={styles.variantTag} style={!isTypeColumn ? { background: '#222', color: '#00ff9d', border: '1px solid #111' } : {}}>
                        <span style={{ opacity: 0.5, fontSize: '9px', marginRight: '4px' }}>{dim.label.toUpperCase()}:</span>
                        {dim.column === 'color_temperature' && !val.toString().endsWith('K') && !isNaN(Number(val)) ? `${val}K` : val}
                      </span>
                    );
                  })}
                  {!config.variantDimensions && (
                    <>
                      {v.variant_type || v.variant_definitions?.variant_name || 'Unknown'}
                      {v.color_temperature && <span className={styles.variantTag}>{v.color_temperature}K</span>}
                      {v.variant_color && <span className={styles.variantTag} style={{ background: '#222', color: '#00ff9d', border: '1px solid #111' }}>{v.variant_color}</span>}
                    </>
                  )}
                </div>
                <div className={styles.variantInfoSub}>
                  STOCK: <span style={{ color: v.stock_quantity < v.min_stock_level ? '#ff4444' : '#888' }}>{v.stock_quantity}</span>
                  <span style={{ opacity: 0.3, margin: '0 6px' }}>|</span>
                  SELL: ₱{v.selling_price?.toFixed(2)}
                  <span style={{ opacity: 0.3, margin: '0 6px' }}>|</span>
                  SKU: {v.variant_sku || 'N/A'}
                </div>
                {v.description && <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>"{v.description}"</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={styles.deleteVariantBtn} 
                  onClick={() => {
                    onSetEditingVariantId(v.id);
                    onSetNewVariantData({
                      variant_type: v.variant_definitions?.variant_name || v.variant_type || '',
                      cost_price: Number(v.cost_price) || 0,
                      selling_price: Number(v.selling_price) || 0,
                      stock: Number(v.stock_quantity) || 0,
                      min_stock_level: Number(v.min_stock_level) || 5,
                      color: v.variant_color || '',
                      color_temperature: v.color_temperature || '',
                      description: v.description || '',
                      sku: v.variant_sku || '',
                      notes: getParsedSpecs(v.specifications)?.internal_notes || '',
                      specifications: getParsedSpecs(v.specifications)
                    });
                    onSetIsAddingNewType(false);
                    onSetShowVariantForm(true);
                  }} 
                  title="Edit Variant" 
                  style={{ background: '#333', color: '#fff' }}
                >
                  <Pencil size={14} />
                </button>
                <button 
                  className={styles.deleteVariantBtn} 
                  onClick={() => onDeleteVariant(v.id)} 
                  title="Remove Variant"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showVariantForm ? (
        <button className={styles.addVariantTrigger} onClick={() => onSetShowVariantForm(true)}>
          <Plus size={14} /> Add New Variant
        </button>
      ) : (
        <div className={styles.variantFormContainer}>
          <h4 className={styles.variantFormHeader}>Variant Details</h4>
            {/* Dynamic Dimensions */}
            {(config.variantDimensions && config.variantDimensions.length > 0) ? (
              <>
                {/* Dimensions Loop */}
                {config.variantDimensions.filter((d: any) => d.active).map((dim: any) => {
                  const normalizedDimLabel = dim.label.toLowerCase().replace(':', '').trim();
                  const normalizedTypeLabel = (config.variantTypeLabel || 'Variant Type').toLowerCase().replace(':', '').trim();
                  const isPrimaryType = dim.column === 'variant_type' || dim.column === 'socket' || normalizedDimLabel === normalizedTypeLabel;
                  
                  let val = '';
                  if (dim.column === 'variant_color' || dim.column === 'color') val = newVariantData.color || '';
                  else if (dim.column === 'color_temperature' || dim.column === 'temp') val = newVariantData.color_temperature || '';
                  else if (isPrimaryType) val = newVariantData.variant_type || '';
                  else val = newVariantData.specifications?.[dim.column] || '';
                  
                  return (
                    <div key={dim.column} className={styles.formGroup}>
                      <label>
                        {dim.label} 
                        {isPrimaryType && <span style={{ color: 'var(--brand-neon)', marginLeft: '4px' }}>*</span>}
                      </label>
                      {isPrimaryType ? (
                        !isAddingNewTypeInVariantForm ? (
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
                            <button onClick={() => onSetIsAddingNewType(false)} className={styles.cancelBtn} style={{ padding: '0 10px', border: '1px solid #333' }}>Cancel</button>
                          </div>
                        )
                      ) : (
                        <input 
                          type="text" 
                          className={styles.formInput} 
                          value={val} 
                          onChange={e => {
                            const newVal = e.target.value;
                            if (dim.column === 'variant_color' || dim.column === 'color') {
                              onSetNewVariantData((prev: any) => ({...prev, color: newVal}));
                            } else if (dim.column === 'color_temperature' || dim.column === 'temp') {
                              onSetNewVariantData((prev: any) => ({...prev, color_temperature: newVal}));
                            } else {
                              onSetNewVariantData((prev: any) => ({
                                ...prev, 
                                specifications: { 
                                  ...(prev.specifications || {}), 
                                  [dim.column]: newVal 
                                }
                              }));
                            }
                          }} 
                          placeholder={`e.g. ${dim.label}`} 
                        />
                      )}
                    </div>
                  );
                })}

                {/* Secondary safety check: Only show if NO dimension matches the primary type by column OR relaxed label match */}
                {!config.variantDimensions.some((d: any) => {
                   if (!d.active) return false;
                   const normalizedDLabel = d.label.toLowerCase().replace(':', '').trim();
                   const normalizedTLabel = (config.variantTypeLabel || 'Variant Type').toLowerCase().replace(':', '').trim();
                   return d.column === 'variant_type' || normalizedDLabel === normalizedTLabel;
                 }) && (
                   <div className={styles.formGroup}>
                      <label>{config.variantTypeLabel || 'Variant Type'} <span style={{ color: 'var(--brand-neon)' }}>*</span></label>
                      <input 
                        type="text" 
                        className={styles.formInput} 
                        value={newVariantData.variant_type} 
                        onChange={e => {
                          const newVal = e.target.value;
                          onSetNewVariantData((prev: any) => ({...prev, variant_type: newVal}));
                        }} 
                        placeholder="e.g. H1, Standard, Large..." 
                      />
                   </div>
                )}
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label>{config.variantTypeLabel} <span style={{ color: 'var(--brand-neon)' }}>*</span></label>
                  {!isAddingNewTypeInVariantForm ? (
                    <select 
                      className={styles.formInput} 
                      value={newVariantData.variant_type || ''} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__NEW__') {
                          onSetIsAddingNewType(true);
                          onSetNewVariantData((prev: any) => ({ ...prev, variant_type: '' }));
                        } else {
                          onSetIsAddingNewType(false);
                          onSetNewVariantData((prev: any) => ({ ...prev, variant_type: val }));
                        }
                      }}
                    >
                      <option value="">Select {config.variantTypeLabel}</option>
                      {newVariantData.variant_type && !filteredVariantTypes.includes(newVariantData.variant_type) && (
                         <option value={newVariantData.variant_type}>{newVariantData.variant_type}</option>
                      )}
                      {filteredVariantTypes?.map(type => <option key={type} value={type}>{type}</option>)}
                      <option value="__NEW__">+ Add New {config.variantTypeLabel}</option>
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
                        placeholder={`Enter ${config.variantTypeLabel.toLowerCase()}`}
                        autoFocus 
                        style={{ flex: 1 }} 
                      />
                      <button onClick={() => onSetIsAddingNewType(false)} className={styles.cancelBtn} style={{ padding: '0 10px', border: '1px solid #333' }}>Cancel</button>
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Color / Notes</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    value={newVariantData.color} 
                    onChange={e => {
                      const newVal = e.target.value;
                      onSetNewVariantData((prev: any) => ({...prev, color: newVal}));
                    }} 
                    placeholder="e.g. Black" 
                  />
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label>Cost Price (₱)</label>
              <input type="number" step="0.01" className={styles.formInput} value={newVariantData.cost_price || ''} onChange={e => { const val = e.target.value; onSetNewVariantData((prev: any) => ({...prev, cost_price: val === '' ? 0 : parseFloat(val)})); }} placeholder="0.00" />
            </div>
            <div className={styles.formGroup}>
              <label>Selling Price (₱)</label>
              <input type="number" step="0.01" className={styles.formInput} value={newVariantData.selling_price || ''} onChange={e => { const val = e.target.value; onSetNewVariantData((prev: any) => ({...prev, selling_price: val === '' ? 0 : parseFloat(val)})); }} placeholder="0.00" />
            </div>
            <div className={styles.formGroup}>
              <label>Stock Qty</label>
              <input type="number" className={styles.formInput} value={newVariantData.stock || ''} onChange={e => { const val = e.target.value; onSetNewVariantData((prev: any) => ({...prev, stock: val === '' ? 0 : parseInt(val)})); }} placeholder="0" />
            </div>
            <div className={styles.formGroup}>
              <label>Min Stock</label>
              <input type="number" className={styles.formInput} value={newVariantData.min_stock_level || ''} onChange={e => { const val = e.target.value; onSetNewVariantData((prev: any) => ({...prev, min_stock_level: val === '' ? 5 : parseInt(val)})); }} placeholder="5" />
            </div>
            <div className={styles.formGroup}>
              <label>Variant SKU</label>
              <input type="text" className={styles.formInput} value={newVariantData.sku} onChange={e => { const val = e.target.value; onSetNewVariantData((prev: any) => ({...prev, sku: val})); }} placeholder="Optional" />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
              <label>Description (Optional)</label>
              <input type="text" className={styles.formInput} value={newVariantData.description || ''} onChange={e => { const val = e.target.value; onSetNewVariantData((prev: any) => ({...prev, description: val})); }} placeholder="Additional details..." />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
              <label>Internal Notes (Private)</label>
              <textarea 
                className={styles.formInput} 
                rows={2} 
                value={newVariantData.notes || ''} 
                onChange={e => { const val = e.target.value; onSetNewVariantData((prev: any) => ({...prev, notes: val})); }}
                placeholder="Private notes for this variant..." 
                style={{ resize: 'vertical', border: '1px dashed #333' }}
              />
            </div>
          <div className={styles.variantFormActions}>
            <button className={styles.variantCancelBtn} onClick={() => { onSetShowVariantForm(false); onSetEditingVariantId(null); onSetNewVariantData({ variant_type: '', cost_price: 0, selling_price: 0, stock: 0, min_stock_level: 5, color: '', color_temperature: '', description: '', sku: '', notes: '', specifications: {} }); }}>Cancel</button>
            <button 
              className={styles.variantSaveBtn} 
              onClick={onAddVariant} 
              style={{ width: '100%' }}
            >
              Save Variant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
