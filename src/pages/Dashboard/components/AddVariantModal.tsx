import { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import styles from './AddVariantModal.module.css';
import { useInventoryStore } from '../../../store/inventoryStore';

interface AddVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
}

/**
 * Modal to select a parent product to add a variant to.
 * Displays a searchable list of base products (excluding existing variants).
 * When a product is selected, it triggers the callback to open the edit modal for that product.
 */
export default function AddVariantModal({ isOpen, onClose, onSelect }: AddVariantModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const allParentProducts = useInventoryStore(state => state.allParentProducts);

  // Filter items: Match search query
  const filteredItems = useMemo(() => {
    return allParentProducts.filter(item => {
      // Search
      const query = searchQuery.toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(query);
      
      return matchName;
    }).slice(0, 50); // Limit to 50 for performance
  }, [allParentProducts, searchQuery]);

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
                key={item.id} 
                className={styles.itemCard}
                onClick={() => onSelect(item)}
              >
                <div className={styles.itemInfo}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemSku}>
                    {item.category || 'Uncategorized'}
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
