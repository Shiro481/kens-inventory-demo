import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCategoryMetadata } from '../../../hooks/useCategoryMetadata';
import styles from './EditItemModal.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { supabase } from '../../../lib/supabase';

// Sub-components
import BasicInfoSection from './EditItemModalSub/BasicInfoSection';
import PricingInventorySection from './EditItemModalSub/PricingInventorySection';
import TechnicalSpecsSection from './EditItemModalSub/TechnicalSpecsSection';
import TagManager from './EditItemModalSub/TagManager';
import VariantManager from './EditItemModalSub/VariantManager';
import DescriptionNotesSection from './EditItemModalSub/DescriptionNotesSection';
import ModeSelection from './EditItemModalSub/ModeSelection';

interface EditItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  categories: string[];
  variantTypes?: string[]; 
  allItems?: InventoryItem[];
  onClose: () => void;
  onSave: (updatedItem: InventoryItem, variants?: any[]) => void;
  suppliers: string[];
}

export default function EditItemModal({ 
  isOpen, item, categories, variantTypes = [], allItems = [], onClose, onSave, suppliers = [] 
}: EditItemModalProps) {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isNewVariantType, setIsNewVariantType] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // --- VARIANT MANAGEMENT STATE ---
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariantData, setNewVariantData] = useState<any>({ 
    variant_type: '', cost_price: 0, selling_price: 0, stock: 0, 
    min_stock_level: 5, color: '', color_temperature: '', description: '', sku: '' 
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

  useEffect(() => {
    if (item) {
      setEditingItem({ ...item });
      setIsNewVariantType(Boolean(item.variant_type && !variantTypes.includes(item.variant_type)));
    }
  }, [item, categories, variantTypes]);

  const { config } = useCategoryMetadata(editingItem?.category);

  const filteredVariantTypes = Array.from(new Set([
    ...(config.suggestedVariantTypes || []),
    ...allItems
      .filter(i => i.category === editingItem?.category)
      .map(i => i.variant_type)
      .filter(Boolean) as string[]
  ])).sort();

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

  const handleAddVariant = async () => {
    const pid = (editingItem as any)?.uuid;
    if (!newVariantData.variant_type || !supabase) return;

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
        
        if (createError) return alert('Error creating new type: ' + createError.message);
        variantId = newVariant.id;
    }

    if (!pid || item?.id === 0) {
         const newVar = {
             ...newVariantData,
             id: editingVariantId || Date.now(),
             is_temp: true,
             variant_id: variantId,
             variant_color: newVariantData.color || null,
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
            variant_type: '', color_temperature: '', cost_price: 0, 
            selling_price: 0, stock: 0, min_stock_level: 5, color: '', description: '', sku: '' 
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
        existingProductVariant = potentialMatches?.find((v: any) => (v.variant_color || '') === (computedColor || ''));
    }

    const updates: any = {
      variant_type: newVariantData.variant_type,
      variant_id: variantId,
      color_temperature: String(newVariantData.color_temperature) || null,
      cost_price: Number(newVariantData.cost_price) || 0,
      selling_price: Number(newVariantData.selling_price) || 0,
      stock_quantity: Number(newVariantData.stock) || 0,
      min_stock_level: Number(newVariantData.min_stock_level) || 5,
      variant_color: newVariantData.color || null,
      description: newVariantData.description || null,
      variant_sku: newVariantData.sku || null
    };

    let error;
    if (existingProductVariant) {
        const { error: updateError } = await supabase.from('product_variants').update(updates).eq('id', existingProductVariant.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('product_variants').insert({ ...updates, product_id: pid });
        error = insertError;
    }
    
    if (!error) {
        const { data } = await supabase.from('product_variants').select('*, variant_definitions(variant_name)').eq('product_id', pid);
        setProductVariants(data || []);
        setShowVariantForm(false);
        setEditingVariantId(null);
        setNewVariantData({ 
            variant_type: '', cost_price: 0, selling_price: 0, stock: 0, min_stock_level: 5, 
            color: '', color_temperature: '', description: '', sku: '' 
        });
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
      if (!error) setProductVariants(prev => prev.filter(v => v.id !== id));
      else alert('Error: ' + error.message);
  };

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

  if (!isOpen || !editingItem) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{item?.id === 0 ? 'Add New Item' : (editingItem.is_variant ? `Edit Variant: ${editingItem.variant_type}` : 'Edit Part')}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className={styles.formGrid}>
          {editingItem.is_variant ? (
            <>
              <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginBottom: '16px', padding: '12px', background: '#111', border: '1px solid #333', borderRadius: '4px' }}>
                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Parent Product</div>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>
                    {editingItem.name} 
                    <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>({editingItem.brand})</span>
                </div>
              </div>

              <TechnicalSpecsSection 
                editingItem={editingItem} config={config} filteredVariantTypes={filteredVariantTypes}
                isNewVariantType={isNewVariantType} onInputChange={handleInputChange}
                onTypeSelect={(e) => {
                  const val = e.target.value;
                  if (val === '__NEW__') { setIsNewVariantType(true); handleInputChange('variant_type', ''); }
                  else { setIsNewVariantType(false); handleInputChange('variant_type', val); }
                }}
                onSetIsNewVariantType={setIsNewVariantType}
              />

              <PricingInventorySection editingItem={editingItem} onInputChange={handleInputChange} />
              <DescriptionNotesSection editingItem={editingItem} onInputChange={handleInputChange} />
            </>
          ) : (
            <>
              <BasicInfoSection 
                editingItem={editingItem!} 
                categories={categories}
                suppliers={suppliers}
                onInputChange={handleInputChange} 
                onCategorySelect={(e) => {
                  const val = e.target.value;
                  handleInputChange('category', val);
                }}
              />

              {item?.id === 0 && (
                <div className={styles.fullWidth} style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'block' }}>Product Type</label>
                  <ModeSelection 
                    hasVariants={editingItem.has_variants || false}
                    onModeChange={(hasVars) => handleInputChange('has_variants', hasVars)}
                  />
                </div>
              )}

              {!editingItem.has_variants && (
                <TechnicalSpecsSection 
                  editingItem={editingItem} config={config} filteredVariantTypes={filteredVariantTypes}
                  isNewVariantType={isNewVariantType} onInputChange={handleInputChange}
                  onTypeSelect={(e) => {
                    const val = e.target.value;
                    if (val === '__NEW__') { setIsNewVariantType(true); handleInputChange('variant_type', ''); }
                    else { setIsNewVariantType(false); handleInputChange('variant_type', val); }
                  }}
                  onSetIsNewVariantType={setIsNewVariantType}
                />
              )}

              {editingItem.has_variants && (
                <div className={styles.fullWidth} style={{ background: 'rgba(0, 255, 157, 0.05)', padding: '12px', border: '1px solid rgba(0, 255, 157, 0.1)', borderRadius: '4px', margin: '16px 0' }}>
                   <div style={{ fontSize: '10px', color: '#00ff9d', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Family Mode Active</div>
                   <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Technical details (Socket, Color, Price) will be managed below for each variant.</div>
                </div>
              )}

              {!editingItem.has_variants && (
                 <PricingInventorySection editingItem={editingItem} onInputChange={handleInputChange} />
              )}

              <DescriptionNotesSection editingItem={editingItem} onInputChange={handleInputChange} />

              <TagManager 
                tags={editingItem.tags || []} tagInput={tagInput}
                onTagInputChange={setTagInput} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag}
              />


              {editingItem.has_variants && (
                <VariantManager 
                  productVariants={productVariants} showVariantForm={showVariantForm}
                  newVariantData={newVariantData} isAddingNewTypeInVariantForm={isAddingNewTypeInVariantForm}
                  config={config} filteredVariantTypes={filteredVariantTypes}
                  onAddVariant={handleAddVariant} onDeleteVariant={handleDeleteVariant}
                  onSetShowVariantForm={setShowVariantForm} onSetNewVariantData={setNewVariantData}
                  onSetIsAddingNewType={setIsAddingNewTypeInVariantForm} onSetEditingVariantId={setEditingVariantId}
                />
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
