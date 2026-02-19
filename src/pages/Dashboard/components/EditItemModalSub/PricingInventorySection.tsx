import styles from '../EditItemModal.module.css';
import type { InventoryItem } from '../../../../types/inventory';

interface PricingInventorySectionProps {
  editingItem: InventoryItem;
  onInputChange: (field: string, value: any) => void;
}

export default function PricingInventorySection({ editingItem, onInputChange }: PricingInventorySectionProps) {
  return (
    <>
      <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '16px' }}>
        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px', color: '#888', fontSize: '12px', letterSpacing: '1px' }}>PRICING & INVENTORY</h3>
      </div>
      <div className={styles.formGroup}>
        <label>SKU</label>
        <input 
          className={styles.formInput} 
          type="text" 
          value={editingItem.sku || ''} 
          onChange={(e) => onInputChange('sku', e.target.value)} 
          placeholder="Optional" 
        />
      </div>
      <div className={styles.formGroup}>
        <label>Selling Price (₱) *</label>
        <input 
          className={styles.formInput} 
          type="number" 
          step="0.01" 
          value={editingItem.price !== undefined && editingItem.price !== null && !isNaN(editingItem.price) ? editingItem.price : ''} 
          onChange={(e) => {
            const val = e.target.value;
            onInputChange('price', val === '' ? 0 : parseFloat(val));
          }} 
        />
      </div>
      <div className={styles.formGroup}>
        <label>Cost Price (₱)</label>
        <input 
          className={styles.formInput} 
          type="number" 
          step="0.01" 
          value={editingItem.cost_price !== undefined && editingItem.cost_price !== null && !isNaN(editingItem.cost_price) ? editingItem.cost_price : ''} 
          onChange={(e) => {
            const val = e.target.value;
            onInputChange('cost_price', val === '' ? 0 : parseFloat(val));
          }} 
        />
      </div>
      <div className={styles.formGroup}>
        <label>Current Stock</label>
        <input 
          className={styles.formInput} 
          type="number" 
          value={(editingItem.stock !== undefined && editingItem.stock !== null && !isNaN(editingItem.stock)) ? editingItem.stock : (editingItem.quantity !== undefined && !isNaN(editingItem.quantity) ? editingItem.quantity : '')} 
          onChange={(e) => {
            const val = e.target.value;
            onInputChange('stock', val === '' ? 0 : parseInt(val));
          }} 
        />
      </div>
      <div className={styles.formGroup}>
        <label>Min Qty</label>
        <input 
          className={styles.formInput} 
          type="number" 
          placeholder="Default: 10" 
          value={editingItem.minQuantity ?? editingItem.min_qty ?? ''} 
          onChange={(e) => {
            const val = e.target.value;
            onInputChange('minQuantity', val === '' ? undefined : parseInt(val));
            onInputChange('min_qty', val === '' ? undefined : parseInt(val));
          }} 
        />
      </div>
    </>
  );
}
