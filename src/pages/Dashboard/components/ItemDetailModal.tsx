import { useState } from 'react';
import { X, Plus, Minus, Package, ShoppingCart, Eye, Info } from 'lucide-react';
import styles from './ItemDetailModal.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { useSettings } from '../../../context/SettingsContext';
import { useCategoryMetadata } from '../../../hooks/useCategoryMetadata';
import DynamicCategorySpecs from './DynamicCategorySpecs';
import { cleanItemName } from '../../../utils/inventoryUtils';

interface ItemDetailModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onAddToCart: (item: InventoryItem, quantity: number) => void;
  variants?: any[];
  onVariantSelect?: (variant: any, quantity: number) => void;
}

export default function ItemDetailModal({ isOpen, item, onClose, onAddToCart, variants, onVariantSelect }: ItemDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [dimensionSelections, setDimensionSelections] = useState<Record<string, string>>({});
  const { settings } = useSettings();
  const { config } = useCategoryMetadata(item?.category);
  
  if (!isOpen || !item) return null;

  const hasVariants = variants && variants.length > 0;

  const parentOption = {
    id: 'parent',
    variant_type: item.variant_type || 'Base', 
    color_temperature: item.color_temperature || 'Original',
    selling_price: item.price,
    stock_quantity: item.stock ?? item.quantity ?? 0,
    min_stock_level: item.minQuantity,
    isParent: true
  };

  const allAvailableOptions = hasVariants && variants ? variants : [parentOption];
  
  const getParsedSpecs = (specs: any) => {
    if (!specs) return {};
    if (typeof specs === 'object') return specs;
    try { return JSON.parse(specs); } catch { return {}; }
  };

  const getDimensionValue = (variant: any, dimColumn: string) => {
    if (!variant) return null;
    const colName = dimColumn.toLowerCase();
    if (colName === 'variant_type' || colName === 'socket') return variant.variant_type || variant.variant_definitions?.variant_name || getParsedSpecs(variant.specifications)?.socket;
    if (colName === 'variant_color' || colName === 'color') return variant.variant_color || getParsedSpecs(variant.specifications)?.color;
    if (colName === 'color_temperature' || colName === 'temp') return variant.color_temperature || getParsedSpecs(variant.specifications)?.color_temperature || getParsedSpecs(variant.specifications)?.temp;
    return getParsedSpecs(variant.specifications)?.[dimColumn];
  };

  const activeDimensions = config.variantDimensions?.filter((d: any) => d.active) || [];

  const currentPrice = selectedVariant ? selectedVariant.selling_price : (item.price || 0);
  const stock = selectedVariant ? selectedVariant.stock_quantity : (item.stock ?? item.quantity ?? 0);
  const currentMinStock = selectedVariant?.min_stock_level ?? item.minQuantity ?? settings.low_stock_threshold;
  
  const isOutOfStock = stock <= 0;
  const maxQuantity = Math.min(stock, 99);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!isOutOfStock && quantity > 0) {
      if (selectedVariant && !selectedVariant.isParent && onVariantSelect) {
        onVariantSelect(selectedVariant, quantity);
      } else {
        onAddToCart(item, quantity);
      }
      onClose();
      setQuantity(1);
      setSelectedVariant(null);
      setDimensionSelections({});
    }
  };

  const handleQuickAdd = (qty: number) => {
    if (qty <= maxQuantity) {
      setQuantity(qty);
    }
  };

  const getStockStatus = () => {
    if (stock === 0) return { status: 'Out of Stock', color: '#ef4444' };
    if (stock < currentMinStock) return { status: 'Low Stock', color: '#f59e0b' };
    return { status: 'In Stock', color: '#10b981' };
  };

  const stockStatus = getStockStatus();
  const totalPrice = currentPrice * quantity;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.itemHeader}>
            <div className={styles.itemIcon}>
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className={styles.itemImage} />
              ) : (
                <Package size={32} />
              )}
            </div>
            <div className={styles.itemTitle}>
              <h2>{cleanItemName(selectedVariant ? { ...item, ...selectedVariant } : item)}</h2>
              <p className={styles.sku}>SKU: {item.sku || 'NO SKU'}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.stockSection}>
            <div className={styles.stockInfo}>
              <span className={styles.stockLabel}>Stock Status:</span>
              <span className={styles.stockStatus} style={{ color: stockStatus.color }}>
                {stockStatus.status} ({stock} units)
              </span>
            </div>
          </div>

          <div className={styles.specsContainer}>
            <DynamicCategorySpecs 
              item={selectedVariant ? { ...item, ...selectedVariant } : item} 
              labelStyle={{ color: '#aaa', minWidth: '80px' }}
              valueStyle={{ color: '#fff' }}
            />

            {stock > 0 && stock < currentMinStock && (
              <div className={styles.lowStockWarning}>
                 <Info size={14} /> Attention: This item is below minimum stock level.
               </div>
            )}
          </div>

          {hasVariants && (
            <div className={styles.variantSection}>
              <h3 className={styles.sectionTitle}>Select Variants</h3>
              {activeDimensions.length > 0 ? (
                activeDimensions.map((dim: any, idx: number) => {
                  // Determine available options for THIS dropdown based on previous selections
                  let optionsForThisDropdown = allAvailableOptions;

                  for (let i = 0; i < idx; i++) {
                      const prevDimColumn = activeDimensions[i].column;
                      const selectedVal = dimensionSelections[prevDimColumn];
                      if (selectedVal) {
                          optionsForThisDropdown = optionsForThisDropdown.filter(v => String(getDimensionValue(v, prevDimColumn)) === String(selectedVal));
                      }
                  }

                  // Extract unique values
                  const uniqueValues = Array.from(new Set(optionsForThisDropdown.map(v => getDimensionValue(v, dim.column)).filter(Boolean)));
                  const isEnabled = idx === 0 || !!dimensionSelections[activeDimensions[idx - 1].column];

                  return (
                      <div key={dim.column} className={styles.dropdownGroup}>
                          <label className={styles.variantLabel}>Select {dim.label}:</label>
                          <select 
                              className={styles.variantDropdown}
                              value={dimensionSelections[dim.column] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newSelections: Record<string, string> = { ...dimensionSelections, [dim.column]: val };
                                
                                // Clear downstream selections
                                for (let i = idx + 1; i < activeDimensions.length; i++) {
                                    const nextColKey = activeDimensions[i].column as string;
                                    delete newSelections[nextColKey];
                                }
                                
                                setDimensionSelections(newSelections);

                                // Check if we have selected all active dimensions
                                if (Object.keys(newSelections).length === activeDimensions.length) {
                                    // Find exact match
                                    const match = allAvailableOptions.find(v => {
                                        return activeDimensions.every((d: any) => {
                                            const dimVal = getDimensionValue(v, d.column);
                                            const selectedVal = newSelections[d.column as string];
                                            return String(dimVal) === String(selectedVal);
                                        });
                                    });
                                    setSelectedVariant(match || null);
                                } else {
                                    setSelectedVariant(null);
                                }
                              }}
                              disabled={!isEnabled}
                          >
                              <option value="">-- Select {dim.label.toLowerCase()} --</option>
                              {uniqueValues.map((val: any) => (
                                  <option key={String(val)} value={String(val)}>
                                      {String(val)}{dim.column === 'color_temperature' && !isNaN(Number(val)) ? 'K' : ''}
                                  </option>
                              ))}
                          </select>
                      </div>
                  );
                })
              ) : (
                <>
                  <div className={styles.dropdownGroup}>
                    <label className={styles.variantLabel}>Select {config.variantTypeLabel || 'Type'}:</label>
                    <select 
                      className={styles.variantDropdown}
                      value={dimensionSelections['variant_type'] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDimensionSelections({ 'variant_type': val });
                        setSelectedVariant(null);
                      }}
                    >
                      <option value="">-- Select --</option>
                      {Array.from(new Set(allAvailableOptions.map(v => getDimensionValue(v, 'variant_type')))).filter(Boolean).map((t: any) => <option key={String(t)} value={String(t)}>{String(t)}</option>)}
                    </select>
                  </div>
                  {dimensionSelections['variant_type'] && (
                    <div className={styles.dropdownGroup}>
                      <label className={styles.variantLabel}>Options:</label>
                      <select 
                        className={styles.variantDropdown}
                        value={selectedVariant?.id || ''}
                        onChange={(e) => {
                           const vId = e.target.value;
                           const v = allAvailableOptions.find(opt => String(opt.id) === vId);
                           setSelectedVariant(v || null);
                        }}
                      >
                        <option value="">-- Select --</option>
                        {allAvailableOptions
                            .filter(v => String(getDimensionValue(v, 'variant_type')) === String(dimensionSelections['variant_type']))
                            .map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.color_temperature || v.variant_color || 'Default'}
                                </option>
                            ))
                        }
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className={styles.priceSection}>
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Unit Price:</span>
              <span className={styles.unitPrice}>
                {settings.currency_symbol}{(currentPrice || 0).toFixed(2)}
              </span>
            </div>
            <div className={styles.priceRow}>
              <span className={styles.priceLabel}>Total Price:</span>
              <span className={styles.totalPrice}>
                {settings.currency_symbol}{totalPrice.toFixed(2)}
              </span>
            </div>
          </div>

          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>
              <Eye size={16} />
              Item Technical Specifications
            </h3>
            <div className={styles.detailsGrid} style={{ display: 'block' }}>
               <DynamicCategorySpecs 
                 item={selectedVariant ? { ...item, ...selectedVariant } : item} 
                 labelStyle={{ color: '#888', minWidth: '100px', fontSize: '10px' }}
                 valueStyle={{ color: '#fff', fontSize: '12px', borderBottom: '1px solid #333', padding: '4px 0' }}
               />
            </div>
          </div>

          <div className={styles.quantitySection}>
            <h3 className={styles.sectionTitle}>Select Quantity</h3>
            <div className={styles.quickQuantityButtons}>
              {[1, 2, 5, 10].map(qty => (
                <button
                  key={qty}
                  className={`${styles.quickQtyBtn} ${Number(quantity) === qty ? styles.quickQtyActive : ''}`}
                  onClick={() => handleQuickAdd(qty)}
                  disabled={qty > maxQuantity}
                >
                  {qty}
                </button>
              ))}
            </div>
            <div className={styles.quantityControls}>
              <button className={styles.quantityBtn} onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                <Minus size={16} />
              </button>
              <div className={styles.quantityDisplay}>
                <input
                  type="number" min="1" max={maxQuantity} value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val >= 1 && val <= maxQuantity) setQuantity(val);
                  }}
                  className={styles.quantityInput}
                />
                <span className={styles.quantityLabel}>units</span>
              </div>
              <button className={styles.quantityBtn} onClick={() => handleQuantityChange(1)} disabled={quantity >= maxQuantity}>
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button 
            className={`${styles.addToCartBtn} ${isOutOfStock ? styles.disabled : ''}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart size={18} />
            {isOutOfStock ? 'Out of Stock' : `Add ${quantity} to Cart`}
          </button>
        </div>
      </div>
    </div>
  );
}
