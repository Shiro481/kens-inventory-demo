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
    min_stock_level: 5, color: '', color_temperature: '', description: '', sku: '',
    notes: '',
    specifications: {}
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

  const { config, isFallback } = useCategoryMetadata(editingItem?.category);

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
    const normalizedType = String(newVariantData.variant_type || '').trim();
    if (!normalizedType) {
        return alert(`Please enter a "${config.variantTypeLabel || 'Variant Type'}" before saving.`);
    }

    if (!supabase) return;

    // Resolve Variant Definition
    let variantId: number | null = null;
    const { data: variants, error: fetchDefError } = await supabase
        .from('variant_definitions')
        .select('*')
        .ilike('variant_name', normalizedType);

    if (fetchDefError) {
        console.error('[EditItemModal] Definition fetch error:', fetchDefError);
    }

    const matchedDef = variants?.find(v => v.variant_name.toLowerCase() === normalizedType.toLowerCase());

    if (matchedDef) {
        variantId = matchedDef.id;
    } else {
        const { data: newVariant, error: createError } = await supabase
            .from('variant_definitions')
            .insert({
                base_name: editingItem?.name || 'Variant',
                variant_name: normalizedType,
                display_name: normalizedType,
                description: `Standard ${normalizedType}`,
                compatibility_list: [normalizedType],
                is_active: true
            })
            .select()
            .maybeSingle();

        if (createError) {
            return alert('Error creating new type: ' + createError.message);
        }
        if (newVariant) {
            variantId = newVariant.id;
        } else {
            const { data: retryData } = await supabase.from('variant_definitions').select('id').eq('variant_name', normalizedType).single();
            variantId = retryData?.id || null;
        }
    }

    if (!variantId) {
        return alert('Could not resolve variant type ID. Please try again.');
    }

    const pid = (editingItem as any)?.uuid;
    if (!pid || item?.id === 0) {
         // --- LOCAL FLOW (New Product) ---
         // Check for local duplicates before adding
         const isDuplicate = productVariants.some(v => 
            v.variant_id === variantId && 
            (v.variant_color || '') === (newVariantData.color || '') &&
            (v.color_temperature || '') === (newVariantData.color_temperature || '') &&
            v.id !== editingVariantId // Allow editing the current variant
         );

         if (isDuplicate && !editingVariantId) {
            return alert(`This variant (${normalizedType}) already exists in your list.`);
         }

         const newVar = {
             ...newVariantData,
             id: editingVariantId || Date.now(),
             is_temp: true,
             variant_id: variantId,
             variant_color: newVariantData.color || null,
             variant_sku: newVariantData.sku || null,
             stock_quantity: Number(newVariantData.stock) || 0,
             min_stock_level: Number(newVariantData.min_stock_level) || 5, 
             variant_type: normalizedType,
             variant_definitions: { variant_name: normalizedType },
             color_temperature: newVariantData.color_temperature,
             cost_price: Number(newVariantData.cost_price),
             selling_price: Number(newVariantData.selling_price),
             description: newVariantData.description,
             specifications: { 
                ...(newVariantData.specifications || {}),
                internal_notes: newVariantData.notes
              }
          };

         if (editingVariantId) {
             setProductVariants(prev => prev.map(v => v.id === editingVariantId ? newVar : v));
         } else {
             setProductVariants(prev => [...prev, newVar]);
         }

         setNewVariantData({ 
            variant_type: '', color_temperature: '', cost_price: 0, 
            selling_price: 0, stock: 0, min_stock_level: 5, color: '', description: '', sku: '',
            notes: '', specifications: {} 
         });
         setShowVariantForm(false);
         setEditingVariantId(null);
         return;
    }

    // --- DATABASE FLOW (Existing Product) ---
    let existingProductVariant: any = null;
    if (editingVariantId) {
        existingProductVariant = { id: editingVariantId };
    } else {
        const { data: potentialMatches } = await supabase
            .from('product_variants')
            .select('id, variant_color, color_temperature')
            .eq('product_id', pid)
            .eq('variant_id', variantId);

        const targetColor = newVariantData.color || null;
        const targetTemp = newVariantData.color_temperature || null;

        existingProductVariant = potentialMatches?.find((v: any) => 
            (v.variant_color || null) === targetColor && 
            (v.color_temperature || null) === (targetTemp ? String(targetTemp) : null)
        );
    }

    const updates: any = {
      variant_type: normalizedType,
      variant_id: variantId,
      color_temperature: String(newVariantData.color_temperature) || null,
      cost_price: Number(newVariantData.cost_price) || 0,
      selling_price: Number(newVariantData.selling_price) || 0,
      stock_quantity: Number(newVariantData.stock) || 0,
      min_stock_level: Number(newVariantData.min_stock_level) || 5,
      variant_color: newVariantData.color || null,
      description: newVariantData.description || null,
      variant_sku: newVariantData.sku || null,
      specifications: {
          ...(newVariantData.specifications || {}),
          internal_notes: newVariantData.notes
      }
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
            color: '', color_temperature: '', description: '', sku: '', 
            notes: '',
            specifications: {} 
        });
    } else {
        alert('Error saving variant: ' + error.message);
    }
  };

  const handleDeleteVariant = async (id: number) => {
      if (!confirm('Remove this variant?')) return;
      // Use is_temp flag to detect unsaved local variants — avoids magic-number guard
      const isTemp = productVariants.find(v => v.id === id)?.is_temp === true;
      if (isTemp) {
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
        const currentTags = editingItem.specifications?.tags || [];
        if (!currentTags.includes(newTag)) {
          handleInputChange('specifications', { ...editingItem.specifications, tags: [...currentTags, newTag] });
        }
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editingItem) {
      const currentTags = editingItem.specifications?.tags || [];
      handleInputChange('specifications', { ...editingItem.specifications, tags: currentTags.filter((t: string) => t !== tagToRemove) });
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

        {/* Fallback config notice */}
        {isFallback && editingItem.category && (
          <div style={{
            margin: '0 0 12px',
            padding: '7px 12px',
            background: 'rgba(255,152,0,0.07)',
            border: '1px solid rgba(255,152,0,0.25)',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#ff9800',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '13px' }}>⚙</span>
            <span>Category <strong>"{editingItem.category}"</strong> is using default field config — go to <strong>Settings → Categories</strong> to customize it.</span>
          </div>
        )}
        
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
                tags={editingItem.specifications?.tags || []} tagInput={tagInput}
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
