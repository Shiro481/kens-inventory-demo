import { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import styles from './AddVariantModal.module.css';
import type { InventoryItem } from '../../../types/inventory';

interface AddVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: InventoryItem) => void;
  items: InventoryItem[];
}

/**
 * Modal to select a parent product to add a variant to.
 * Displays a searchable list of base products (excluding existing variants).
 * When a product is selected, it triggers the callback to open the edit modal for that product.
 */
export default function AddVariantModal({ isOpen, onClose, onSelect, items }: AddVariantModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items: 
  // 1. Must NOT be a variant itself (is_variant !== true)
  // 2. Match search query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Only base products
      if (item.is_variant) return false;

      // Search
      const query = searchQuery.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(query);
      const matchSku = (item.sku || '').toLowerCase().includes(query);
      
      return matchName || matchSku;
    }).slice(0, 50); // Limit to 50 for performance
  }, [items, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
    }}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Add Variant To...</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.searchContainer}>
          <input 
            type="text" 
            className={styles.searchInput}
            placeholder="Search for a product..."
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.itemsList}>
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div 
                key={item.uuid || item.id} 
                className={styles.itemCard}
                onClick={() => onSelect(item)}
              >
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemSku}>
                    {item.sku || 'NO SKU'} • {item.category || 'Uncategorized'}
                  </span>
                </div>
                <div className={styles.selectIcon}>
                  <Plus size={18} />
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              No matching products found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
