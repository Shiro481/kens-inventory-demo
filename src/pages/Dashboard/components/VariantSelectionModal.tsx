import { useState, useEffect } from 'react';
import { X, Package, ShoppingCart, Plus, Minus, Zap } from 'lucide-react';
import styles from './VariantSelectionModal.module.css';

interface ProductVariant {
  id: number;
  bulb_type: string;
  color_temperature?: number;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock_level: number;
  variant_color?: string;
  variant_sku?: string;
}

interface ProductInfo {
  uuid: string;
  name: string;
  brand: string;
  category: string;
  image_url?: string;
}

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductInfo | null;
  variants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant, quantity: number) => void;
}

export default function VariantSelectionModal({ 
  isOpen, 
  onClose, 
  product,
  variants,
  onVariantSelect 
}: VariantSelectionModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVariantId(null);
      setQuantity(1);
    } else if (variants.length === 1) {
      // Auto-select if only one variant
      setSelectedVariantId(variants[0].id);
    }
  }, [isOpen, variants]);

  if (!isOpen || !product) return null;

  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  const handleSelect = () => {
    if (selectedVariant && quantity > 0 && quantity <= selectedVariant.stock_quantity) {
      onVariantSelect(selectedVariant, quantity);
      onClose();
      setSelectedVariantId(null);
      setQuantity(1);
    }
  };

  const getStockStatus = (qty: number, minLevel: number) => {
    if (qty === 0) return { text: 'OUT OF STOCK', className: styles.outStock };
    if (qty < minLevel) return { text: 'LOW STOCK', className: styles.lowStock }; 
    return { text: 'IN STOCK', className: styles.inStock };
  };

  const canAddToCart = selectedVariant && 
                       quantity > 0 && 
                       quantity <= selectedVariant.stock_quantity &&
                       selectedVariant.stock_quantity > 0;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.productInfo}>
            <h2>Select Variant</h2>
            <div className={styles.productDetails}>
              <span className={styles.productName}>{product.name}</span>
              <span className={styles.brand}>{product.brand}</span>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {variants.length === 0 ? (
            <div className={styles.emptyState}>
              <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <p style={{ color: '#666', fontSize: '14px' }}>No variants configured for this product</p>
            </div>
          ) : (
            <>
              {/* Variant Cards */}
              <div className={styles.variantGrid}>
                {variants.map(variant => {
                  const isSelected = selectedVariantId === variant.id;
                  const stockStatus = getStockStatus(variant.stock_quantity, variant.min_stock_level);
                  const isOutOfStock = variant.stock_quantity === 0;

                  return (
                    <div
                      key={variant.id}
                      className={`${styles.variantCard} ${isSelected ? styles.selected : ''} ${isOutOfStock ? styles.disabled : ''}`}
                      onClick={() => !isOutOfStock && setSelectedVariantId(variant.id)}
                    >
                      <div className={styles.variantHeader}>
                        <div className={styles.variantTitle}>
                          <Zap size={16} style={{ opacity: 0.7 }} />
                          <span>{variant.bulb_type}</span>
                        </div>
                        {isSelected && (
                          <div className={styles.selectedBadge}>SELECTED</div>
                        )}
                      </div>

                      <div className={styles.variantInfo}>
                        {variant.color_temperature && (
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Color Temp:</span>
                            <span className={styles.infoValue}>{variant.color_temperature}K</span>
                          </div>
                        )}
                        {variant.variant_color && (
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>Color:</span>
                            <span className={styles.infoValue}>{variant.variant_color}</span>
                          </div>
                        )}
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Price:</span>
                          <span className={styles.priceValue}>${variant.selling_price.toFixed(2)}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Stock:</span>
                          <span className={`${styles.stockBadge} ${stockStatus.className}`}>
                            {stockStatus.text} ({variant.stock_quantity})
                          </span>
                        </div>
                        {variant.variant_sku && (
                          <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>SKU:</span>
                            <span className={styles.skuValue}>{variant.variant_sku}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quantity Selector - Only show when variant is selected */}
              {selectedVariant && (
                <div className={styles.quantitySection}>
                  <span className={styles.quantityLabel}>Quantity</span>
                  <div className={styles.qtyWrapper}>
                    <button 
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className={styles.qtyDisplay}>{quantity}</span>
                    <button 
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(Math.min(selectedVariant.stock_quantity, quantity + 1))}
                      disabled={quantity >= selectedVariant.stock_quantity}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
             CANCEL
          </button>
          <button 
            onClick={handleSelect} 
            className={styles.selectButton}
            disabled={!canAddToCart}
          >
             <ShoppingCart size={18} />
             {selectedVariant ? `ADD ${quantity} TO CART - $${(selectedVariant.selling_price * quantity).toFixed(2)}` : 'SELECT A VARIANT'}
          </button>
        </div>
      </div>
    </div>
  );
}
