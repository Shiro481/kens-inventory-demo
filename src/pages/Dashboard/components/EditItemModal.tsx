import { useState, useEffect } from 'react';
import { Plus, Trash2, Info, Pencil, Tag, X } from 'lucide-react';
import { getCategoryConfig } from '../../../constants/categoryConfig';
import styles from './EditItemModal.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { supabase } from '../../../lib/supabase';

interface EditItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  categories: string[];
  variantTypes?: string[]; 
  allItems?: InventoryItem[]; // New prop to allow filtering types by category
  onClose: () => void;
  onSave: (updatedItem: InventoryItem, variants?: any[]) => void;
}

/**
 * EditItemModal component - Modal for creating and editing inventory items
 */
export default function EditItemModal({ isOpen, item, categories, variantTypes = [], allItems = [], onClose, onSave }: EditItemModalProps) {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewVariantType, setIsNewVariantType] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // --- VARIANT MANAGEMENT STATE ---
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariantData, setNewVariantData] = useState<{ 
    variant_type: string;
    cost_price: number;
    selling_price: number;
    stock: number;
    min_stock_level?: number;
    color: string;
    color_temperature: string | number;
    description: string;
    sku: string;
  }>({ 
    variant_type: '', 
    cost_price: 0, 
    selling_price: 0, 
    stock: 0, 
    min_stock_level: 5,
    color: '',
    color_temperature: '',
    description: '',
    sku: ''
  });
  const [isAddingNewTypeInVariantForm, setIsAddingNewTypeInVariantForm] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);

  useEffect(() => {
    const pid = (item as any)?.uuid;
    if (pid && item?.has_variants && item?.id !== 0) {
        if (!supabase) return;
        supabase.from('product_variants')
          .select('*, variant_definitions(variant_name)')
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
    if (!newVariantData.variant_type) {
        alert('Please fill in the Type/Size field.');
        return;
    }

    if (!supabase) return;

    let variantId: number | null = null;
    const { data: variants } = await supabase
        .from('variant_definitions')
        .select('*')
        .eq('variant_name', newVariantData.variant_type);

    const exactMatch = variants?.find(v => v.variant_name.toLowerCase() === newVariantData.variant_type.toLowerCase());

    if (exactMatch) {
        variantId = exactMatch.id;
    } else {
        const { data: newVariant, error: createError } = await supabase
            .from('variant_definitions')
            .insert({
                base_name: 'Simple Variant', 
                variant_name: newVariantData.variant_type,
                display_name: newVariantData.variant_type, 
                description: `Standard ${newVariantData.variant_type}`,
                compatibility_list: [newVariantData.variant_type],
                is_active: true
            })
            .select()
            .single();
        
        if (createError) {
            alert('Error creating new type: ' + createError.message);
            return;
        }
        variantId = newVariant.id;
    }

    if (!pid || item?.id === 0) {
         const newVar = {
             ...newVariantData,
             id: editingVariantId || Date.now(),
             is_temp: true,
             variant_id: variantId,
             variant_color: newVariantData.color || (newVariantData.color_temperature ? `${newVariantData.color_temperature}K` : null),
             variant_sku: newVariantData.sku || null,
             stock_quantity: Number(newVariantData.stock) || 0,
             min_stock_level: Number(newVariantData.min_stock_level) || 5, 
             variant_type: newVariantData.variant_type,
             variant_definitions: { variant_name: newVariantData.variant_type },
             color_temperature: newVariantData.color_temperature,
             cost_price: Number(newVariantData.cost_price),
             selling_price: Number(newVariantData.selling_price),
             description: newVariantData.description
         };

         if (editingVariantId) {
             setProductVariants(prev => prev.map(v => v.id === editingVariantId ? newVar : v));
         } else {
             setProductVariants(prev => [...prev, newVar]);
         }

         setNewVariantData({ 
             variant_type: '', 
             color_temperature: '', 
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

    let existingProductVariant: any = null;
    if (editingVariantId) {
        existingProductVariant = { id: editingVariantId };
    } else {
        const { data: potentialMatches } = await supabase
            .from('product_variants')
            .select('id, variant_color')
            .eq('product_id', pid)
            .eq('variant_id', variantId);

        const computedColor = newVariantData.color || (newVariantData.color_temperature ? `${newVariantData.color_temperature}K` : null);
        const inputColor = computedColor || '';
        existingProductVariant = potentialMatches?.find((v: any) => (v.variant_color || '') === inputColor);
    }

    let error;
    if (existingProductVariant) {
        const updates: any = {};
        if (newVariantData.variant_type) updates.variant_type = newVariantData.variant_type;
        if (variantId) updates.variant_id = variantId;
        const safeNum = (val: any) => isNaN(Number(val)) ? 0 : Number(val);
        const safeTemp = (val: any) => (val === '' || val === null || val === undefined) ? null : (isNaN(Number(val)) ? null : Number(val));

        if (newVariantData.color_temperature) updates.color_temperature = safeTemp(newVariantData.color_temperature);
        if (newVariantData.cost_price) updates.cost_price = safeNum(newVariantData.cost_price);
        if (newVariantData.selling_price) updates.selling_price = safeNum(newVariantData.selling_price);
        if (newVariantData.stock) updates.stock_quantity = safeNum(newVariantData.stock);
        if (newVariantData.min_stock_level) updates.min_stock_level = safeNum(newVariantData.min_stock_level);
        if (newVariantData.description) updates.description = newVariantData.description;
        if (newVariantData.sku) updates.variant_sku = newVariantData.sku;
        if (newVariantData.color) updates.variant_color = newVariantData.color;

        const { error: updateError } = await supabase
            .from('product_variants')
            .update(updates)
            .eq('id', existingProductVariant.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('product_variants').insert({
            product_id: pid,
            variant_type: newVariantData.variant_type,
            variant_id: variantId,
            color_temperature: String(newVariantData.color_temperature) || null,
            cost_price: Number(newVariantData.cost_price) || 0,
            selling_price: Number(newVariantData.selling_price) || 0,
            stock_quantity: Number(newVariantData.stock) || 0,
            min_stock_level: Number(newVariantData.min_stock_level) || 5,
            variant_color: newVariantData.color || (newVariantData.color_temperature && !isNaN(Number(newVariantData.color_temperature)) ? `${newVariantData.color_temperature}K` : null),
            description: newVariantData.description || null,
            variant_sku: newVariantData.sku || null
        });
        error = insertError;
    }
    
    if (!error) {
        const { data } = await supabase.from('product_variants')
          .select('*, variant_definitions(variant_name)')
          .eq('product_id', pid);
        setProductVariants(data || []);
        setNewVariantData({ 
            variant_type: '', 
            cost_price: 0, 
            selling_price: 0, 
            stock: 0, 
            min_stock_level: 5,
            color: '',
            color_temperature: '',
            description: '',
            sku: ''
        });
        setShowVariantForm(false);
        setEditingVariantId(null);
    } else {
        alert('Error saving variant: ' + error.message);
    }
  };

  const handleDeleteVariant = async (id: number) => {
      if (!confirm('Remove this variant?')) return;
      if (id > 1000000000) {
          setProductVariants(prev => prev.filter(v => v.id !== id));
          return;
      }
      if (!supabase) return;
      const { error } = await supabase.from('product_variants').delete().eq('id', id);
      if (!error) {
          setProductVariants(prev => prev.filter(v => v.id !== id));
      } else {
          alert('Error: ' + error.message);
      }
  };

  useEffect(() => {
    if (item) {
      setEditingItem({ ...item });
      setIsNewCategory(Boolean(item.category && !categories.includes(item.category)));
      setIsNewVariantType(Boolean(item.variant_type && !variantTypes.includes(item.variant_type)));
    }
  }, [item, categories, variantTypes]);

  const config = getCategoryConfig(editingItem?.category);

  // Derive dynamic variant types based on category or inventory
  const filteredVariantTypes = Array.from(new Set([
    ...(config.suggestedVariantTypes || []),
    ...allItems
      .filter(i => i.category === editingItem?.category)
      .map(i => i.variant_type)
      .filter(Boolean) as string[]
  ])).sort();

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && editingItem) {
        const currentTags = editingItem.tags || [];
        if (!currentTags.includes(newTag)) {
          handleInputChange('tags', [...currentTags, newTag]);
        }
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editingItem) {
      const currentTags = editingItem.tags || [];
      handleInputChange('tags', currentTags.filter(t => t !== tagToRemove));
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditingItem(prev => {
      if (!prev) return null;
      if (field.includes('.')) {
        const [obj, key] = field.split('.');
        return {
          ...prev,
          [obj]: { ...((prev as any)[obj] || {}), [key]: value }
        };
      }
      return { ...prev, [field]: value };
    });
  };

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

  const handleTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '__NEW__') {
      setIsNewVariantType(true);
      handleInputChange('variant_type', '');
    } else {
      setIsNewVariantType(false);
      handleInputChange('variant_type', value);
    }
  };

  if (!isOpen || !editingItem) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{item?.id === 0 ? 'Add New Item' : (editingItem.is_variant ? 'Edit Variant' : 'Edit Part')}</h2>
          <button className={styles.closeBtn} onClick={onClose}>X</button>
        </div>
        
        <div className={styles.formGrid}>
          {editingItem.is_variant ? (
              <>
                 <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginBottom: '16px', padding: '12px', background: '#111', border: '1px solid #333', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Parent Product</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                        {editingItem.name.split(' - ')[0]} 
                        <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>({editingItem.brand})</span>
                    </div>
                 </div>

                  <div className={styles.formGroup}>
                     <label>{config.variantTypeLabel}</label>
                     {!isNewVariantType ? (
                       <select 
                         className={styles.formInput}
                         value={variantTypes?.includes(editingItem.variant_type || '') ? editingItem.variant_type : ''}
                         onChange={handleTypeSelect}
                       >
                         <option value="">Select {config.variantTypeLabel}</option>
                         {variantTypes?.map(type => <option key={type} value={type}>{type}</option>)}
                         <option value="__NEW__">+ Add New {config.variantTypeLabel}</option>
                       </select>
                     ) : (
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <input 
                           className={styles.formInput} type="text" autoFocus
                           placeholder={`Enter ${config.variantTypeLabel.toLowerCase()}`}
                           value={editingItem.variant_type || ''}
                           onChange={(e) => handleInputChange('variant_type', e.target.value)}
                           style={{ flex: 1 }}
                         />
                         <button onClick={() => setIsNewVariantType(false)} className={styles.cancelBtn} style={{ padding: '0 10px', border: '1px solid #333' }}>Cancel</button>
                       </div>
                     )}
                  </div>

                  {config.fields.map(field => (
                    <div key={field.key} className={styles.formGroup}>
                      <label>{field.label} {field.suffix ? `(${field.suffix})` : ''}</label>
                      {field.type === 'select' ? (
                        <select
                          className={styles.formInput}
                          value={(field.key.includes('.') ? (editingItem as any)[field.key.split('.')[0]]?.[field.key.split('.')[1]] : (editingItem as any)[field.key]) || ''}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input
                          className={styles.formInput} type={field.type} placeholder={field.placeholder}
                          value={(field.key.includes('.') ? (editingItem as any)[field.key.split('.')[0]]?.[field.key.split('.')[1]] : (editingItem as any)[field.key]) || ''}
                          onChange={(e) => handleInputChange(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                        />
                      )}
                    </div>
                  ))}

                  <div className={styles.formGroup}>
                     <label>Selling Price (₱)</label>
                     <input 
                       className={styles.formInput} type="number" step="0.01"
                       value={editingItem.price !== undefined && editingItem.price !== null && !isNaN(editingItem.price) ? editingItem.price : ''}
                       onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                     />
                  </div>
                  <div className={styles.formGroup}>
                     <label>Cost Price (₱)</label>
                     <input 
                       className={styles.formInput} type="number" step="0.01"
                       value={editingItem.cost_price !== undefined && editingItem.cost_price !== null && !isNaN(editingItem.cost_price) ? editingItem.cost_price : ''}
                       onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value))}
                     />
                  </div>
                  <div className={styles.formGroup}>
                     <label>Current Stock</label>
                     <input 
                       className={styles.formInput} type="number"
                       value={(editingItem.stock !== undefined && editingItem.stock !== null && !isNaN(editingItem.stock)) ? editingItem.stock : (editingItem.quantity !== undefined && !isNaN(editingItem.quantity) ? editingItem.quantity : '')}
                       onChange={(e) => handleInputChange('stock', parseInt(e.target.value))}
                     />
                  </div>
                  <div className={styles.formGroup}>
                     <label>Min Qty (Alert Level)</label>
                     <input 
                       className={styles.formInput} type="number" placeholder="Default: 10"
                       value={editingItem.minQuantity ?? editingItem.min_qty ?? ''}
                       onChange={(e) => {
                         const val = e.target.value;
                         handleInputChange('minQuantity', val === '' ? undefined : parseInt(val));
                         handleInputChange('min_qty', val === '' ? undefined : parseInt(val));
                       }}
                     />
                  </div>
                  <div className={styles.formGroup}>
                     <label>SKU</label>
                     <input className={styles.formInput} type="text" value={editingItem.sku || ''} onChange={(e) => handleInputChange('sku', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                     <label>Internal Notes</label>
                     <textarea className={styles.formInput} rows={2} value={editingItem.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Private notes..." style={{ resize: 'vertical', border: '1px dashed #333' }} />
                  </div>
              </>
          ) : (
              <>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>BASIC INFORMATION</h3>
          </div>
          <div className={styles.formGroup}>
            <label>Part Name *</label>
            <input className={styles.formInput} type="text" value={editingItem.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g. LED Headlight H4" />
          </div>
          <div className={styles.formGroup}>
            <label>Brand</label>
            <input className={styles.formInput} type="text" value={editingItem.brand || ''} onChange={(e) => handleInputChange('brand', e.target.value)} placeholder="e.g. Philips, Osram" />
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Category *</label>
            {!isNewCategory ? (
              <select className={styles.formInput} value={categories.includes(editingItem.category || '') ? editingItem.category : ''} onChange={handleCategorySelect}>
                <option value="">Select Category</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                <option value="__NEW__">+ Create New Category</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input className={styles.formInput} type="text" autoFocus placeholder="Enter new category name" value={editingItem.category || ''} onChange={(e) => handleInputChange('category', e.target.value)} style={{ flex: 1 }} />
                <button onClick={() => setIsNewCategory(false)} className={styles.cancelBtn} style={{ padding: '0 10px', border: '1px solid #333' }}>Cancel</button>
              </div>
            )}
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Description</label>
            <textarea className={styles.formInput} rows={3} value={editingItem.description || ''} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Detailed product description..." style={{ resize: 'vertical' }} />
          </div>
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Internal Notes</label>
            <textarea className={styles.formInput} rows={2} value={editingItem.notes || ''} onChange={(e) => handleInputChange('notes', e.target.value)} placeholder="Private notes..." style={{ resize: 'vertical', border: '1px dashed #333' }} />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={14} /> Tags (Press Enter or comma to add)
            </label>
            <input 
              className={styles.formInput} 
              type="text" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="e.g. promo, seasonal, hot-item" 
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {(editingItem.tags || []).map(tag => (
                <span 
                  key={tag} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: '#00ff9d'
                  }}
                >
                  {tag}
                  <X 
                    size={10} 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => handleRemoveTag(tag)}
                  />
                </span>
              ))}
            </div>
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '16px' }}>
             <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>PRICING & INVENTORY</h3>
          </div>
          <div className={styles.formGroup}><label>SKU</label><input className={styles.formInput} type="text" value={editingItem.sku || ''} onChange={(e) => handleInputChange('sku', e.target.value)} placeholder="Optional" /></div>
          <div className={styles.formGroup}>
            <label>Selling Price (₱) *</label>
            <input className={styles.formInput} type="number" step="0.01" value={editingItem.price !== undefined && editingItem.price !== null && !isNaN(editingItem.price) ? editingItem.price : ''} onChange={(e) => handleInputChange('price', parseFloat(e.target.value))} />
          </div>
          <div className={styles.formGroup}>
            <label>Cost Price (₱)</label>
            <input className={styles.formInput} type="number" step="0.01" value={editingItem.cost_price !== undefined && editingItem.cost_price !== null && !isNaN(editingItem.cost_price) ? editingItem.cost_price : ''} onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value))} />
          </div>
          <div className={styles.formGroup}>
             <label>Current Stock</label>
             <input className={styles.formInput} type="number" value={(editingItem.stock !== undefined && editingItem.stock !== null && !isNaN(editingItem.stock)) ? editingItem.stock : (editingItem.quantity !== undefined && !isNaN(editingItem.quantity) ? editingItem.quantity : '')} onChange={(e) => handleInputChange('stock', parseInt(e.target.value))} />
          </div>
          <div className={styles.formGroup}>
            <label>Min Qty</label>
            <input className={styles.formInput} type="number" placeholder="Default: 10" value={editingItem.minQuantity ?? editingItem.min_qty ?? ''} onChange={(e) => {
              const val = e.target.value;
              handleInputChange('minQuantity', val === '' ? undefined : parseInt(val));
              handleInputChange('min_qty', val === '' ? undefined : parseInt(val));
            }} />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '16px' }}>
             <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>TECHNICAL SPECIFICATIONS</h3>
          </div>
          <div className={styles.formGroup}>
            <label>{config.variantTypeLabel}</label>
            {!isNewVariantType ? (
              <select className={styles.formInput} value={filteredVariantTypes?.includes(editingItem.variant_type || '') ? editingItem.variant_type : ''} onChange={handleTypeSelect}>
                <option value="">Select {config.variantTypeLabel}</option>
                {filteredVariantTypes?.map(type => <option key={type} value={type}>{type}</option>)}
                <option value="__NEW__">+ Add New {config.variantTypeLabel}</option>
              </select>
            ) : (
               <div style={{ display: 'flex', gap: '8px' }}>
                <input className={styles.formInput} type="text" autoFocus placeholder={`Enter ${config.variantTypeLabel.toLowerCase()}`} value={editingItem.variant_type || ''} onChange={(e) => handleInputChange('variant_type', e.target.value)} style={{ flex: 1 }} />
                <button onClick={() => setIsNewVariantType(false)} className={styles.cancelBtn} style={{ padding: '0 10px', border: '1px solid #333' }}>Cancel</button>
              </div>
            )}
          </div>

          {config.fields.map(field => (
            <div key={field.key} className={styles.formGroup}>
              <label>{field.label} {field.suffix ? `(${field.suffix})` : ''}</label>
              {field.type === 'select' ? (
                <select
                  className={styles.formInput}
                  value={(field.key.includes('.') ? (editingItem as any)[field.key.split('.')[0]]?.[field.key.split('.')[1]] : (editingItem as any)[field.key]) || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  className={styles.formInput} type={field.type} placeholder={field.placeholder}
                  value={(field.key.includes('.') ? (editingItem as any)[field.key.split('.')[0]]?.[field.key.split('.')[1]] : (editingItem as any)[field.key]) || ''}
                  onChange={(e) => handleInputChange(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                />
              )}
            </div>
          ))}

          {(!editingItem.category || editingItem.category === 'Headlight' || editingItem.category === 'Fog Light') && (
            <div className={styles.formGroup}>
              <label>Beam Type</label>
              <select className={styles.formInput} value={editingItem.beam_type || ''} onChange={(e) => handleInputChange('beam_type', e.target.value)}>
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
          
          {!editingItem.is_variant && (
            <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid #222', background: '#0a0a0a' }}>
               <input type="checkbox" checked={editingItem.has_variants || false} onChange={(e) => handleInputChange('has_variants', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#00ff9d', cursor: 'pointer' }} id="has_variants_check" />
               <label htmlFor="has_variants_check" style={{ cursor: 'pointer', fontSize: '11px', color: '#fff', margin: 0 }}>Has Variants? (Sizes / Colors / Types)</label>
            </div>
          )}

          {editingItem.has_variants && !editingItem.is_variant && (
              <div className={styles.variantSection}>
                  <div className={styles.variantHeader}><h3>MANAGE VARIANTS <Info size={12} style={{ opacity: 0.3 }} /></h3></div>
                  {(false) ? (
                      <div style={{ padding: '32px', border: '1px dashed #333', color: '#444', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Save Item First To Add Variants</div>
                  ) : (
                      <>
                          {productVariants.length > 0 && (
                            <div className={styles.variantList}>
                                {productVariants.map(v => (
                                    <div key={v.id} className={styles.variantCard}>
                                        <div className={styles.variantInfo}>
                                            <div className={styles.variantInfoMain}>
                                                {v.variant_type || v.variant_definitions?.variant_name || 'Unknown'}
                                                {v.color_temperature && <span className={styles.variantTag}>{v.color_temperature}K</span>}
                                                {v.variant_color && <span className={styles.variantTag} style={{ background: '#222', color: '#00ff9d', border: '1px solid #111' }}>{v.variant_color}</span>}
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
                                            <button className={styles.deleteVariantBtn} onClick={() => {
                                                setEditingVariantId(v.id);
                                                 setNewVariantData({
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
                                                setIsNewVariantType(false);
                                                setShowVariantForm(true);
                                                setTimeout(() => {
                                                    const form = document.querySelector(`.${styles.variantFormContainer}`);
                                                    if (form) form.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            }} title="Edit Variant" style={{ background: '#333', color: '#fff' }}><Pencil size={14} /></button>
                                            <button className={styles.deleteVariantBtn} onClick={() => handleDeleteVariant(v.id)} title="Remove Variant"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                          )}

                          {!showVariantForm ? (
                              <button className={styles.addVariantTrigger} onClick={() => setShowVariantForm(true)}><Plus size={14} /> Add New Variant</button>
                          ) : (
                              <div className={styles.variantFormContainer}>
                                  <h4 className={styles.variantFormHeader}>New Variant Details</h4>
                                  <div className={styles.formGrid}>
                                      <div className={styles.formGroup}>
                                          <label>{config.variantTypeLabel} *</label>
                                          {!isAddingNewTypeInVariantForm ? (
                                            <select 
                                              className={styles.formInput} 
                                              value={filteredVariantTypes?.includes(newVariantData.variant_type) ? newVariantData.variant_type : ''} 
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '__NEW__') {
                                                    setIsAddingNewTypeInVariantForm(true);
                                                    setNewVariantData({ ...newVariantData, variant_type: '', color_temperature: '', cost_price: 0, selling_price: 0, stock: 0, min_stock_level: 5, color: '', description: '', sku: '' });
                                                } else {
                                                    setIsAddingNewTypeInVariantForm(false);
                                                    setNewVariantData(prev => ({ ...prev, variant_type: val }));
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
                                                  onChange={e => setNewVariantData({...newVariantData, variant_type: e.target.value})} 
                                                  placeholder={`Enter ${config.variantTypeLabel.toLowerCase()}`}
                                                  autoFocus 
                                                  style={{ flex: 1 }} 
                                                />
                                                <button onClick={() => setIsAddingNewTypeInVariantForm(false)} className={styles.cancelBtn} style={{ padding: '0 10px', border: '1px solid #333' }}>Cancel</button>
                                            </div>
                                          )}
                                      </div>

                                      {/* Only show Color Temp if relevant to category or if it's default */}
                                      {(config.fields.some(f => f.key === 'color_temperature') || !editingItem.category) && (
                                        <div className={styles.formGroup}>
                                            <label>
                                              {config.fields.find(f => f.key === 'color_temperature')?.label || 'Color Temp'}
                                              {config.fields.find(f => f.key === 'color_temperature')?.suffix ? ` (${config.fields.find(f => f.key === 'color_temperature')?.suffix})` : ''}
                                            </label>
                                            <input 
                                              type={config.fields.find(f => f.key === 'color_temperature')?.type || 'text'}
                                              className={styles.formInput} 
                                              value={newVariantData.color_temperature || ''} 
                                              onChange={e => setNewVariantData({...newVariantData, color_temperature: e.target.value})} 
                                              placeholder={config.fields.find(f => f.key === 'color_temperature')?.placeholder || 'e.g. 6000K'} 
                                            />
                                        </div>
                                      )}

                                      <div className={styles.formGroup}>
                                          <label>Cost Price (₱)</label>
                                          <input type="number" step="0.01" className={styles.formInput} value={newVariantData.cost_price || ''} onChange={e => setNewVariantData({...newVariantData, cost_price: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                                      </div>
                                      <div className={styles.formGroup}>
                                          <label>Selling Price (₱)</label>
                                          <input type="number" step="0.01" className={styles.formInput} value={newVariantData.selling_price || ''} onChange={e => setNewVariantData({...newVariantData, selling_price: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                                      </div>
                                      <div className={styles.formGroup}>
                                          <label>Stock Qty</label>
                                          <input type="number" className={styles.formInput} value={newVariantData.stock || ''} onChange={e => setNewVariantData({...newVariantData, stock: parseInt(e.target.value) || 0})} placeholder="0" />
                                      </div>
                                      <div className={styles.formGroup}>
                                          <label>Min Stock</label>
                                          <input type="number" className={styles.formInput} value={newVariantData.min_stock_level || ''} onChange={e => setNewVariantData({...newVariantData, min_stock_level: parseInt(e.target.value) || 5})} placeholder="5" />
                                      </div>
                                      <div className={styles.formGroup}>
                                          <label>Variant SKU</label>
                                          <input type="text" className={styles.formInput} value={newVariantData.sku} onChange={e => setNewVariantData({...newVariantData, sku: e.target.value})} placeholder="Optional" />
                                      </div>
                                      <div className={styles.formGroup}>
                                          <label>{config.variantTypeLabel === 'Size' ? 'Color' : 'Color / Note'}</label>
                                          <input type="text" className={styles.formInput} value={newVariantData.color} onChange={e => setNewVariantData({...newVariantData, color: e.target.value})} placeholder={config.variantTypeLabel === 'Size' ? 'e.g. Black' : 'e.g. White, or Damaged Box'} />
                                      </div>
                                      <div className={styles.formGroup} style={{ gridColumn: '1/-1' }}>
                                          <label>Description (Optional)</label>
                                          <input type="text" className={styles.formInput} value={newVariantData.description || ''} onChange={e => setNewVariantData({...newVariantData, description: e.target.value})} placeholder="Additional variant details..." />
                                      </div>
                                  </div>
                                  <div className={styles.variantFormActions}>
                                      <button className={styles.variantCancelBtn} onClick={() => { setShowVariantForm(false); setEditingVariantId(null); setNewVariantData({ variant_type: '', cost_price: 0, selling_price: 0, stock: 0, min_stock_level: 5, color: '', color_temperature: '', description: '', sku: '' }); }}>Cancel</button>
                                      <button className={styles.variantSaveBtn} onClick={handleAddVariant} disabled={!newVariantData.variant_type}>Save Variant</button>
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
