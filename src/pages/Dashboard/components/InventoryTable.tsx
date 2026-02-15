import { Package, Edit, Trash2 } from 'lucide-react';
import styles from './InventoryTable.module.css';
import { useSettings } from '../../../context/SettingsContext';
import type { InventoryItem } from '../../../types/inventory';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: number) => void;
}

/**
 * InventoryTable component - Displays inventory items in a table format with edit/delete actions
 * @param items - Array of inventory items to display
 * @param onEdit - Callback function to handle edit action for an item
 * @param onDelete - Callback function to handle delete action for an item
 */
export default function InventoryTable({ items, onEdit, onDelete }: InventoryTableProps) {
  return (
    <>
      <div className={styles.tableHeader}>
        <span>Item Name</span>
        <span>Category</span>
        <span>Price</span>
        <span>Stock Level</span>
        <span>Variants</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      {items.map((item) => {
        const { settings } = useSettings();
        const qty = item.stock ?? item.quantity ?? 0;
        const minQty = item.minQuantity ?? item.min_qty ?? settings.low_stock_threshold;
        
        /**
         * Get dynamic stock status based on quantity and minimum threshold
         * Uses settings context for low stock threshold
         * @returns Stock status string
         */
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
                <span className={styles.partName}>
                  {item.name}
                </span>
                {/* Display Base Item Specs (Bulb Type & Color) */}
                {(item.bulb_type || item.color_temperature) && !item.is_variant && (
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {item.bulb_type && (
                      <span style={{ 
                        background: '#222', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        border: '1px solid #333',
                        fontWeight: '700',
                        color: '#ddd'
                      }}>
                        {item.bulb_type}
                      </span>
                    )}
                    {item.color_temperature && (
                      <span style={{ 
                        color: '#00ff9d', 
                        fontWeight: '700',
                        letterSpacing: '0.5px'
                      }}>
                        {item.color_temperature}
                        {typeof item.color_temperature === 'number' ? 'K' : ''}
                      </span>
                    )}
                  </div>
                )}
                {item.sku && (
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SKU: {item.sku}
                  </div>
                )}
                {item.notes && (
                  <div style={{ fontSize: '10px', color: '#888', marginTop: '4px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#00ff9d' }}>⚠</span> {item.notes}
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

            <div>
              <span style={{ color: '#444', fontSize: '12px' }}>-</span>
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
                onClick={() => onEdit(item)}
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
