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
  variant_id?: string;
  variant_display_name?: string;
  variant_price?: number;
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
  variants: Array<{
    variant_id: string;
    display_name: string;
    compatibility_list: string[];
    final_price: number;
    stock_quantity: number;
    is_primary: boolean;
    variant_description?: string;
    color_temperature?: string;
  }>;
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
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<ProductVariant | null>(null);

  /**
   * Filter inventory items based on search query
   * Searches in name, SKU, and category fields
   */
  const filteredItems = items.filter(item => {
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
   * Handle item click - check for variants or show details
   * @param item - Inventory item that was clicked
   */
  const handleItemClick = async (item: InventoryItem) => {
    // Check if item has variants based on database flag
    // (with fallback to previous logic if flag is missing for some reason)
    const hasVariants = item.has_variants || 
               item.name?.toLowerCase().includes('led') ||
               item.name?.toLowerCase().includes('headlight') ||
               item.name?.toLowerCase().includes('fog') ||
               item.description?.includes('has_variants": true');

    if (hasVariants && item.uuid) {
      if (!supabase) {
        console.error("Supabase client is not initialized");
        setSelectedItem(item);
        setShowItemDetailModal(true);
        return;
      }

      try {
        setLoading(true);
        // Fetch variants from the database view
        const { data: variants, error } = await supabase
          .from('pos_product_variants')
          .select('*')
          .eq('product_id', item.uuid);

        if (error) throw error;

        if (variants && variants.length > 0) {
          // If only 1 variant, we still want to show the modal so user can see details
          // before adding to cart, per user request "make all items show full details when clicked"
          
          
          // Map to ProductVariant structure for multiple variants (or single)
          const productVariants: ProductVariant = {
            product_id: item.uuid,
            sku: item.sku || '',
            base_name: item.name || '',
            brand: item.brand || '',
            base_price: item.price || 0,
            category: item.category || '',
            image_url: item.image_url || '',
            color_temperature: item.color_temperature,
            variants: variants.map(v => ({
              variant_id: v.variant_id,
              display_name: v.display_name,
              compatibility_list: v.compatibility_list || [],
              final_price: v.final_price,
              stock_quantity: v.stock_quantity,
              is_primary: v.is_primary,
              variant_description: v.variant_description,
              color_temperature: v.color_temperature
            }))
          };
          
          setSelectedProductForVariant(productVariants);
          setShowVariantModal(true);
        } else {
          // No variants found in DB, fall back to standard modal
           setSelectedItem(item);
           setShowItemDetailModal(true);
        }
      } catch (err) {
        console.error('Error fetching variants:', err);
        // Fallback on error
        setSelectedItem(item);
        setShowItemDetailModal(true);
      } finally {
        setLoading(false);
      }
    } else {
        // Simple add to cart - no variant selection
        setSelectedItem(item);
        setShowItemDetailModal(true);
    }
  };

  /**
   * Handle variant selection from modal with quantity
   * @param variant - Selected variant with compatibility
   * @param quantity - Selected quantity
   */
  const handleVariantSelect = (variant: any, quantity: number) => {
    if (!selectedProductForVariant) return;

    // Create a cart item with variant information
    const variantCartItem: CartItem = {
      id: parseInt(selectedProductForVariant.product_id.replace('-', '').substring(0, 8), 16) % 1000000,
      name: selectedProductForVariant.base_name,
      sku: selectedProductForVariant.sku,
      price: variant.final_price,
      stock: variant.stock_quantity,
      quantity: variant.stock_quantity,
      cartQuantity: quantity,
      category: selectedProductForVariant.category,
      brand: selectedProductForVariant.brand,
      description: `${selectedProductForVariant.base_name} - ${variant.display_name}`,
      image_url: selectedProductForVariant.image_url,
      variant_id: variant.variant_id,
      variant_display_name: variant.display_name,
      variant_price: variant.final_price
    };

    setCart(prev => {
      const existing = prev.find(i => 
        i.id === variantCartItem.id && 
        i.variant_id === variant.variant_id
      );
      
      if (existing) {
        const newQuantity = existing.cartQuantity + quantity;
        if (newQuantity > variant.stock_quantity) return prev;
        return prev.map(i => 
          (i.id === variantCartItem.id && i.variant_id === variant.variant_id) 
            ? { ...i, cartQuantity: newQuantity } 
            : i
        );
      }
      
      return [...prev, variantCartItem];
    });

    setShowVariantModal(false);
    setSelectedProductForVariant(null);
  };

  /**
   * Close variant modal
   */
  const closeVariantModal = () => {
    setShowVariantModal(false);
    setSelectedProductForVariant(null);
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

        const { error: updateError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', item.id);

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
            const hasVariants = item.name?.toLowerCase().includes('led') ||
                       item.name?.toLowerCase().includes('headlight') ||
                       item.name?.toLowerCase().includes('fog') ||
                       item.name?.toLowerCase().includes('turn signal') ||
                       item.name?.toLowerCase().includes('interior') ||
                       item.name?.toLowerCase().includes('brake') ||
                       item.description?.includes('has_variants": true') ||
                       item.sku?.toLowerCase().includes('led') ||
                       item.sku?.toLowerCase().includes('kit');
            
            return (
              <div 
                key={item.id} 
                className={`${styles.productCard} ${isOutOfStock || loading ? styles.outOfStock : ''} ${hasVariants && (item.variant_count || 0) > 1 ? styles.hasVariants : ''}`}
                onClick={() => !isOutOfStock && !loading && handleItemClick(item)}
                title={isOutOfStock ? "Out of Stock" : "Select Options"}
              >
                {hasVariants && (item.variant_count || 0) > 1 && (
                  <div className={styles.variantBadge}>MULTIPLE OPTIONS</div>
                )}
                
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
      />

      {/* VARIANT SELECTION MODAL */}
      <VariantSelectionModal
        isOpen={showVariantModal}
        onClose={closeVariantModal}
        product={selectedProductForVariant}
        onVariantSelect={handleVariantSelect}
      />
    </div>
  );
}
