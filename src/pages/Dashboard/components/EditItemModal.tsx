import { useState, useEffect } from 'react';
import styles from './EditItemModal.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { supabase } from '../../../lib/supabase';
import { Trash2, Plus, Info } from 'lucide-react';

interface EditItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  categories: string[];
  bulbTypes?: string[]; // New prop for existing bulb types
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
}

/**
 * EditItemModal component - Modal for creating and editing inventory items
 * @param isOpen - Whether the modal is open
 * @param item - The item being edited (null for new item)
 * @param categories - Array of existing categories
 * @param onClose - Callback function to close the modal
 * @param onSave - Callback function to save the updated item
 */
export default function EditItemModal({ isOpen, item, categories, bulbTypes = [], onClose, onSave }: EditItemModalProps) {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewBulbType, setIsNewBulbType] = useState(false);

  // --- VARIANT MANAGEMENT STATE ---

  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariantData, setNewVariantData] = useState({ 
    bulb_type: '', 
    color_temperature: 0, 
    cost_price: 0, 
    selling_price: 0, 
    stock: 0, 
    min_stock_level: 5,
    color: '',
    description: '',
    sku: ''
  });
  const [isNewVariantBulbType, setIsNewVariantBulbType] = useState(false);




  useEffect(() => {
    const pid = (editingItem as any)?.uuid;
    if (pid && editingItem?.has_variants && editingItem?.id !== 0) {
        if (!supabase) return;
        supabase.from('product_bulb_variants')
          .select('*')
          .eq('product_id', pid)
          .then(({ data }) => {
             setProductVariants(data || []);
          });
    } else {
        setProductVariants([]);
    }
  }, [(editingItem as any)?.uuid, editingItem?.has_variants, editingItem?.id]);

  const handleAddVariant = async () => {
    const pid = (editingItem as any)?.uuid;
    if (!newVariantData.bulb_type || !pid) {
        alert('Please fill in the Bulb Type field.');
        return;
    }

    if (!supabase) {
        console.error("Supabase client not initialized");
        return;
    }

    const { error } = await supabase.from('product_bulb_variants').insert({
        product_id: pid,
        bulb_type: newVariantData.bulb_type,
        color_temperature: newVariantData.color_temperature || null,
        cost_price: newVariantData.cost_price,
        selling_price: newVariantData.selling_price,
        stock_quantity: newVariantData.stock,
        min_stock_level: newVariantData.min_stock_level,
        variant_color: newVariantData.color || null,
        description: newVariantData.description || null,
        variant_sku: newVariantData.sku || null,
        variant_id: null // No longer using pre-built variant types
    });
    
    if (!error) {
        // Refresh list
        if (supabase) {
          const { data } = await supabase.from('product_bulb_variants')
            .select('*')
            .eq('product_id', pid);
          setProductVariants(data || []);
        }
        setNewVariantData({ 
            bulb_type: '', 
            color_temperature: 0, 
            cost_price: 0, 
            selling_price: 0, 
            stock: 0, 
            min_stock_level: 5,
            color: '',
            description: '',
            sku: ''
        });
        setShowVariantForm(false);
    } else {
        alert('Error adding variant: ' + error.message);
    }
  };

  const handleDeleteVariant = async (id: number) => {
      if (!confirm('Remove this variant?')) return;
      if (!supabase) return;
      const { error } = await supabase.from('product_bulb_variants').delete().eq('id', id);
      if (!error) {
          setProductVariants(prev => prev.filter(v => v.id !== id));
      } else {
          alert('Error: ' + error.message);
      }
  };
  // -------------------------------

  useEffect(() => {
    if (item) {
      setEditingItem({ ...item });
      // Auto-switch to input mode if category exists but is not in the list
      const hasCategory = item.category && item.category.trim() !== '';
      const categoryInList = categories.includes(item.category || '');
      setIsNewCategory(Boolean(hasCategory && !categoryInList));

      // Auto-switch to input mode if bulb_type exists but is not in the list
      const hasBulbType = item.bulb_type && item.bulb_type.trim() !== '';
      const bulbTypeInList = bulbTypes.includes(item.bulb_type || '');
      setIsNewBulbType(Boolean(hasBulbType && !bulbTypeInList));
    }
  }, [item, categories, bulbTypes]);

  if (!isOpen || !editingItem) return null;

  /**
   * Handle input field changes for the editing item
   * @param field - The field name to update
   * @param value - The new value for the field
   */
  const handleInputChange = (field: keyof InventoryItem, value: string | number | boolean | undefined) => {
    setEditingItem(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  /**
   * Handle category selection from dropdown
   * Switches to text input if "New Category" is selected
   * @param e - Change event from select element
   */
  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__NEW__') {
      setIsNewCategory(true);
      handleInputChange('category', '');
    } else {
      setIsNewCategory(false);
      handleInputChange('category', value);
    }
  };

  /**
   * Handle bulb type selection from dropdown
   */
  const handleBulbTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__NEW__') {
      setIsNewBulbType(true);
      handleInputChange('bulb_type', '');
    } else {
      setIsNewBulbType(false);
      handleInputChange('bulb_type', value);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{item?.id === 0 ? 'Add New Item' : 'Edit Part'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>X</button>
        </div>
        
        <div className={styles.formGrid}>
          {/* SECTION 1: BASIC INFO */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>BASIC INFORMATION</h3>
          </div>

          <div className={styles.formGroup}>
            <label>Part Name *</label>
            <input 
              className={styles.formInput} 
              type="text" 
              value={editingItem.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g. LED Headlight H4"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Brand</label>
            <input 
              className={styles.formInput} 
              type="text" 
              value={editingItem.brand || ''}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              placeholder="e.g. Philips, Osram"
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Category *</label>
            {!isNewCategory ? (
              <select 
                className={styles.formInput}
                value={categories.includes(editingItem.category || '') ? editingItem.category : ''}
                onChange={handleCategorySelect}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__NEW__">+ Create New Category</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  className={styles.formInput} 
                  type="text" 
                  autoFocus
                  placeholder="Enter new category name"
                  value={editingItem.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  onClick={() => setIsNewCategory(false)}
                  className={styles.cancelBtn}
                  style={{ padding: '0 10px', border: '1px solid #333' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Description</label>
            <textarea 
              className={styles.formInput} 
              rows={3}
              value={editingItem.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed product description..."
              style={{ resize: 'vertical' }}
            />
          </div>



          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Internal Notes</label>
            <textarea 
              className={styles.formInput} 
              rows={2}
              value={editingItem.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Private notes (supplier info, location...)"
              style={{ resize: 'vertical', border: '1px dashed #333' }}
            />
          </div>

          {/* SECTION 2: PRICING & INVENTORY */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '16px' }}>
             <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>PRICING & INVENTORY</h3>
          </div>

          <div className={styles.formGroup}>
            <label>SKU</label>
            <input 
              className={styles.formInput} 
              type="text" 
              value={editingItem.sku || ''}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              placeholder="Optional"
            />
          </div>



          <div className={styles.formGroup}>
            <label>Selling Price ($) *</label>
            <input 
              className={styles.formInput} 
              type="number" 
              step="0.01"
              value={editingItem.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Cost Price ($)</label>
            <input 
              className={styles.formInput} 
              type="number" 
              step="0.01"
              value={editingItem.cost_price || ''}
              onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value))}
            />
          </div>

          <div className={styles.formGroup}>
             <label>Current Stock</label>
             <input 
               className={styles.formInput} 
               type="number" 
               value={editingItem.stock ?? editingItem.quantity ?? ''}
               onChange={(e) => handleInputChange('stock', parseInt(e.target.value))}
             />
          </div>

          <div className={styles.formGroup}>
            <label>Min Qty (Alert Level)</label>
            <input 
              className={styles.formInput} 
              type="number" 
              placeholder="Default: 10"
              value={editingItem.minQuantity ?? editingItem.min_qty ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || val === null) {
                  handleInputChange('minQuantity', undefined);
                  handleInputChange('min_qty', undefined);
                } else {
                  const num = parseInt(val);
                  const finalVal = isNaN(num) ? undefined : num;
                  handleInputChange('minQuantity', finalVal);
                  handleInputChange('min_qty', finalVal);
                }
              }}
            />
          </div>

          {/* SECTION 3: TECHNICAL SPECS */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '16px' }}>
             <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>TECHNICAL SPECIFICATIONS</h3>
          </div>

          <div className={styles.formGroup}>
            <label>Bulb Type / Socket</label>
            {!isNewBulbType ? (
              <select 
                className={styles.formInput}
                value={bulbTypes?.includes(editingItem.bulb_type || '') ? editingItem.bulb_type : ''}
                onChange={handleBulbTypeSelect}
              >
                <option value="">Select Socket</option>
                {bulbTypes?.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
                <option value="__NEW__">+ Add New Socket</option>
              </select>
            ) : (
               <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  className={styles.formInput} 
                  type="text" 
                  autoFocus
                  placeholder="Enter new socket type"
                  value={editingItem.bulb_type || ''}
                  onChange={(e) => handleInputChange('bulb_type', e.target.value)}
                  style={{ flex: 1 }}
                />
                <button 
                  onClick={() => setIsNewBulbType(false)}
                  className={styles.cancelBtn}
                  style={{ padding: '0 10px', border: '1px solid #333' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Color Temp (Kelvin)</label>
            <input 
              className={styles.formInput} 
              type="number" 
              value={editingItem.color_temperature || ''}
              onChange={(e) => handleInputChange('color_temperature', parseFloat(e.target.value))}
              placeholder="e.g. 6000"
            />
          </div>





           <div className={styles.formGroup}>
            <label>Lumens</label>
            <input 
              className={styles.formInput} 
              type="number" 
              value={editingItem.lumens || ''}
              onChange={(e) => handleInputChange('lumens', parseInt(e.target.value))}
              placeholder="e.g. 1500"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Beam Type</label>
            <select 
               className={styles.formInput}
               value={editingItem.beam_type || ''}
               onChange={(e) => handleInputChange('beam_type', e.target.value)}
            >
               <option value="">Select Beam</option>
               <option value="Low">Low Beam</option>
               <option value="High">High Beam</option>
               <option value="High/Low">High/Low Combo</option>
               <option value="Fog">Fog Light</option>
               <option value="Signal">Signal/Indicator</option>
               <option value="Interior">Interior</option>
            </select>
          </div>
          
          {!editingItem.is_variant && (
            <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid #222', background: '#0a0a0a' }}>
               <input 
                 type="checkbox" 
                 checked={editingItem.has_variants || false}
                 onChange={(e) => handleInputChange('has_variants', e.target.checked)}
                 style={{ width: '16px', height: '16px', accentColor: '#00ff9d', cursor: 'pointer' }}
                 id="has_variants_check"
               />
               <label htmlFor="has_variants_check" style={{ cursor: 'pointer', fontSize: '11px', color: '#fff', margin: 0 }}>Has Variants? (Sizes / Colors / Types)</label>
            </div>
          )}

          {/* VARIANT MANAGEMENT UI */}
          {editingItem.has_variants && !editingItem.is_variant && (
              <div className={styles.variantSection}>
                  <div className={styles.variantHeader}>
                      <h3>
                        MANAGE VARIANTS 
                        <Info size={12} style={{ opacity: 0.3 }} />
                      </h3>
                  </div>
                  
                  {(!((editingItem as any)?.uuid) || editingItem.id === 0) ? (
                      <div style={{ padding: '32px', border: '1px dashed #333', color: '#444', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>
                          Save Item First To Add Variants
                      </div>
                  ) : (
                      <>
                          {/* List Existing */}
                          {productVariants.length > 0 && (
                            <div className={styles.variantList}>
                                {productVariants.map(v => (
                                    <div key={v.id} className={styles.variantCard}>
                                        <div className={styles.variantInfo}>
                                            <div className={styles.variantInfoMain}>
                                                {v.bulb_type || 'Unknown'}
                                                {v.color_temperature && <span className={styles.variantTag}>{v.color_temperature}K</span>}
                                                {v.variant_color && <span className={styles.variantTag} style={{ background: '#222', color: '#00ff9d', border: '1px solid #111' }}>Note: {v.variant_color}</span>}
                                            </div>
                                            <div className={styles.variantInfoSub}>
                                                STOCK: <span style={{ color: v.stock_quantity < v.min_stock_level ? '#ff4444' : '#888' }}>{v.stock_quantity}</span>
                                                <span style={{ opacity: 0.3, margin: '0 6px' }}>|</span>
                                                SELL: ${v.selling_price?.toFixed(2)}
                                                <span style={{ opacity: 0.3, margin: '0 6px' }}>|</span>
                                                SKU: {v.variant_sku || 'N/A'}
                                            </div>
                                            {v.description && (
                                              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>
                                                "{v.description}"
                                              </div>
                                            )}
                                        </div>
                                        <button className={styles.deleteVariantBtn} onClick={() => handleDeleteVariant(v.id)} title="Remove Variant">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                          )}

                          {/* Add Variant Button or Form */}
                          {!showVariantForm ? (
                              <button 
                                  className={styles.addVariantTrigger}
                                  onClick={() => setShowVariantForm(true)}
                              >
                                  <Plus size={14} /> Add New Variant
                              </button>
                          ) : (
                              <div className={styles.variantFormContainer}>
                                  <h4 className={styles.variantFormHeader}>New Variant Details</h4>
                                  
                                  <div className={styles.formGrid}>
                                      <div className={styles.formGroup}>
                                          <label>Bulb Type / Socket *</label>
                                          {!isNewVariantBulbType ? (
                                            <select 
                                                className={styles.formInput}
                                                value={bulbTypes?.includes(newVariantData.bulb_type) ? newVariantData.bulb_type : ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === '__NEW__') {
                                                        setIsNewVariantBulbType(true);
                                                        setNewVariantData({...newVariantData, bulb_type: ''});
                                                    } else {
                                                        setIsNewVariantBulbType(false);
                                                        setNewVariantData({...newVariantData, bulb_type: val});
                                                    }
                                                }}
                                            >
                                                <option value="">Select Socket</option>
                                                {bulbTypes?.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                                <option value="__NEW__">+ Add New Socket</option>
                                            </select>
                                          ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input 
                                                    type="text"
                                                    className={styles.formInput}
                                                    value={newVariantData.bulb_type}
                                                    onChange={e => setNewVariantData({...newVariantData, bulb_type: e.target.value})}
                                                    placeholder="e.g. H4, H7"
                                                    autoFocus
                                                    style={{ flex: 1 }}
                                                />
                                                <button 
                                                    onClick={() => setIsNewVariantBulbType(false)}
                                                    className={styles.cancelBtn}
                                                    style={{ padding: '0 10px', border: '1px solid #333' }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                          )}
                                      </div>

                                      <div className={styles.formGroup}>
                                          <label>Color Temp (K)</label>
                                          <input 
                                              type="number"
                                              className={styles.formInput}
                                              value={newVariantData.color_temperature || ''}
                                              onChange={e => setNewVariantData({...newVariantData, color_temperature: parseFloat(e.target.value) || 0})}
                                              placeholder="e.g. 6000"
                                          />
                                      </div>

                                      <div className={styles.formGroup}>
                                          <label>Cost Price ($)</label>
                                          <input 
                                              type="number"
                                              step="0.01"
                                              className={styles.formInput}
                                              value={newVariantData.cost_price || ''}
                                              onChange={e => setNewVariantData({...newVariantData, cost_price: parseFloat(e.target.value) || 0})}
                                              placeholder="0.00"
                                          />
                                      </div>

                                      <div className={styles.formGroup}>
                                          <label>Selling Price ($)</label>
                                          <input 
                                              type="number"
                                              step="0.01"
                                              className={styles.formInput}
                                              value={newVariantData.selling_price || ''}
                                              onChange={e => setNewVariantData({...newVariantData, selling_price: parseFloat(e.target.value) || 0})}
                                              placeholder="0.00"
                                          />
                                      </div>

                                      <div className={styles.formGroup}>
                                          <label>Stock Qty</label>
                                          <input 
                                              type="number"
                                              className={styles.formInput}
                                              value={newVariantData.stock || ''}
                                              onChange={e => setNewVariantData({...newVariantData, stock: parseInt(e.target.value) || 0})}
                                              placeholder="0"
                                          />
                                      </div>

                                      <div className={styles.formGroup}>
                                          <label>Min Stock</label>
                                          <input 
                                              type="number"
                                              className={styles.formInput}
                                              value={newVariantData.min_stock_level || ''}
                                              onChange={e => setNewVariantData({...newVariantData, min_stock_level: parseInt(e.target.value) || 5})}
                                              placeholder="5"
                                          />
                                      </div>

                                      <div className={styles.formGroup}>
                                          <label>Variant SKU</label>
                                          <input 
                                              type="text"
                                              className={styles.formInput}
                                              value={newVariantData.sku}
                                              onChange={e => setNewVariantData({...newVariantData, sku: e.target.value})}
                                              placeholder="Optional"
                                          />
                                      </div>

                                      <div className={styles.formGroup}>
                                          <label>Variant Note / Color</label>
                                          <input 
                                              type="text"
                                              className={styles.formInput}
                                              value={newVariantData.color}
                                              onChange={e => setNewVariantData({...newVariantData, color: e.target.value})}
                                              placeholder="e.g. White, or Damaged Box"
                                          />
                                      </div>

                                      <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
                                          <label>Description (Optional)</label>
                                          <input 
                                              type="text"
                                              className={styles.formInput}
                                              value={newVariantData.description || ''}
                                              onChange={e => setNewVariantData({...newVariantData, description: e.target.value})}
                                              placeholder="Additional variant details..."
                                          />
                                      </div>
                                  </div>

                                  <div className={styles.variantFormActions}>
                                      <button 
                                          className={styles.variantCancelBtn}
                                          onClick={() => {
                                              setShowVariantForm(false);
                                              setNewVariantData({ 
                                                  bulb_type: '', 
                                                  color_temperature: 0, 
                                                  cost_price: 0, 
                                                  selling_price: 0, 
                                                  stock: 0, 
                                                  min_stock_level: 5,
                                                  color: '',
                                                  description: '',
                                                  sku: ''
                                              });
                                          }}
                                      >
                                          Cancel
                                      </button>
                                      <button 
                                          className={styles.variantSaveBtn}
                                          onClick={handleAddVariant}
                                          disabled={!newVariantData.bulb_type}
                                      >
                                          Save Variant
                                      </button>
                                  </div>
                              </div>
                          )}
                      </>
                  )}
              </div>
          )}
          
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={() => onSave(editingItem)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
