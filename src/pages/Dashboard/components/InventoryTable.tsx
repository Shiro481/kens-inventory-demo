import { Package, Edit, Trash2 } from 'lucide-react';
import styles from './InventoryTable.module.css';
import { useSettings } from '../../../context/SettingsContext';
import type { InventoryItem } from '../../../types/inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function InventoryTable({ items, onEdit, onDelete }: InventoryTableProps) {
  return (
    <>
      <div className={styles.tableHeader}>
        <span>Item Name</span>
        <span>Category</span>
        <span>Price</span>
        <span>Stock Level</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      {items.map((item) => {
        const { settings } = useSettings();
        const qty = item.stock ?? item.quantity ?? 0;
        const minQty = item.minQuantity ?? item.min_qty ?? settings.low_stock_threshold;
        
        // Temporarily override getStatus logic manually to use settings
        const getDynamicStatus = () => {
          if (qty === 0) return 'Out of Stock';
          return qty < minQty ? 'Low Stock' : 'In Stock';
        };
        const status = getDynamicStatus();
        
        return (
          <div key={item.id} className={styles.row}>
            <div className={styles.partInfo}>
              <div className={styles.iconBox}>
                <Package size={20} />
              </div>
              <div>
                <span className={styles.partName}>{item.name}</span>
                {item.sku && (
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SKU: {item.sku}
                  </div>
                )}
              </div>
            </div>

            <div style={{ color: '#888', fontSize: '14px' }}>
              {item.category || '-'}
            </div>
            
            <div className={styles.price}>{settings.currency_symbol}{item.price?.toFixed(2)}</div>
            
            <div style={{ fontWeight: 'bold' }}>
              {qty} <span style={{ color: '#666', fontSize: '12px', fontWeight: 'normal' }}>/ {minQty} min</span>
            </div>

            <div title={`Low Stock Threshold: ${minQty}`}>
              <span className={`${styles.badge} ${
                status === 'In Stock' ? styles.inStock : 
                status === 'Low Stock' ? styles.lowStock : 
                styles.outStock
              }`}>
                {status}
              </span>
            </div>
            
            <div className={styles.actions}>
              <button 
                className={styles.actionBtn} 
                onClick={() => onEdit(item.id)}
                title="Edit Item"
              >
                <Edit size={16} />
              </button>
              <button 
                className={`${styles.actionBtn} ${styles.delete}`} 
                onClick={() => onDelete(item.id)}
                title="Delete Item"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}
