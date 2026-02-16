import { useState, useEffect } from 'react';
import styles from './EditItemModal.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { supabase } from '../../../lib/supabase';
import { Trash2, Plus, Info, Pencil } from 'lucide-react';

interface EditItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  categories: string[];
  bulbTypes?: string[]; // New prop for existing bulb types
  onClose: () => void;
  onSave: (updatedItem: InventoryItem, variants?: any[]) => void;
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
  const [newVariantData, setNewVariantData] = useState<{ 
    bulb_type: string;
    color_temperature: number;
    cost_price: number;
    selling_price: number;
    stock: number;
    min_stock_level?: number; // Made optional
    color: string;
    description: string;
    sku: string;
  }>({ 
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
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);




  useEffect(() => {
    const pid = (item as any)?.uuid;
    if (pid && item?.has_variants && item?.id !== 0) {
        if (!supabase) return;
        supabase.from('product_bulb_variants')
          .select('*, bulb_type_variants(variant_name)')
          .eq('product_id', pid)
          .then(({ data }) => {
             setProductVariants(data || []);
          });
    } else {
        setProductVariants([]);
    }
  }, [item]);

  const handleAddVariant = async () => {
    const pid = (editingItem as any)?.uuid;
    if (!newVariantData.bulb_type) {
        alert('Please fill in the Bulb Type field.');
        return;
    }

    if (!supabase) {
        console.error("Supabase client not initialized");
        return;
    }

    // 1. Resolve Variant ID (Find or Create in bulb_type_variants)
    let variantId: number | null = null;
    
    // Check if exists
    // Check if EXACT variant exists
    // We fetch all matching the name to filter properly since unique constraint might not be purely on name
    const { data: variants } = await supabase
        .from('bulb_type_variants')
        .select('*')
        .eq('variant_name', newVariantData.bulb_type);

    // Find exact match (case insensitive but exact string)
    // trying to avoid "H4" matching "H4/Hb2" if using ilike with wildcard (though we used equal before)
    // The main issue was previously we might have matched a "smart" variant.
    const exactMatch = variants?.find(v => v.variant_name.toLowerCase() === newVariantData.bulb_type.toLowerCase());

    if (exactMatch) {
        variantId = exactMatch.id;
    } else {
        // Create new SIMPLE bulb type variant
        const { data: newVariant, error: createError } = await supabase
            .from('bulb_type_variants')
            .insert({
                base_name: 'Simple Bulb', 
                variant_name: newVariantData.bulb_type,
                display_name: newVariantData.bulb_type, // Use exact name
                description: `Standard ${newVariantData.bulb_type}`,
                compatibility_list: [newVariantData.bulb_type],
                is_active: true
            })
            .select()
            .single();
        
        if (createError) {
            alert('Error creating new bulb type: ' + createError.message);
            return;
        }
        variantId = newVariant.id;
    }

    // CHECK FOR NEW ITEM MODE (Local State)
    if (!pid || item?.id === 0) {
         const tempId = Date.now();
         const newVar = {
             ...newVariantData,
             id: tempId,
             is_temp: true,
             variant_id: variantId,
             variant_color: newVariantData.color || (newVariantData.color_temperature ? `${newVariantData.color_temperature}K` : null),
             variant_sku: newVariantData.sku || null,
             stock_quantity: Number(newVariantData.stock) || 0,
             min_stock_level: Number(newVariantData.min_stock_level) || 5, 
             bulb_type: newVariantData.bulb_type,
             bulb_type_variants: { variant_name: newVariantData.bulb_type },
             color_temperature: newVariantData.color_temperature,
             cost_price: Number(newVariantData.cost_price),
             selling_price: Number(newVariantData.selling_price),
             description: newVariantData.description
         };
         setProductVariants(prev => [...prev, newVar]);
         
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
         setEditingVariantId(null);
         return;
    }

    // Check for existing variant
    let existingProductVariant: any = null;

    if (editingVariantId) {
        // EDITING MODE: Directly use the editing ID, don't search for duplicates
        console.log('🔧 [Edit Mode] Updating variant ID:', editingVariantId);
        existingProductVariant = { id: editingVariantId };
    } else {
        // ADD MODE: Search for potential duplicates to prevent creating them
        console.log('➕ [Add Mode] Checking for duplicates...');
        
        // Fetch potentially conflicting variants to check in JS (safer than complex OR queries)
        const { data: potentialMatches } = await supabase
            .from('product_bulb_variants')
            .select('id, variant_color')
            .eq('product_id', pid)
            .eq('variant_id', variantId);

        // Computed color logic to match save logic and prevent treating specific variants as duplicates of generic ones
        const computedColor = newVariantData.color || (newVariantData.color_temperature ? `${newVariantData.color_temperature}K` : null);
        const inputColor = computedColor || '';

        existingProductVariant = potentialMatches?.find((v: any) => {
            const dbColor = v.variant_color || '';
            // Match if colors are identical
            return dbColor === inputColor;
        });
        
        if (existingProductVariant) {
            console.log('⚠️ [Add Mode] Found duplicate variant, will update instead of insert');
        }
    }

    let error;

    if (existingProductVariant) {
        // Update existing - Only update fields that are provided (allow partial updates to avoid wiping data)
        const updates: any = {};
        if (newVariantData.bulb_type) updates.bulb_type = newVariantData.bulb_type;
        
        // Safer numeric casting
        const safeNum = (val: any) => {
            const num = Number(val);
            return isNaN(num) ? 0 : num;
        };
        const safeTemp = (val: any) => {
            if (val === '' || val === null || val === undefined) return null;
            const  n = Number(val);
            return isNaN(n) ? null : n; 
        };

        // Only update if provided (truthy or 0? 0 is falsy, so be careful)
        // newVariantData always initialized with 0 for numbers.
        // But if user wants to set it to 6000, it's 6000.
        // If user leaves it at 0, should we update it to 0? Or leave existing?
        // Logic before was "if (newVariantData.color_temperature)". 0 is falsy.
        // So we only update if non-zero.
        if (newVariantData.color_temperature) updates.color_temperature = safeTemp(newVariantData.color_temperature);
        if (newVariantData.cost_price) updates.cost_price = safeNum(newVariantData.cost_price);
        if (newVariantData.selling_price) updates.selling_price = safeNum(newVariantData.selling_price);
        if (newVariantData.stock) updates.stock_quantity = safeNum(newVariantData.stock);
        if (newVariantData.min_stock_level) updates.min_stock_level = safeNum(newVariantData.min_stock_level);
        
        if (newVariantData.description) updates.description = newVariantData.description;
        if (newVariantData.sku) updates.variant_sku = newVariantData.sku;
        if (newVariantData.color) updates.variant_color = newVariantData.color;

        const { error: updateError } = await supabase
            .from('product_bulb_variants')
            .update(updates)
            .eq('id', existingProductVariant.id);
        error = updateError;
    } else {
        // Insert new
        const { error: insertError } = await supabase.from('product_bulb_variants').insert({
            product_id: pid,
            bulb_type: newVariantData.bulb_type,
            variant_id: variantId,
            color_temperature: typeof newVariantData.color_temperature === 'string' ? (parseFloat(newVariantData.color_temperature) || null) : (newVariantData.color_temperature || null),
            cost_price: Number(newVariantData.cost_price) || 0,
            selling_price: Number(newVariantData.selling_price) || 0,
            stock_quantity: Number(newVariantData.stock) || 0,
            min_stock_level: Number(newVariantData.min_stock_level) || 5,
            variant_color: newVariantData.color || (newVariantData.color_temperature ? `${newVariantData.color_temperature}K` : null),
            description: newVariantData.description || null,
            variant_sku: newVariantData.sku || null
        });
        error = insertError;
    }
    
    if (!error) {
        // Refresh list
        if (supabase) {
          const { data } = await supabase.from('product_bulb_variants')
            .select('*, bulb_type_variants(variant_name)')
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
        setEditingVariantId(null);
    } else {
        alert('Error adding variant: ' + error.message);
    }
  };

  const handleDeleteVariant = async (id: number) => {
      if (!confirm('Remove this variant?')) return;
      
      if (id > 1000000000) {
          setProductVariants(prev => prev.filter(v => v.id !== id));
          return;
      }

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
          <h2>{item?.id === 0 ? 'Add New Item' : (editingItem.is_variant ? 'Edit Variant' : 'Edit Part')}</h2>
          <button className={styles.closeBtn} onClick={onClose}>X</button>
        </div>
        
        <div className={styles.formGrid}>
          {editingItem.is_variant ? (
              // --- VARIANT EDIT MODE: Simplified View ---
              <>
                 <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginBottom: '16px', padding: '12px', background: '#111', border: '1px solid #333', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                        Parent Product
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                        {editingItem.name.split(' - ')[0]} 
                        <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>({editingItem.brand})</span>
                    </div>
                 </div>

                 {/* Variant Essentials */}
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
                    <label>Selling Price ($)</label>
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
                 
                 <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Internal Notes (Variant Color/Note)</label>
                    <textarea 
                      className={styles.formInput} 
                      rows={2}
                      value={editingItem.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Private notes (supplier info, location...)"
                      style={{ resize: 'vertical', border: '1px dashed #333' }}
                    />
                 </div>
              </>
          ) : (
              // --- REGULAR PRODUCT EDIT MODE (Original Form) ---
              <>
          {/* SECTION 1: BASIC INFO */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>
              BASIC INFORMATION
            </h3>
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
            <label>Internal Notes (Variant Color/Note)</label>
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
              value={
                editingItem.minQuantity !== undefined ? editingItem.minQuantity :
                editingItem.min_qty !== undefined ? editingItem.min_qty :
                ''
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || val === null || val === undefined) {
                  handleInputChange('minQuantity', undefined);
                  handleInputChange('min_qty', undefined);
                } else {
                  const num = parseInt(val, 10);
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
                  
                  {(false) ? (
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
                                                {v.bulb_type_variants?.variant_name || v.bulb_type || 'Unknown'}
                                                {v.color_temperature && <span className={styles.variantTag}>{v.color_temperature}K</span>}
                                                {v.variant_color && <span className={styles.variantTag} style={{ background: '#222', color: '#00ff9d', border: '1px solid #111' }}>{v.variant_color}</span>}
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
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                className={styles.deleteVariantBtn} 
                                                onClick={() => {
                                                    // Edit Logic
                                                    setEditingVariantId(v.id);
                                                    setNewVariantData({
                                                        bulb_type: v.bulb_type_variants?.variant_name || v.bulb_type,
                                                        color_temperature: typeof v.color_temperature === 'string' ? parseFloat(v.color_temperature) || 0 : v.color_temperature || 0,
                                                        cost_price: Number(v.cost_price) || 0,
                                                        selling_price: Number(v.selling_price) || 0,
                                                        stock: Number(v.stock_quantity) || 0,
                                                        min_stock_level: Number(v.min_stock_level) || 5,
                                                        color: v.variant_color || '',
                                                        description: v.description || '',
                                                        sku: v.variant_sku || ''
                                                    });
                                                    setIsNewVariantBulbType(false);
                                                    setShowVariantForm(true);
                                                    // Scroll to form
                                                    setTimeout(() => {
                                                        const form = document.querySelector(`.${styles.variantFormContainer}`);
                                                        if (form) form.scrollIntoView({ behavior: 'smooth' });
                                                    }, 100);
                                                }} 
                                                title="Edit Variant"
                                                style={{ background: '#333', color: '#fff' }}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button className={styles.deleteVariantBtn} onClick={() => handleDeleteVariant(v.id)} title="Remove Variant">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
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
                                                        setNewVariantData({
                                                            ...newVariantData, 
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
                                                    } else {
                                                        setIsNewVariantBulbType(false);
                                                        setNewVariantData(prev => ({ ...prev, bulb_type: val }));
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
                                              value={newVariantData.min_stock_level !== undefined && newVariantData.min_stock_level !== null ? newVariantData.min_stock_level : ''}
                                              onChange={e => {
                                                const val = e.target.value;
                                                if (val === '' || val === null || val === undefined) {
                                                  setNewVariantData({...newVariantData, min_stock_level: undefined});
                                                } else {
                                                  const num = parseInt(val, 10);
                                                  setNewVariantData({...newVariantData, min_stock_level: isNaN(num) ? undefined : num});
                                                }
                                              }}
                                              placeholder="Default: 5"
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
                                              setEditingVariantId(null);
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
          </>
          )}
          
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={() => onSave(editingItem, productVariants)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
