import { useState } from 'react';
import { Search, ShoppingCart, Box, Minus, Plus, CreditCard, Banknote, Loader2, Check } from 'lucide-react';
import styles from './Pos.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { supabase } from '../../../lib/supabase';

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

interface PosProps {
  items: InventoryItem[];
  onSaleComplete?: () => void;
}

export default function Pos({ items, onSaleComplete }: PosProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Credit Card'>('Cash');

  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(query) ||
      (item.sku || '').toLowerCase().includes(query) ||
      (item.category || '').toLowerCase().includes(query)
    );
  });

  const addToCart = (item: InventoryItem) => {
    const stock = item.stock ?? item.quantity ?? 0;
    if (stock <= 0) return;

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.cartQuantity >= stock) return prev;
        return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      }
      return [...prev, { ...item, cartQuantity: 1 }];
    });
  };

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

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handlePaymentClick = () => {
    if (cart.length === 0 || loading) return;
    setShowPaymentModal(true);
    setPaymentSuccess(false);
  };

  const handleConfirmPayment = async () => {
    if (cart.length === 0 || !supabase || loading) return;
    
    setLoading(true);
    try {
      // 1. Update stock for each item in the cart
      for (const item of cart) {
        const currentStock = item.stock ?? item.quantity ?? 0;
        const newStock = currentStock - item.cartQuantity;
        
        const payload: any = {};
        if (Object.keys(item).includes('stock')) payload.stock = newStock;
        else payload.quantity = newStock;

        const { error: updateError } = await supabase
          .from('Parts')
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

  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.cartQuantity, 0);
  const taxRate = 0.0825; // 8.25%
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
            
            return (
              <div 
                key={item.id} 
                className={`${styles.productCard} ${isOutOfStock || loading ? styles.outOfStock : ''}`}
                onClick={() => !isOutOfStock && !loading && addToCart(item)}
              >
                <div className={styles.sku}>{item.sku || 'NO SKU'}</div>
                <div className={styles.productName}>{item.name}</div>
                
                <div className={styles.productFooter}>
                  <div className={styles.qtyInfo}>
                    QTY: <span className={styles.qtyValue}>{stock}</span>
                  </div>
                  <div className={styles.price}>${(item.price || 0).toFixed(2)}</div>
                </div>

                {isOutOfStock && (
                  <div className={styles.outOfStockBadge}>OUT OF STOCK</div>
                )}
                
                {/* Visual indicator for items with low stock or specific status */}
                {stock > 0 && stock < (item.minQuantity ?? 10) && (
                   <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: '#ff9800', borderRadius: '50%' }}></div>
                )}
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
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemName}>{item.name}</div>
                  <div className={styles.cartItemPrice}>${(item.price || 0).toFixed(2)}</div>
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
            <span className={styles.summaryValue}>${subtotal.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>TAX (8.25%)</span>
            <span className={styles.summaryValue}>${tax.toFixed(2)}</span>
          </div>
          
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>TOTAL</span>
            <span className={styles.totalValue}>${total.toFixed(2)}</span>
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
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span>TAX (8.25%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryTotal}>
                      <label>TOTAL DUE</label>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: '#00ff9d' }}>
                        ${total.toFixed(2)}
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
                      <span style={{ color: '#fff' }}>${lastTotal.toFixed(2)}</span>
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
    </div>
  );
}
