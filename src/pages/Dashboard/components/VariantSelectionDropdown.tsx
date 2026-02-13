import { useState } from 'react';
import { X, Package, Box, ShoppingCart, Plus, Minus, ChevronDown } from 'lucide-react';
import styles from './VariantSelectionDropdown.module.css';

interface Variant {
  variant_id: string;
  display_name: string;
  compatibility_list: string[];
  final_price: number;
  stock_quantity: number;
  is_primary: boolean;
  variant_description?: string;
}

interface ProductVariant {
  product_id: string;
  sku: string;
  base_name: string;
  brand: string;
  base_price: number;
  category: string;
  image_url: string;
  variants: Variant[];
}

interface VariantSelectionDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductVariant | null;
  onVariantSelect: (variant: Variant, quantity: number) => void;
}

export default function VariantSelectionDropdown({ 
  isOpen, 
  onClose, 
  product, 
  onVariantSelect 
}: VariantSelectionDropdownProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isOpen || !product) return null;

  const handleSelect = () => {
    if (selectedVariant && quantity > 0 && quantity <= selectedVariant.stock_quantity) {
      onVariantSelect(selectedVariant, quantity);
      onClose();
      setSelectedVariant(null);
      setQuantity(1);
      setIsDropdownOpen(false);
    }
  };

  const handleVariantClick = (variant: Variant) => {
    setSelectedVariant(variant);
    setIsDropdownOpen(false);
    // Reset quantity if it exceeds stock of new variant
    if (quantity > variant.stock_quantity) {
      setQuantity(Math.min(1, variant.stock_quantity));
    }
  };

  const formatCompatibility = (compatibility: string[]) => {
    return compatibility.join(' / ');
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { text: 'Out of Stock', color: '#ef4444' };
    if (quantity < 5) return { text: 'Low Stock', color: '#f59e0b' };
    return { text: 'In Stock', color: '#10b981' };
  };

  const canAddToCart = selectedVariant && 
                       quantity > 0 && 
                       quantity <= selectedVariant.stock_quantity &&
                       selectedVariant.stock_quantity > 0;

  const getDisplayText = () => {
    if (!selectedVariant) return 'Select Socket / Bulb Type';
    return selectedVariant.display_name;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.productInfo}>
            <h2>Select Socket / Bulb Type</h2>
            <div className={styles.productDetails}>
              <span className={styles.productName}>{product.base_name}</span>
              <span className={styles.brand}>{product.brand}</span>
              <span className={styles.category}>{product.category}</span>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Socket/Bulb Type Dropdown */}
          <div className={styles.dropdownSection}>
            <label className={styles.dropdownLabel}>
              <Package size={16} />
              Socket / Bulb Type
            </label>
            <div className={styles.dropdownContainer}>
              <button 
                className={styles.dropdownButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className={styles.dropdownText}>
                  {getDisplayText()}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.open : ''}`}
                />
              </button>
              
              {isDropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {product.variants.map((variant) => {
                    const stockStatus = getStockStatus(variant.stock_quantity);
                    const isSelected = selectedVariant?.variant_id === variant.variant_id;
                    
                    return (
                      <div
                        key={variant.variant_id}
                        className={`${styles.dropdownItem} ${isSelected ? styles.selected : ''} ${variant.stock_quantity === 0 ? styles.disabled : ''}`}
                        onClick={() => variant.stock_quantity > 0 && handleVariantClick(variant)}
                      >
                        <div className={styles.itemHeader}>
                          <span className={styles.itemName}>{variant.display_name}</span>
                          {variant.is_primary && (
                            <span className={styles.primaryBadge}>Most Popular</span>
                          )}
                        </div>
                        
                        <div className={styles.itemDetails}>
                          <div className={styles.compatibility}>
                            Compatible: {formatCompatibility(variant.compatibility_list)}
                          </div>
                          <div className={styles.itemFooter}>
                            <span className={styles.itemPrice}>${variant.final_price.toFixed(2)}</span>
                            <span className={styles.itemStock} style={{ color: stockStatus.color }}>
                              {stockStatus.text} ({variant.stock_quantity})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Selected Variant Details */}
          {selectedVariant && (
            <div className={styles.selectedVariantDetails}>
              <h3>Selected Option Details</h3>
              <div className={styles.detailsCard}>
                <div className={styles.detailsHeader}>
                  <Package size={16} />
                  {selectedVariant.display_name}
                </div>
                
                <div className={styles.compatibilityInfo}>
                  <strong>Compatible with:</strong> {formatCompatibility(selectedVariant.compatibility_list)}
                </div>

                {selectedVariant.variant_description && (
                  <div className={styles.description}>
                    {selectedVariant.variant_description}
                  </div>
                )}

                <div className={styles.stockInfo}>
                  <Box size={16} />
                  <span style={{ color: getStockStatus(selectedVariant.stock_quantity).color }}>
                    {getStockStatus(selectedVariant.stock_quantity).text} ({selectedVariant.stock_quantity} available)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          {selectedVariant && (
            <div className={styles.quantitySection}>
              <div className={styles.quantityLabel}>
                <strong>Quantity:</strong>
              </div>
              <div className={styles.quantityControls}>
                <button 
                  className={styles.quantityBtn}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus size={14} />
                </button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button 
                  className={styles.quantityBtn}
                  onClick={() => setQuantity(Math.min(selectedVariant.stock_quantity, quantity + 1))}
                  disabled={quantity >= selectedVariant.stock_quantity}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className={styles.totalPrice}>
                Total: ${(selectedVariant.final_price * quantity).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className={styles.selectButton}
            disabled={!canAddToCart}
          >
            <ShoppingCart size={16} />
            {selectedVariant ? `Add ${quantity} to Cart - $${(selectedVariant.final_price * quantity).toFixed(2)}` : 'Select Socket Type'}
          </button>
        </div>
      </div>
    </div>
  );
}
