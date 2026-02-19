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
                    const val = dim.column === 'variant_type' ? (v.variant_type || v.variant_definitions?.variant_name) :
                                dim.column === 'variant_color' ? v.variant_color :
                                dim.column === 'color_temperature' ? v.color_temperature : null;
                    if (!val) return null;
                    return (
                      <span key={dim.column} className={styles.variantTag} style={dim.column !== 'variant_type' ? { background: '#222', color: '#00ff9d', border: '1px solid #111' } : {}}>
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
                      sku: v.variant_sku || ''
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
            {config.variantDimensions?.filter((d: any) => d.active).map((dim: any) => {
              const val = dim.column === 'variant_color' ? newVariantData.color : 
                          dim.column === 'color_temperature' ? newVariantData.color_temperature : '';
              
              return (
                <div key={dim.column} className={styles.formGroup}>
                  <label>{dim.label} *</label>
                  {dim.column === 'variant_type' ? (
                    !isAddingNewTypeInVariantForm ? (
                      <select 
                        className={styles.formInput} 
                        value={filteredVariantTypes?.includes(newVariantData.variant_type) ? newVariantData.variant_type : ''} 
                        onChange={(e) => {
                          const valStr = e.target.value;
                          if (valStr === '__NEW__') {
                            onSetIsAddingNewType(true);
                            onSetNewVariantData({ ...newVariantData, variant_type: '' });
                          } else {
                            onSetIsAddingNewType(false);
                            onSetNewVariantData((prev: any) => ({ ...prev, variant_type: valStr }));
                          }
                        }}
                      >
                        <option value="">Select {dim.label}</option>
                        {filteredVariantTypes?.map(type => <option key={type} value={type}>{type}</option>)}
                        <option value="__NEW__">+ Add New {dim.label}</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          className={styles.formInput} 
                          value={newVariantData.variant_type} 
                          onChange={e => onSetNewVariantData({...newVariantData, variant_type: e.target.value})} 
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
                        const field = dim.column === 'variant_color' ? 'color' : 'color_temperature';
                        onSetNewVariantData({...newVariantData, [field]: e.target.value});
                      }} 
                      placeholder={`e.g. ${dim.label}`} 
                    />
                  )}
                </div>
              );
            })}

            {/* Fallback for legacy categories without dimension metadata */}
            {!config.variantDimensions && (
              <>
                <div className={styles.formGroup}>
                  <label>{config.variantTypeLabel} *</label>
                  {!isAddingNewTypeInVariantForm ? (
                    <select 
                      className={styles.formInput} 
                      value={filteredVariantTypes?.includes(newVariantData.variant_type) ? newVariantData.variant_type : ''} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__NEW__') {
                          onSetIsAddingNewType(true);
                          onSetNewVariantData({ ...newVariantData, variant_type: '' });
                        } else {
                          onSetIsAddingNewType(false);
                          onSetNewVariantData((prev: any) => ({ ...prev, variant_type: val }));
                        }
                      }}
                    >
                      <option value="">Select {config.variantTypeLabel}</option>
                      {filteredVariantTypes?.map(type => <option key={type} value={type}>{type}</option>)}
                      <option value="__NEW__">+ Add New {config.variantTypeLabel}</option>
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className={styles.formInput} 
                        value={newVariantData.variant_type} 
                        onChange={e => onSetNewVariantData({...newVariantData, variant_type: e.target.value})} 
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
                  <input type="text" className={styles.formInput} value={newVariantData.color} onChange={e => onSetNewVariantData({...newVariantData, color: e.target.value})} placeholder="e.g. Black" />
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label>Cost Price (₱)</label>
              <input type="number" step="0.01" className={styles.formInput} value={newVariantData.cost_price || ''} onChange={e => onSetNewVariantData({...newVariantData, cost_price: e.target.value === '' ? 0 : parseFloat(e.target.value)})} placeholder="0.00" />
            </div>
            <div className={styles.formGroup}>
              <label>Selling Price (₱)</label>
              <input type="number" step="0.01" className={styles.formInput} value={newVariantData.selling_price || ''} onChange={e => onSetNewVariantData({...newVariantData, selling_price: e.target.value === '' ? 0 : parseFloat(e.target.value)})} placeholder="0.00" />
            </div>
            <div className={styles.formGroup}>
              <label>Stock Qty</label>
              <input type="number" className={styles.formInput} value={newVariantData.stock || ''} onChange={e => onSetNewVariantData({...newVariantData, stock: e.target.value === '' ? 0 : parseInt(e.target.value)})} placeholder="0" />
            </div>
            <div className={styles.formGroup}>
              <label>Min Stock</label>
              <input type="number" className={styles.formInput} value={newVariantData.min_stock_level || ''} onChange={e => onSetNewVariantData({...newVariantData, min_stock_level: e.target.value === '' ? 5 : parseInt(e.target.value)})} placeholder="5" />
            </div>
            <div className={styles.formGroup}>
              <label>Variant SKU</label>
              <input type="text" className={styles.formInput} value={newVariantData.sku} onChange={e => onSetNewVariantData({...newVariantData, sku: e.target.value})} placeholder="Optional" />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
              <label>Description (Optional)</label>
              <input type="text" className={styles.formInput} value={newVariantData.description || ''} onChange={e => onSetNewVariantData({...newVariantData, description: e.target.value})} placeholder="Additional details..." />
            </div>
          <div className={styles.variantFormActions}>
            <button className={styles.variantCancelBtn} onClick={() => { onSetShowVariantForm(false); onSetEditingVariantId(null); onSetNewVariantData({ variant_type: '', cost_price: 0, selling_price: 0, stock: 0, min_stock_level: 5, color: '', color_temperature: '', description: '', sku: '' }); }}>Cancel</button>
            <button className={styles.variantSaveBtn} onClick={onAddVariant} disabled={!newVariantData.variant_type}>Save Variant</button>
          </div>
        </div>
      )}
    </div>
  );
}
