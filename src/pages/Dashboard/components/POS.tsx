import { useState } from 'react';
import { Search, ShoppingCart, Box, Minus, Plus, CreditCard } from 'lucide-react';
import styles from './POS.module.css';
import type { InventoryItem } from '../../../types/inventory';

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

interface POSProps {
  items: InventoryItem[];
}

export default function POS({ items }: POSProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

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
            />
          </div>
          <button className={styles.filterBtn}>
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
                className={`${styles.productCard} ${isOutOfStock ? styles.outOfStock : ''}`}
                onClick={() => !isOutOfStock && addToCart(item)}
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
                  <button className={styles.qtyBtn} onClick={() => updateCartQuantity(item.id, -1)}>
                    {item.cartQuantity === 1 ? <Box size={14} onClick={() => removeFromCart(item.id)} /> : <Minus size={14} />}
                  </button>
                  <span style={{ minWidth: 20, textAlign: 'center', fontSize: 12, fontWeight: 'bold' }}>{item.cartQuantity}</span>
                  <button className={styles.qtyBtn} onClick={() => updateCartQuantity(item.id, 1)}>
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

          <button className={`${styles.payBtn} ${cart.length > 0 ? styles.payBtnActive : ''}`}>
             <CreditCard size={18} />
             PROCESS PAYMENT
          </button>
        </div>
      </div>
    </div>
  );
}
