import { useRef, useEffect } from 'react';
import { Package, Edit, Trash2, Loader2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import styles from './InventoryTable.module.css';
import { useSettings } from '../../../context/SettingsContext';
import DynamicCategorySpecs from './DynamicCategorySpecs';
import { cleanItemName } from '../../../utils/inventoryUtils';
import type { InventoryItem } from '../../../types/inventory';
import { useInventoryStore } from '../../../store/inventoryStore';

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading?: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: number) => void;
}

/**
 * InventoryTable component - Displays inventory items in a table format with edit/delete actions
 * @param items - Array of inventory items to display
 * @param isLoading - Optional loading state boolean
 * @param onEdit - Callback function to handle edit action for an item
 * @param onDelete - Callback function to handle delete action for an item
 */
export default function InventoryTable({ items, isLoading = false, onEdit, onDelete }: InventoryTableProps) {
  // IMPORTANT: Call hooks at the top level, not inside loops or conditions
  const { settings } = useSettings();
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Connect to store for infinite scroll logic
  const { fetchInventory, hasMore, isLoadingMore, currentSearchQuery, currentCategories } = useInventoryStore();

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Approximate row height in pixels
    overscan: 5,
  });

  // Infinite Scroll Handler
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const handleScroll = () => {
      // Threshold: fetch more when user is within 300px of the bottom
      const threshold = 300;
      const isNearBottom = parent.scrollHeight - parent.scrollTop - parent.clientHeight < threshold;

      if (isNearBottom && hasMore && !isLoadingMore && !isLoading) {
        // false means "append to existing list", not reset
        fetchInventory(currentSearchQuery, false, currentCategories);
      }
    };

    parent.addEventListener('scroll', handleScroll);
    return () => parent.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, isLoading, fetchInventory, currentSearchQuery]);
  
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

      {isLoading ? (
        <div className={styles.virtualScrollContainer} style={{ overflowY: 'hidden' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`skeleton-${i}`} className={`${styles.row} ${styles.skeletonRow}`}>
              <div className={styles.partInfo}>
                 <div className={styles.iconBox} style={{ background: 'transparent' }} />
                 <div style={{ flex: 1 }}>
                    <div className={styles.skeletonBox} style={{ width: '60%', marginBottom: '8px' }} />
                    <div className={styles.skeletonBox} style={{ width: '40%', height: '12px' }} />
                 </div>
              </div>
              <div className={styles.skeletonBox} style={{ width: '70%' }} />
              <div className={styles.skeletonBox} style={{ width: '50%' }} />
              <div className={styles.skeletonBox} style={{ width: '40%' }} />
              <div className={styles.skeletonBox} style={{ width: '60%' }} />
              <div className={styles.skeletonBox} style={{ width: '50%' }} />
              <div className={styles.actions}>
                 <div className={styles.skeletonBox} style={{ width: '32px', height: '32px' }} />
                 <div className={styles.skeletonBox} style={{ width: '32px', height: '32px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No items found. Adjust your search or filters.
        </div>
      ) : (
        <div ref={parentRef} className={styles.virtualScrollContainer}>
          <div 
            className={styles.virtualTotalSizeContainer}
            // Add extra space at the bottom if loading more to fit the loader spinner comfortably
            style={{ height: `${rowVirtualizer.getTotalSize() + (isLoadingMore ? 80 : 0)}px` }} 
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = items[virtualRow.index];
              const qty = item.stock ?? item.quantity ?? 0;
              const minQty = item.minQuantity ?? item.min_qty ?? settings.low_stock_threshold;
            
              const getDynamicStatus = () => {
                if (qty === 0) return 'Out of Stock';
                return qty < minQty ? 'Low Stock' : 'In Stock';
              };
              const status = getDynamicStatus();
              
              return (
                <div 
                  key={item.id} 
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  className={styles.row}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className={styles.partInfo}>
                    <div className={styles.iconBox}>
                      <Package size={20} />
                    </div>
                    <div>
                      <span className={styles.partName}>
                        {cleanItemName(item)}
                      </span>
                      
                      {/* Dynamic Attributes based on Category Metadata */}
                      <DynamicCategorySpecs 
                        item={item}
                        style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}
                        labelStyle={{ color: '#666' }}
                        valueStyle={{ color: '#00ff9d', fontSize: '10px' }}
                      />

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
                      {item.specifications?.tags && item.specifications.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          {item.specifications.tags.map(tag => (
                            <span 
                              key={tag} 
                              style={{ 
                                fontSize: '8px', 
                                padding: '1px 5px', 
                                borderRadius: '10px', 
                                background: '#0a0a0a', 
                                border: '1px solid #00ff9d22', 
                                color: '#00ff9d',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
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
                    <span style={{ color: item.has_variants ? '#00ff9d' : '#444', fontSize: '12px', fontWeight: item.has_variants ? 'bold' : 'normal' }}>
                      {item.has_variants ? `${item.variant_count || 0} variants` : '-'}
                    </span>
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
            
            {/* Show a loading spinner at the bottom when fetching more items */}
            {isLoadingMore && (
              <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                width: '100%', 
                height: '80px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#00ff9d'
              }}>
                <Loader2 size={24} className={styles.spinnerIcon} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ marginLeft: '12px', fontSize: '14px', fontWeight: 'bold' }}>Loading more items...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
