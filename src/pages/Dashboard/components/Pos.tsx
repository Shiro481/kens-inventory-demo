import { useState } from 'react';
import { Search, ShoppingCart, Box, Minus, Plus, CreditCard, Banknote, Loader2, Check } from 'lucide-react';
import styles from './Pos.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import ItemDetailModal from './ItemDetailModal';
import VariantSelectionModal from './VariantSelectionModal';

interface CartItem extends InventoryItem {
  cartQuantity: number;
  variant_id?: string | number;
  variant_display_name?: string;
  variant_price?: number;
}



interface PosProps {
  items: InventoryItem[];
  onSaleComplete?: () => void;
}

/**
 * Pos component - Point of Sale interface for processing sales transactions
 * @param items - Array of inventory items available for sale
 * @param onSaleComplete - Callback function called after successful sale
 */
export default function Pos({ items, onSaleComplete }: PosProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card'>('Cash');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<InventoryItem | null>(null);
  const [productVariants, setProductVariants] = useState<any[]>([]);

  /**
   * Filter inventory items based on search query
   * Searches in name, SKU, and category fields
   * Excludes variant items - only shows parent products
   */
  const filteredItems = items.filter(item => {
    // Hide variant items in POS - only show parent products
    if ((item as any).is_variant === true) {
      return false;
    }
    
    const query = searchQuery.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(query) ||
      (item.sku || '').toLowerCase().includes(query) ||
      (item.category || '').toLowerCase().includes(query)
    );
  });

  /**
   * Add item to cart with stock validation
   * @param item - Inventory item to add to cart
   */
  const addToCart = (item: InventoryItem, quantity: number = 1) => {
    const stock = item.stock ?? item.quantity ?? 0;
    if (stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.cartQuantity + quantity > stock) return prev;
        return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + quantity } : i);
      }
      return [...prev, { ...item, cartQuantity: quantity }];
    });
  };

  /**
   * Handle item click - show item detail modal
   * Fetches variants if product has them
   * @param item - Inventory item that was clicked
   */
  const handleItemClick = async (item: InventoryItem) => {
    console.log('🔍 [POS] Item clicked:', {
      name: item.name,
      has_variants: item.has_variants,
      uuid: item.uuid
    });

    // Fetch variants if product has them
    if (item.has_variants && item.uuid && supabase) {
      try {
        setLoading(true);
        const { data: variants, error } = await supabase
          .from('product_bulb_variants')
          .select('*')
          .eq('product_id', item.uuid);

        if (!error && variants) {
          setProductVariants(variants);
        } else {
          setProductVariants([]);
        }
      } catch (err) {
        console.error('Error fetching variants:', err);
        setProductVariants([]);
      } finally {
        setLoading(false);
      }
    } else {
      setProductVariants([]);
    }

    // Show item detail modal
    setSelectedItem(item);
    setShowItemDetailModal(true);
  };

  /**
   * Handle variant selection from modal with quantity
   * @param variant - Selected variant from product_bulb_variants
   * @param quantity - Selected quantity
   */
  const handleVariantSelect = (variant: any, quantity: number) => {
    if (!selectedItem) return;

    // Create a cart item from the variant
    const cartItem: CartItem = {
      id: (selectedItem.id || 0) * 10000 + variant.id,
      name: `${selectedItem.name} (${variant.bulb_type})`,
      brand: selectedItem.brand || '',
      category: selectedItem.category || '',
      price: variant.selling_price,
      stock: variant.stock_quantity,
      quantity: variant.stock_quantity,
      sku: variant.variant_sku || selectedItem.sku || '',
      image_url: selectedItem.image_url,
      cartQuantity: quantity,
      variant_id: variant.id.toString(),
      variant_display_name: variant.bulb_type + (variant.color_temperature ? ` (${variant.color_temperature}K)` : ''),
      variant_price: variant.selling_price,
      description: variant.description || selectedItem.description || '',
      color_temperature: variant.color_temperature,
      has_variants: true,
      uuid: selectedItem.uuid
    };

    // Add to cart
    setCart(prev => {
      const existing = prev.find(i => i.id === cartItem.id);
      if (existing) {
        if (existing.cartQuantity + quantity > variant.stock_quantity) return prev;
        return prev.map(i => i.id === cartItem.id ? { ...i, cartQuantity: i.cartQuantity + quantity } : i);
      }
      return [...prev, cartItem];
    });

    // Close modal
    setShowVariantModal(false);
    setSelectedProductForVariant(null);
    setProductVariants([]);
  };

  /**
   * Close variant modal
   */
  const closeVariantModal = () => {
    setShowVariantModal(false);
    setSelectedProductForVariant(null);
    setProductVariants([]);
  };

  /**
   * Handle add to cart from modal
   * @param item - Inventory item to add
   * @param quantity - Quantity to add
   */
  const handleAddToCartFromModal = (item: InventoryItem, quantity: number) => {
    addToCart(item, quantity);
  };

  /**
   * Close item detail modal
   */
  const closeItemDetailModal = () => {
    setShowItemDetailModal(false);
    setSelectedItem(null);
  };

  /**
   * Update cart item quantity with stock validation
   * @param id - Item ID to update
   * @param delta - Quantity change (positive or negative)
   */
  const updateCartQuantity = (id: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.cartQuantity + delta;
          const stock = item.stock ?? item.quantity ?? 0;
          if (newQty <= 0) return item; // Handled by removal usually, but safe
          if (newQty > stock) return item;
          return { ...item, cartQuantity: newQty };
        }
        return item;
      }).filter(item => item.cartQuantity > 0);
    });
  };

  /**
   * Remove item from cart completely
   * @param id - Item ID to remove
   */
  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  /**
   * Handle payment button click - opens payment modal
   */
  const handlePaymentClick = () => {
    if (cart.length === 0 || loading) return;
    setShowPaymentModal(true);
    setPaymentSuccess(false);
  };

  /**
   * Confirm and process payment transaction
   * Updates stock levels and records sale in database
   */
  const handleConfirmPayment = async () => {
    if (cart.length === 0 || !supabase || loading) return;
    
    setLoading(true);
    try {
      // 1. Update stock for each item in the cart
      for (const item of cart) {
        const currentStock = item.stock ?? item.quantity ?? 0;
        const newStock = currentStock - item.cartQuantity;
        
        const payload: any = {
          stock_quantity: newStock
        };

        let updateError = null;

        if (item.variant_id) {
            // Update Variant Stock
            const { error } = await supabase
              .from('product_bulb_variants')
              .update(payload)
              .eq('id', item.variant_id);
            updateError = error;
        } else {
            // Update Product Stock
            // Ensure we use the correct UUID if available, otherwise numeric ID
            const idToUse = item.uuid || item.id;
            const { error } = await supabase
              .from('products')
              .update(payload)
              .eq('id', idToUse);
            updateError = error;
        }

        if (updateError) throw updateError;
      }

      // 2. Record the Sale
      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          items: cart.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.cartQuantity
          })),
          subtotal: subtotal,
          tax: tax,
          total: total,
          payment_method: paymentMethod
        }]);

      if (saleError) throw saleError;

      // 3. Set success state
      setLastTotal(total);
      setPaymentSuccess(true);
      setCart([]);
      
      // 4. Refresh parent data
      if (onSaleComplete) onSaleComplete();
      
    } catch (err: any) {
      console.error('Payment error:', err);
      alert('Error processing payment: ' + (err.message || 'Unknown error'));
      setShowPaymentModal(false);
    } finally {
      setLoading(false);
    }
  };

  const closePaymentModal = () => {
    if (loading) return;
    setShowPaymentModal(false);
    setPaymentSuccess(false);
  };

  const { settings } = useSettings();
  
  // Debug log to trace tax rate updates
  console.log(`[POS] Active Tax Rate: ${settings.tax_rate}%`);

  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.cartQuantity, 0);
  const taxRate = (settings.tax_rate ?? 8.25) / 100;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <div className={styles.container}>
      {/* Left Main POS Area */}
      <div className={styles.posMain}>
        <header className={styles.header}>
          <h1>POINT OF SALE</h1>
        </header>

        <div className={styles.searchBar}>
          <div className={styles.searchInputWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input 
              type="text" 
              placeholder="SEARCH PARTS..." 
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>
          <button className={styles.filterBtn} disabled={loading}>
            <div style={{ width: 4, height: 4, backgroundColor: '#666', borderRadius: '50%', margin: '0 auto' }}></div>
          </button>
        </div>
          <div className={styles.productGrid}>
          {filteredItems.map(item => {
            const stock = item.stock ?? item.quantity ?? 0;
            const isOutOfStock = stock <= 0;
            const hasVariants = item.has_variants === true;
            
            // Simplified "Container Box" for items with variants
            if (hasVariants) {
              return (
                <div 
                  key={item.id} 
                  className={`${styles.variantContainerBox} ${loading ? styles.loading : ''}`}
                  onClick={() => !loading && handleItemClick(item)}
                >
                  <div className={styles.containerLabel}>MULTIPLE OPTIONS</div>
                  <div className={styles.containerName}>{item.name}</div>
                  <div className={styles.containerFooter}>Click to select variant</div>
                </div>
              );
            }

            return (
              <div 
                key={item.id} 
                className={`${styles.productCard} ${isOutOfStock || loading ? styles.outOfStock : ''}`}
                onClick={() => !isOutOfStock && !loading && handleItemClick(item)}
                title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
              >
                <div className={styles.sku}>{item.sku || 'NO SKU'}</div>
                <div className={styles.productName}>{item.name}</div>
                
                <div className={styles.productFooter}>
                  <div className={styles.qtyInfo}>
                    QTY: <span className={styles.qtyValue}>{stock}</span>
                  </div>
                  <div className={styles.price}>{settings.currency_symbol}{(item.price || 0).toFixed(2)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Order Sidebar */}
      <div className={styles.orderSidebar}>
        <header className={styles.orderHeader}>
          <ShoppingCart size={20} />
          <h2>CURRENT ORDER</h2>
          <span className={styles.itemCount}>{cart.reduce((s, i) => s + i.cartQuantity, 0)} ITEMS</span>
        </header>

        <div className={styles.cartList}>
          {cart.length === 0 ? (
            <div className={styles.emptyCart}>
              <Box size={48} />
              <div className={styles.emptyText}>NO ITEMS SELECTED</div>
            </div>
          ) : (
            cart.map(item => (
              <div key={`${item.id}-${item.variant_id || 'default'}`} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemName}>
                    {item.name}
                    {item.variant_display_name && (
                      <div className={styles.variantInfo}>{item.variant_display_name}</div>
                    )}
                  </div>
                  <div className={styles.cartItemPrice}>
                    {settings.currency_symbol}{(item.variant_price || item.price || 0).toFixed(2)}
                  </div>
                </div>
                <div className={styles.cartItemQtyControls}>
                  <button 
                    className={styles.qtyBtn} 
                    onClick={() => updateCartQuantity(item.id, -1)}
                    disabled={loading}
                  >
                    {item.cartQuantity === 1 ? <Box size={14} onClick={() => removeFromCart(item.id)} /> : <Minus size={14} />}
                  </button>
                  <span style={{ minWidth: 20, textAlign: 'center', fontSize: 12, fontWeight: 'bold' }}>{item.cartQuantity}</span>
                  <button 
                    className={styles.qtyBtn} 
                    onClick={() => updateCartQuantity(item.id, 1)}
                    disabled={loading}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.orderSummary}>
          <div className={styles.summaryRow}>
            <span>SUBTOTAL</span>
            <span className={styles.summaryValue}>{settings.currency_symbol}{subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>TAX ({settings.tax_rate}%)</span>
            <span className={styles.summaryValue}>{settings.currency_symbol}{tax.toFixed(2)}</span>
          </div>
          
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>TOTAL</span>
            <span className={styles.totalValue}>{settings.currency_symbol}{total.toFixed(2)}</span>
          </div>

          <button 
            className={`${styles.payBtn} ${cart.length > 0 && !loading ? styles.payBtnActive : ''}`}
            onClick={handlePaymentClick}
            disabled={cart.length === 0 || loading}
          >
             {loading ? <Loader2 size={18} className={styles.spinner} /> : <CreditCard size={18} />}
             {loading ? 'PROCESSING...' : 'PROCESS PAYMENT'}
          </button>
        </div>
      </div>

      {/* CUSTOM PAYMENT MODAL */}
      {showPaymentModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            {!paymentSuccess ? (
              <>
                <div className={styles.modalHeader}>
                  <h2>COMPLETE TRANSACTION</h2>
                  <p>Order Summary & Confirmation</p>
                </div>
                
                  <div className={styles.modalBody}>
                    <div className={styles.paymentMethodSelect}>
                      <h3>PAYMENT METHOD</h3>
                      <div className={styles.methodButtons}>
                        <button 
                          className={`${styles.methodBtn} ${paymentMethod === 'Cash' ? styles.methodBtnActive : ''}`}
                          onClick={() => setPaymentMethod('Cash')}
                          type="button"
                        >
                          <Banknote size={24} />
                          <span>CASH</span>
                        </button>
                        <button 
                          className={`${styles.methodBtn} ${paymentMethod === 'Credit Card' ? styles.methodBtnActive : ''}`}
                          onClick={() => setPaymentMethod('Credit Card')}
                          type="button"
                        >
                          <CreditCard size={24} />
                          <span>CREDIT CARD</span>
                        </button>
                      </div>
                    </div>

                    <div className={styles.summaryDetail}>
                    <div className={styles.summaryItem}>
                      <span>ITEMS count</span>
                      <span>{cart.reduce((s, i) => s + i.cartQuantity, 0)}</span>
                    </div>
                  <div className={styles.summaryItem}>
                    <span>SUBTOTAL</span>
                    <span>{settings.currency_symbol}{subtotal.toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span>TAX ({settings.tax_rate}%)</span>
                    <span>{settings.currency_symbol}{tax.toFixed(2)}</span>
                  </div>
                  <div className={styles.summaryTotal}>
                    <label>TOTAL DUE</label>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#00ff9d' }}>
                      {settings.currency_symbol}{total.toFixed(2)}
                    </span>
                  </div>
                  </div>
                </div>

                <div className={styles.modalFooter}>
                  <button 
                    className={styles.confirmBtn} 
                    onClick={handleConfirmPayment}
                    disabled={loading}
                  >
                    {loading ? 'PROCESSING...' : 'CONFIRM & PAY'}
                  </button>
                  <button 
                    className={styles.cancelModalBtn} 
                    onClick={closePaymentModal}
                    disabled={loading}
                  >
                    CANCEL
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.successContent}>
                <div className={styles.successIcon}>
                  <Check size={40} />
                </div>
                <div className={styles.modalHeader}>
                  <h2 style={{ color: '#00ff9d' }}>PAYMENT SUCCESS</h2>
                  <p>Transaction completed successfully</p>
                </div>
                <div className={styles.summaryDetail}>
                    <div className={styles.summaryItem}>
                      <span>TOTAL PAID</span>
                      <span style={{ color: '#fff' }}>{settings.currency_symbol}{lastTotal.toFixed(2)}</span>
                    </div>
                </div>
                <button 
                  className={styles.confirmBtn} 
                  onClick={closePaymentModal}
                  style={{ width: '100%' }}
                >
                  DONE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ITEM DETAIL MODAL */}
      <ItemDetailModal
        isOpen={showItemDetailModal}
        item={selectedItem}
        onClose={closeItemDetailModal}
        onAddToCart={handleAddToCartFromModal}
        variants={productVariants}
        onVariantSelect={handleVariantSelect}
      />

      {/* VARIANT SELECTION MODAL */}
      <VariantSelectionModal
        isOpen={showVariantModal}
        onClose={closeVariantModal}
        product={selectedProductForVariant ? {
          uuid: selectedProductForVariant.uuid || '',
          name: selectedProductForVariant.name || '',
          brand: selectedProductForVariant.brand || '',
          category: selectedProductForVariant.category || '',
          image_url: selectedProductForVariant.image_url
        } : null}
        variants={productVariants}
        onVariantSelect={handleVariantSelect}
      />
    </div>
  );
}
