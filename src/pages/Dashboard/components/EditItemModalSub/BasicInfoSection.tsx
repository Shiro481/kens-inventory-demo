import styles from '../EditItemModal.module.css';
import type { InventoryItem } from '../../../../types/inventory';

interface BasicInfoSectionProps {
  editingItem: InventoryItem;
  categories: string[];
  suppliers: string[];
  onInputChange: (field: string, value: any) => void;
  onCategorySelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function BasicInfoSection({ 
  editingItem, 
  categories, 
  suppliers,
  onInputChange, 
  onCategorySelect
}: BasicInfoSectionProps) {
  return (
    <>
      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>BASIC INFORMATION</h3>
      </div>
      <div className={styles.formGroup}>
        <label>Part Name *</label>
        <input 
          className={styles.formInput} 
          type="text" 
          value={editingItem.name || ''} 
          onChange={(e) => onInputChange('name', e.target.value)} 
          placeholder="e.g. LED Headlight H4" 
        />
      </div>
      <div className={styles.formGroup}>
        <label>Brand</label>
        <input 
          className={styles.formInput} 
          type="text" 
          value={editingItem.brand || ''} 
          onChange={(e) => onInputChange('brand', e.target.value)} 
          placeholder="e.g. Philips, Osram" 
        />
      </div>
      <div className={styles.formGroup}>
        <label>Barcode</label>
        <input 
          className={styles.formInput} 
          type="text" 
          value={editingItem.barcode || ''} 
          onChange={(e) => onInputChange('barcode', e.target.value)} 
          placeholder="Scan or enter barcode" 
        />
      </div>
      <div className={styles.formGroup}>
        <label>Supplier</label>
        <select 
          className={styles.formInput} 
          value={editingItem.supplier || ''} 
          onChange={(e) => onInputChange('supplier', e.target.value)}
        >
          <option value="">Select Supplier</option>
          {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className={`${styles.formGroup} ${styles.fullWidth}`}>
        <label>Category *</label>
        <select 
          className={styles.formInput} 
          value={categories.includes(editingItem.category || '') ? editingItem.category : ''} 
          onChange={onCategorySelect}
        >
          <option value="">Select Category</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
    </>
  );
}
