import { useState, useEffect } from 'react';
import styles from './EditItemModal.module.css';
import type { InventoryItem } from '../../../types/inventory';

interface EditItemModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  categories: string[];
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
}

export default function EditItemModal({ isOpen, item, categories, onClose, onSave }: EditItemModalProps) {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  useEffect(() => {
    if (item) {
      setEditingItem({ ...item });
      // Auto-switch to input mode if category exists but is not in the list
      const hasCategory = item.category && item.category.trim() !== '';
      const categoryInList = categories.includes(item.category || '');
      setIsNewCategory(Boolean(hasCategory && !categoryInList));
    }
  }, [item, categories]);

  if (!isOpen || !editingItem) return null;

  const handleInputChange = (field: keyof InventoryItem, value: string | number | undefined) => {
    setEditingItem(prev => prev ? ({ ...prev, [field]: value }) : null);
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

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{item?.id === 0 ? 'Add New Item' : 'Edit Part'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>X</button>
        </div>
        
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Part Name</label>
            <input 
              className={styles.formInput} 
              type="text" 
              value={editingItem.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>SKU</label>
            <input 
              className={styles.formInput} 
              type="text" 
              value={editingItem.sku || ''}
              onChange={(e) => handleInputChange('sku', e.target.value)}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label>Category</label>
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

          <div className={styles.formGroup}>
            <label>Qty</label>
            <input 
              className={styles.formInput} 
              type="number" 
              value={editingItem.stock ?? editingItem.quantity ?? ''}
              onChange={(e) => handleInputChange('stock', parseInt(e.target.value))}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Min Qty (for Low Stock warning)</label>
            <input 
              className={styles.formInput} 
              type="number" 
              placeholder="Default: 10"
              value={editingItem.minQuantity ?? editingItem.min_qty ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                // Allow empty input - set to undefined so placeholder shows
                if (val === '' || val === null) {
                  handleInputChange('minQuantity', undefined);
                  handleInputChange('min_qty', undefined);
                } else {
                  const numVal = parseInt(val);
                  const finalVal = isNaN(numVal) ? undefined : numVal;
                  handleInputChange('minQuantity', finalVal);
                  handleInputChange('min_qty', finalVal);
                }
              }}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Price ($)</label>
            <input 
              className={styles.formInput} 
              type="number" 
              step="0.01"
              value={editingItem.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
            />
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
