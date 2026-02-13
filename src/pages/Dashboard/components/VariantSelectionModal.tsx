import { useState, useEffect } from 'react';
import { X, Package, ShoppingCart, Plus, Minus } from 'lucide-react';
import styles from './VariantSelectionModal.module.css';

interface Variant {
  variant_id: string;
  display_name: string;
  compatibility_list: string[];
  final_price: number;
  stock_quantity: number;
  is_primary: boolean;
  variant_description?: string;
  color_temperature?: string | number;
}

interface ProductVariant {
  product_id: string;
  sku: string;
  base_name: string;
  brand: string;
  base_price: number;
  category: string;
  image_url: string;
  color_temperature?: string | number;
  variants: Variant[];
}

interface VariantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductVariant | null;
  onVariantSelect: (variant: Variant, quantity: number) => void;
}

export default function VariantSelectionModal({ 
  isOpen, 
  onClose, 
  product, 
  onVariantSelect 
}: VariantSelectionModalProps) {
  const [selectedSocket, setSelectedSocket] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Reset state when modal opens/closes or product changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSocket('');
      setSelectedColor('');
      setQuantity(1);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Derived Lists
  const allVariants = product.variants.map(v => ({
    ...v,
    color_temperature: v.color_temperature ? String(v.color_temperature) : undefined
  }));

  // 1. Get Unique Sockets (based on compatibility_list join)
  const uniqueSockets = Array.from(new Set(allVariants.map(v => v.compatibility_list.join(' / '))));
  
  // 2. Get Unique Colors
  const uniqueColors = Array.from(new Set(allVariants.map(v => v.color_temperature || 'Standard')));

  // Filtered Options based on selection
  const availableSockets = selectedColor 
    ? Array.from(new Set(allVariants.filter(v => (v.color_temperature || 'Standard') === selectedColor).map(v => v.compatibility_list.join(' / '))))
    : uniqueSockets;

  const availableColors = selectedSocket
    ? Array.from(new Set(allVariants.filter(v => v.compatibility_list.join(' / ') === selectedSocket).map(v => v.color_temperature || 'Standard')))
    : uniqueColors;

  // Determine Selected Variant
  const selectedVariant = allVariants.find(v => 
    v.compatibility_list.join(' / ') === selectedSocket && 
    (v.color_temperature || 'Standard') === selectedColor
  ) || null;

  // Auto-select if only 1 option available in the filtered list?
  // Maybe not, let user choose explicitly to avoid confusion, unless it's the *only* option total.
  // Actually, if I select a socket and there is only 1 color, it's nice to auto-select it.
  // But let's keep it manual for standard "filtering" feel unless requested.

  const handleSocketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setSelectedSocket(newVal);
    
    // If current color is not valid for this socket, reset it
    const validColorsForSocket = allVariants
        .filter(v => v.compatibility_list.join(' / ') === newVal)
        .map(v => v.color_temperature || 'Standard');
    
    if (selectedColor && !validColorsForSocket.includes(selectedColor)) {
        setSelectedColor('');
    }
    setQuantity(1);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setSelectedColor(newVal);

    // If current socket is not valid for this color, reset it
    const validSocketsForColor = allVariants
        .filter(v => (v.color_temperature || 'Standard') === newVal)
        .map(v => v.compatibility_list.join(' / '));
        
    if (selectedSocket && !validSocketsForColor.includes(selectedSocket)) {
        setSelectedSocket('');
    }
    setQuantity(1);
  };


  const handleSelect = () => {
    if (selectedVariant && quantity > 0 && quantity <= selectedVariant.stock_quantity) {
      onVariantSelect(selectedVariant, quantity);
      onClose();
      // Reset
      setSelectedSocket('');
      setSelectedColor('');
      setQuantity(1);
    }
  };

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { text: 'OUT OF STOCK', className: styles.outStock };
    if (qty < 5) return { text: 'LOW STOCK', className: styles.lowStock }; 
    return { text: 'IN STOCK', className: styles.inStock };
  };

  const canAddToCart = selectedVariant && 
                       quantity > 0 && 
                       quantity <= selectedVariant.stock_quantity &&
                       selectedVariant.stock_quantity > 0;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.productInfo}>
            <h2>Select Option</h2>
            <div className={styles.productDetails}>
              <span className={styles.productName}>{product.base_name}</span>
              <span className={styles.brand}>{product.brand}</span>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 1. Socket Dropdown */}
          <div className={styles.dropdownWrapper}>
            <label className={styles.dropdownLabel}>Choose Compatibility</label>
            <select 
              className={styles.variantSelect}
              value={selectedSocket}
              onChange={handleSocketChange}
            >
              <option value="" disabled>-- SELECT SOCKET --</option>
              {uniqueSockets.map(socket => {
                  const isAvailable = availableSockets.includes(socket);
                  return (
                    <option 
                      key={socket} 
                      value={socket}
                      disabled={!isAvailable}
                    >
                       {socket} {!isAvailable ? '(Unavailable with selected color)' : ''}
                    </option>
                  );
              })}
            </select>
          </div>

          {/* 2. Color Temperature Dropdown */}
          <div className={styles.dropdownWrapper} style={{ marginTop: 16 }}>
            <label className={styles.dropdownLabel}>Color Temperature</label>
             <select 
              className={styles.variantSelect}
              value={selectedColor}
              onChange={handleColorChange}
              disabled={uniqueColors.length <= 1 && !selectedSocket} // Disable if only 1 color ever? Maybe just let them see it.
            >
              <option value="" disabled>-- SELECT COLOR --</option>
              {uniqueColors.map(color => {
                  const isAvailable = availableColors.includes(color);
                  // Append K if numeric
                  const displayColor = /^\d+$/.test(color) ? `${color}K` : color;
                   return (
                    <option 
                      key={color} 
                      value={color}
                      disabled={!isAvailable}
                    >
                       {displayColor} {!isAvailable ? '(Unavailable with selected socket)' : ''}
                    </option>
                  );
              })}
            </select>
          </div>

          {/* 3. Details Area (Price, Stock, Etc) - Only show if both selected */}
          {selectedVariant ? (
            <div className={styles.variantDetails}>
              <div className={styles.detailRow}>
                 <span className={styles.detailLabel}>Price</span>
                 <span className={styles.priceValue}>${selectedVariant.final_price.toFixed(2)}</span>
              </div>

              <div className={styles.detailRow}>
                 <span className={styles.detailLabel}>Stock Status</span>
                 <span className={`${styles.stockStatus} ${getStockStatus(selectedVariant.stock_quantity).className}`}>
                    {getStockStatus(selectedVariant.stock_quantity).text} ({selectedVariant.stock_quantity})
                 </span>
              </div>
              
              <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Compatibility</span>
                  <span className={styles.detailValue}>
                    {selectedVariant.compatibility_list.join(' / ')}
                  </span>
              </div>

              {/* Quantity Selector inside details */}
               <div className={styles.quantityControl}>
                  <span className={styles.detailLabel}>Quantity</span>
                  <div className={styles.qtyWrapper}>
                    <button 
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span className={styles.qtyDisplay}>{quantity}</span>
                    <button 
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(Math.min(selectedVariant.stock_quantity, quantity + 1))}
                      disabled={quantity >= selectedVariant.stock_quantity}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
               </div>
            </div>
          ) : (
            <div className={styles.variantDetails} style={{ alignItems: 'center', justifyContent: 'center', minHeight: '150px', color: '#444' }}>
              <Package size={32} style={{ marginBottom: 10, opacity: 0.5 }} />
              <span className={styles.detailLabel}>Please select an option above</span>
            </div>
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
             {selectedVariant ? `ADD ${quantity} TO CART` : 'ADD TO CART'}
          </button>
        </div>
      </div>
    </div>
  );
}
