import { useState, useEffect } from 'react';
import styles from './EditItemModal.module.css';
import type { InventoryItem } from '../../../types/inventory';

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
              placeholder="Auto-generated if empty"
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
          
          <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '16px', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
             <input 
               type="checkbox" 
               checked={editingItem.has_variants || false}
               onChange={(e) => handleInputChange('has_variants', e.target.checked)}
               style={{ width: '20px', height: '20px', accentColor: '#00ff9d' }}
             />
             <label style={{ cursor: 'pointer', fontSize: '14px', marginLeft: '8px', color: '#fff' }}>Has Variants? (Sizes/Colors)</label>
          </div>
          
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={() => onSave(editingItem)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}
