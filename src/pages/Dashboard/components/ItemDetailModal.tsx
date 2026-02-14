import { useState } from 'react';
import { X, Plus, Minus, Package, ShoppingCart, Eye, Info } from 'lucide-react';
import styles from './ItemDetailModal.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { useSettings } from '../../../context/SettingsContext';

interface ItemDetailModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onAddToCart: (item: InventoryItem, quantity: number) => void;
  variants?: any[]; // Available variants for this product
  onVariantSelect?: (variant: any, quantity: number) => void; // Callback when variant is selected
}

/**
 * ItemDetailModal component - Modal for displaying detailed item information in POS
 * Shows comprehensive product details with add to cart functionality
 * @param isOpen - Whether the modal is open
 * @param item - The inventory item to display details for
 * @param onClose - Callback function to close the modal
 * @param onAddToCart - Callback function to add item to cart with specified quantity
 * @param variants - Optional array of variants for this product
 * @param onVariantSelect - Optional callback when a variant is selected
 */
export default function ItemDetailModal({ isOpen, item, onClose, onAddToCart, variants, onVariantSelect }: ItemDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [selectedBulbType, setSelectedBulbType] = useState<string>('');
  const { settings } = useSettings();

  if (!isOpen || !item) return null;

  const hasVariants = variants && variants.length > 0;

  // Normalize parent as an "option" to include it in dropdowns
  // Use actual product specs and only fallback if totally missing in DB
  const parentOption = {
    id: 'parent',
    bulb_type: item.bulb_type || 'Base', 
    color_temperature: item.color_temperature || 'Original',
    selling_price: item.price,
    stock_quantity: item.stock ?? item.quantity ?? 0,
    min_stock_level: item.minQuantity,
    isParent: true
  };

  // Combine parent and variants for the dropdown lists
  const allAvailableOptions = [
    ...(hasVariants ? variants : []),
    parentOption // Always include parent as an option
  ];

  // Get unique bulb types from the combined list
  // Ensure we don't filter out our fallbacks
  const uniqueBulbTypes = Array.from(new Set(allAvailableOptions.map(v => v.bulb_type))).filter(Boolean);

  // Get available temperatures for selected bulb type from the combined list
  const availableTemperatures = selectedBulbType
    ? allAvailableOptions
        .filter(v => v.bulb_type === selectedBulbType)
        .map(v => ({
          value: v.color_temperature,
          variant: v
        }))
    : [];

  // Use selected variant's data if available, otherwise use parent product data
  const currentPrice = selectedVariant ? selectedVariant.selling_price : (item.price || 0);
  const stock = selectedVariant ? selectedVariant.stock_quantity : (item.stock ?? item.quantity ?? 0);
  const currentMinStock = selectedVariant?.min_stock_level ?? item.minQuantity ?? settings.low_stock_threshold;
  const currentTemperature = selectedVariant ? selectedVariant.color_temperature : item.color_temperature;
  const currentBulbType = selectedVariant ? selectedVariant.bulb_type : item.bulb_type;
  
  const isOutOfStock = stock <= 0;
  const maxQuantity = Math.min(stock, 99); // Limit to reasonable amount

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!isOutOfStock && quantity > 0) {
      // If a real variant is selected (not the parent), use variant select
      if (selectedVariant && !selectedVariant.isParent && onVariantSelect) {
        onVariantSelect(selectedVariant, quantity);
      } else {
        // Otherwise add the base parent product
        onAddToCart(item, quantity);
      }
      onClose();
      setQuantity(1); // Reset quantity for next use
      setSelectedVariant(null); // Reset variant selection
      setSelectedBulbType(''); // Reset bulb type selection
    }
  };

  const handleQuickAdd = (qty: number) => {
    if (qty <= maxQuantity) {
      setQuantity(qty);
    }
  };

  // Calculate stock status
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
        {/* Modal Header */}
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
              <h2>{item.name}</h2>
              <p className={styles.sku}>SKU: {item.sku || 'NO SKU'}</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          {/* Stock Status */}
          <div className={styles.stockSection}>
            <div className={styles.stockInfo}>
              <span className={styles.stockLabel}>Stock Status:</span>
              <span 
                className={styles.stockStatus}
                style={{ color: stockStatus.color }}
              >
                {stockStatus.status}
              </span>
            </div>
            <div className={styles.stockQuantity}>
              <span className={styles.stockNumber}>{stock}</span>
              <span className={styles.stockUnit}>units available</span>
              {currentMinStock > 0 && (
                <span className={styles.minStockInfo}> (Min: {currentMinStock})</span>
              )}
            </div>

            {/* Selection Specs */}
            {(currentBulbType || currentTemperature) && (
              <div className={styles.selectionSpecs}>
                <span className={styles.specItem}>
                  Type: <strong>{currentBulbType || 'Base'}</strong>
                </span>
                {currentTemperature && (
                  <span className={styles.specItem}>
                    Temp: <strong>{currentTemperature}{!isNaN(Number(currentTemperature)) ? 'K' : ''}</strong>
                  </span>
                )}
              </div>
            )}

            {stock > 0 && stock < currentMinStock && (
              <div className={styles.lowStockWarning}>
                <Info size={14} />
                Low stock - reorder soon
              </div>
            )}
          </div>

          {/* Variant Selection Dropdowns */}
          {hasVariants && (
            <div className={styles.variantSection}>
              {/* Bulb Type Dropdown */}
              <div className={styles.dropdownGroup}>
                <label className={styles.variantLabel}>
                  Select Bulb Type:
                </label>
                <select 
                  className={styles.variantDropdown}
                  value={selectedBulbType}
                  onChange={(e) => {
                    const bulbType = e.target.value;
                    setSelectedBulbType(bulbType);
                    // Reset variant and temperature when bulb type changes
                    setSelectedVariant(null);
                  }}
                >
                  <option value="">-- Select bulb type --</option>
                  {uniqueBulbTypes.map((bulbType) => (
                    <option key={bulbType} value={bulbType}>
                      {bulbType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Temperature Dropdown (only show if bulb type is selected) */}
              {selectedBulbType && availableTemperatures.length > 0 && (
                <div className={styles.dropdownGroup}>
                  <label className={styles.variantLabel}>
                    Select Color Temperature:
                  </label>
                  <select 
                    className={styles.variantDropdown}
                    value={selectedVariant?.id || ''}
                    onChange={(e) => {
                      const variantId = e.target.value;
                      const tempOption = availableTemperatures.find(t => t.variant.id.toString() === variantId);
                      setSelectedVariant(tempOption?.variant || null);
                    }}
                  >
                    <option value="">-- Select temperature --</option>
                    {availableTemperatures.map(({ value, variant }) => (
                      <option key={variant.id} value={variant.id}>
                        {value}{!value || isNaN(Number(value)) ? '' : 'K'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Price Information */}
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

          {/* Item Details */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>
              <Eye size={16} />
              Item Details
            </h3>
            <div className={styles.detailsGrid}>
              {item.category && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Category:</span>
                  <span className={styles.detailValue}>{item.category}</span>
                </div>
              )}
              {item.brand && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Brand:</span>
                  <span className={styles.detailValue}>{item.brand}</span>
                </div>
              )}
              {currentMinStock !== undefined && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Min Stock:</span>
                  <span className={styles.detailValue}>{currentMinStock} units</span>
                </div>
              )}
              {item.description && (
                <div className={styles.detailItem} style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <span className={styles.detailLabel}>Description:</span>
                  <span className={styles.detailValue} style={{ textTransform: 'none', lineHeight: '1.4' }}>{item.description}</span>
                </div>
              )}
              {/* Display Note - Prioritize variant color/note, fallback to item note */}
              {(selectedVariant?.variant_color || item.notes) && (
                <div className={styles.detailItem} style={{ gridColumn: '1 / -1', marginTop: '8px', borderTop: '1px dashed #333', paddingTop: '8px' }}>
                  <span className={styles.detailLabel} style={{ color: '#00ff9d' }}>Note:</span>
                  <span className={styles.detailValue} style={{ color: '#fff', fontStyle: 'italic' }}>
                    {selectedVariant?.variant_color || item.notes}
                  </span>
                </div>
              )}
              {selectedVariant?.description && (
                <div className={styles.detailItem} style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                  <span className={styles.detailLabel} style={{ color: '#00ff9d' }}>Desc:</span>
                  <span className={styles.detailValue} style={{ color: '#fff' }}>
                    {selectedVariant.description}
                  </span>
                </div>
              )}
            </div>
          </div>



          {/* Quantity Selector */}
          <div className={styles.quantitySection}>
            <h3 className={styles.sectionTitle}>Select Quantity</h3>
            
            {/* Quick Quantity Buttons */}
            <div className={styles.quickQuantityButtons}>
              {[1, 2, 5, 10].map(qty => (
                <button
                  key={qty}
                  className={`${styles.quickQtyBtn} ${quantity === qty ? styles.quickQtyActive : ''}`}
                  onClick={() => handleQuickAdd(qty)}
                  disabled={qty > maxQuantity}
                >
                  {qty}
                </button>
              ))}
            </div>

            {/* Manual Quantity Input */}
            <div className={styles.quantityControls}>
              <button 
                className={styles.quantityBtn}
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <div className={styles.quantityDisplay}>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    if (val >= 1 && val <= maxQuantity) {
                      setQuantity(val);
                    }
                  }}
                  className={styles.quantityInput}
                />
                <span className={styles.quantityLabel}>units</span>
              </div>
              <button 
                className={styles.quantityBtn}
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= maxQuantity}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>
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
