
import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, X, List, Tag, AlertCircle, Loader2 } from 'lucide-react';
import styles from './CategoryManager.module.css';
import { supabase } from '../../../lib/supabase';

interface CategoryField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  suffix?: string;
  options?: string[];
}

interface VariantDimension {
  label: string;
  column: string;
  active: boolean;
}

interface CategoryMetadata {
  id?: number;
  category_id: number;
  variant_type_label: string;
  variant_dimensions?: VariantDimension[];
  fields: CategoryField[];
  suggested_variant_types: string[];
}

interface ProductCategory {
  id: number;
  name: string;
}

interface CategoryManagerProps {
  onCategoryAdded?: () => void;
}

export default function CategoryManager({ onCategoryAdded }: CategoryManagerProps) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [metadata, setMetadata] = useState<CategoryMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories(selectNewId?: number) {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
      
      if (selectNewId) {
        setSelectedCategoryId(selectNewId);
        fetchMetadata(selectNewId);
      } else if (data && data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(data[0].id);
        fetchMetadata(data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !supabase) return;
    setCreatingCategory(true);
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .insert([{ name: newCategoryName.trim() }])
        .select()
        .single();

      if (error) throw error;
      
      alert(`Category "${newCategoryName}" created!`);
      setNewCategoryName('');
      await fetchCategories(data.id);
      if (onCategoryAdded) onCategoryAdded();
    } catch (err: any) {
      alert('Error creating category: ' + err.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId: number, catName: string) => {
    if (!supabase) return;
    if (!window.confirm(`Delete category "${catName}"?\n\nThis will remove the configuration. Products using this category keep their category text but the category won't appear in dropdowns or filters.`)) return;
    try {
      // Delete metadata first (FK order)
      await supabase.from('category_metadata').delete().eq('category_id', catId);
      const { error } = await supabase.from('product_categories').delete().eq('id', catId);
      if (error) throw error;
      if (selectedCategoryId === catId) { setSelectedCategoryId(null); setMetadata(null); }
      await fetchCategories();
      if (onCategoryAdded) onCategoryAdded();
    } catch (err: any) {
      alert('Error deleting category: ' + err.message);
    }
  };

  async function fetchMetadata(catId: number) {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('category_metadata')
        .select('*')
        .eq('category_id', catId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setMetadata({
          ...data,
          variant_dimensions: data.variant_dimensions || [
            { label: data.variant_type_label || 'Variant', column: 'variant_type', active: true },
            { label: 'Color', column: 'variant_color', active: false },
            { label: 'Color Temp', column: 'color_temperature', active: false }
          ]
        });
      } else {
        // Default template for new metadata
        setMetadata({
          category_id: catId,
          variant_type_label: 'Variant',
          variant_dimensions: [
            { label: 'Variant', column: 'variant_type', active: true },
            { label: 'Color', column: 'variant_color', active: false },
            { label: 'Color Temp', column: 'color_temperature', active: false }
          ],
          fields: [],
          suggested_variant_types: []
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedCategoryId(id);
    fetchMetadata(id);
  };

  const addField = () => {
    if (!metadata) return;
    const newField: CategoryField = {
      key: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text'
    };
    setMetadata({
      ...metadata,
      fields: [...metadata.fields, newField]
    });
  };

  const removeField = (index: number) => {
    if (!metadata) return;
    const newFields = [...metadata.fields];
    newFields.splice(index, 1);
    setMetadata({ ...metadata, fields: newFields });
  };

  const updateField = (index: number, updates: Partial<CategoryField>) => {
    if (!metadata) return;
    const newFields = [...metadata.fields];
    newFields[index] = { ...newFields[index], ...updates };
    setMetadata({ ...metadata, fields: newFields });
  };

  const addVariantType = (type: string) => {
    if (!metadata || !type.trim()) return;
    if (metadata.suggested_variant_types.includes(type.trim())) return;
    setMetadata({
      ...metadata,
      suggested_variant_types: [...metadata.suggested_variant_types, type.trim()]
    });
  };

  const addDimension = () => {
    if (!metadata) return;
    const newDim: VariantDimension = {
      label: 'New Dimension',
      column: `spec_${Date.now()}`,
      active: true
    };
    setMetadata({
      ...metadata,
      variant_dimensions: [...(metadata.variant_dimensions || []), newDim]
    });
  };

  const removeDimension = (index: number) => {
    if (!metadata || !metadata.variant_dimensions) return;
    if (index === 0) {
      alert("The primary dimension cannot be removed.");
      return;
    }
    const newDims = [...metadata.variant_dimensions];
    newDims.splice(index, 1);
    setMetadata({ ...metadata, variant_dimensions: newDims });
  };

  const removeVariantType = (type: string) => {
    if (!metadata) return;
    setMetadata({
      ...metadata,
      suggested_variant_types: metadata.suggested_variant_types.filter(t => t !== type)
    });
  };

  const handleSave = async () => {
    if (!supabase || !metadata || !selectedCategoryId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('category_metadata')
        .upsert({
          category_id: selectedCategoryId,
          variant_type_label: metadata.variant_type_label,
          variant_dimensions: metadata.variant_dimensions,
          fields: metadata.fields,
          suggested_variant_types: metadata.suggested_variant_types,
          updated_at: new Date().toISOString(),
          is_active: true
        }, { onConflict: 'category_id' });

      if (error) throw error;
      alert('Category metadata saved successfully!');
    } catch (err: any) {
      alert('Error saving: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && categories.length === 0) {
    return <div className={styles.loading}><Loader2 className={styles.spinner} /> Loading categories...</div>;
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Settings className={styles.iconWrapper} size={20} />
        <h2>CATEGORY CONFIGURATIONS</h2>
      </div>

      <div className={styles.creatorSection}>
        <label>Create New Category:</label>
        <div className={styles.creatorRow}>
          <input 
            type="text" 
            value={newCategoryName} 
            onChange={e => setNewCategoryName(e.target.value)}
            placeholder="e.g. Wiper Blades, Accessories"
            className={styles.input}
          />
          <button 
            onClick={handleAddCategory} 
            className={styles.addBtn}
            disabled={creatingCategory || !newCategoryName.trim()}
          >
            {creatingCategory ? <Loader2 className={styles.spinner} /> : <Plus size={16} />}
            ADD
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.selector}>
        <label>Select Category to Manage:</label>
        {/* Category list with delete buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 10px', borderRadius: '4px', cursor: 'pointer',
                background: selectedCategoryId === cat.id ? 'rgba(0,255,157,0.1)' : 'transparent',
                border: selectedCategoryId === cat.id ? '1px solid rgba(0,255,157,0.3)' : '1px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              <span
                style={{ flex: 1, fontSize: '13px', color: selectedCategoryId === cat.id ? '#00ff9d' : '#ccc' }}
                onClick={() => { setSelectedCategoryId(cat.id); fetchMetadata(cat.id); }}
              >
                {cat.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }}
                title={`Delete "${cat.name}"`}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#555', padding: '2px', display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#555')}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <select value={selectedCategoryId || ''} onChange={handleCategoryChange} className={styles.catSelect}>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {metadata && (
        <div className={styles.editor}>
          <div className={styles.variantSection} style={{ marginBottom: '24px' }}>
            <div className={styles.fieldHeader}>
              <h3><Tag size={16} /> Multi-Variant Dimensions</h3>
              <button onClick={addDimension} className={styles.addBtn}><Plus size={14} /> Add Dimension</button>
            </div>
            <p className={styles.hint}>Enable and label dimensions for products in this category (e.g., Size, Color, Voltage).</p>
            
            <div className={styles.dimensionList}>
              {metadata.variant_dimensions?.map((dim, idx) => (
                <div key={dim.column} className={styles.dimensionItem}>
                  <label className={styles.dimensionToggle}>
                    <input 
                      type="checkbox" 
                      checked={dim.active} 
                      onChange={e => {
                        const newDims = [...(metadata.variant_dimensions || [])];
                        newDims[idx] = { ...dim, active: e.target.checked };
                        setMetadata({ ...metadata, variant_dimensions: newDims });
                        // Sync legacy label if first dimension changed
                        if (idx === 0) setMetadata(prev => prev ? ({...prev, variant_type_label: dim.label, variant_dimensions: newDims}) : null);
                      }} 
                    />
                    <span className={styles.toggleLabel}>Active</span>
                  </label>
                  <input 
                    type="text" 
                    value={dim.label} 
                    onChange={e => {
                      const newDims = [...(metadata.variant_dimensions || [])];
                      newDims[idx] = { ...dim, label: e.target.value };
                      setMetadata({ ...metadata, variant_dimensions: newDims });
                      // Sync legacy label if first dimension changed
                      if (idx === 0) setMetadata(prev => prev ? ({...prev, variant_type_label: e.target.value, variant_dimensions: newDims}) : null);
                    }}
                    placeholder={`Dimension ${idx + 1} Label`}
                    className={styles.fieldInput}
                    disabled={!dim.active}
                    style={{ flex: 1 }}
                  />
                  <div className={styles.columnBadge}>{dim.column}</div>
                  {idx > 0 && (
                    <button onClick={() => removeDimension(idx)} className={styles.removeBtn} style={{ marginLeft: '8px' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.fieldSection}>
            <div className={styles.fieldHeader}>
              <h3><List size={16} /> Technical Specification Fields</h3>
              <button onClick={addField} className={styles.addBtn}><Plus size={14} /> Add Field</button>
            </div>
            
            <div className={styles.fieldList}>
              {metadata.fields.length === 0 ? (
                <div className={styles.emptyFields}>No custom fields defined for this category.</div>
              ) : (
                metadata.fields.map((field, idx) => (
                  <div key={field.key} className={styles.fieldItem}>
                    <div className={styles.fieldRow}>
                      <input 
                        type="text" 
                        value={field.label} 
                        onChange={e => updateField(idx, { label: e.target.value })}
                        placeholder="Field Label (e.g. Wattage)"
                        className={styles.fieldInput}
                      />
                      <select 
                        value={field.type} 
                        onChange={e => updateField(idx, { type: e.target.value as any })}
                        className={styles.fieldType}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="select">Dropdown (Select)</option>
                      </select>
                      <input 
                        type="text" 
                        value={field.suffix || ''} 
                        onChange={e => updateField(idx, { suffix: e.target.value })}
                        placeholder="Suffix"
                        className={styles.fieldSuffix}
                        disabled={field.type === 'select'}
                      />
                      <button onClick={() => removeField(idx)} className={styles.removeBtn}><Trash2 size={14} /></button>
                    </div>
                    {field.type === 'select' && (
                      <div className={styles.optionsSection}>
                        <label>Options (comma separated):</label>
                        <input 
                          type="text" 
                          value={field.options?.join(', ') || ''} 
                          onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                          placeholder="Option 1, Option 2, Option 3"
                          className={styles.optionsInput}
                        />
                      </div>
                    )}
                    <div className={styles.fieldKey}>
                      Database Key: <code>{field.key}</code>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.variantSection}>
            <div className={styles.fieldHeader}>
              <h3><Tag size={16} /> Suggested Variant Types</h3>
            </div>
            <div className={styles.tagInput}>
              <input 
                type="text" 
                placeholder="Add variant (e.g. H1, H4, 1157) then press Enter" 
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    addVariantType((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className={styles.input}
              />
            </div>
            <div className={styles.tagList}>
              {metadata.suggested_variant_types.map(type => (
                <span key={type} className={styles.tag}>
                  {type}
                  <button onClick={() => removeVariantType(type)}><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          <button onClick={handleSave} className={styles.saveBtn} disabled={saving}>
            {saving ? <Loader2 className={styles.spinner} /> : <Save size={18} />}
            {saving ? 'SAVING...' : 'SAVE CONFIGURATION'}
          </button>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </section>
  );
}
