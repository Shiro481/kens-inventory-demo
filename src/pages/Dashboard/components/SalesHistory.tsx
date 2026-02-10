import { useState, useEffect } from 'react';
import { Search, Filter, FileText, Loader2 } from 'lucide-react';
import styles from './SalesHistory.module.css';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Sale } from '../../../types/sales';
import TransactionDetailModal from './TransactionDetailModal';

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Sale | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = (sale: Sale) => {
    setSelectedTransaction(sale);
    setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setSelectedTransaction(null);
  };

  const filteredSales = sales.filter(sale => {
    const query = searchQuery.toLowerCase();
    return (
      sale.id.toLowerCase().includes(query) ||
      sale.payment_method.toLowerCase().includes(query) ||
      sale.items.some(item => item.name.toLowerCase().includes(query))
    );
  });

  const { settings } = useSettings();
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalSalesCount = sales.length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>SALES HISTORY</h1>
          <p>TRANSACTION LOGS & RECEIPTS</p>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOTAL REVENUE</span>
            <span className={`${styles.statValue} ${styles.revenueValue}`}>
              {settings.currency_symbol}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOTAL SALES</span>
            <span className={styles.statValue}>{totalSalesCount}</span>
          </div>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="SEARCH TRANSACTIONS..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className={styles.filterBtn}>
          <Filter size={16} />
          FILTER
        </button>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <span className={styles.columnLabel}>TRANSACTION ID</span>
          <span className={styles.columnLabel}>DATE & TIME</span>
          <span className={styles.columnLabel}>ITEMS</span>
          <span className={styles.columnLabel}>PAYMENT</span>
          <span className={styles.columnLabel}>TOTAL</span>
          <span className={styles.columnLabel}>RECEIPT</span>
        </div>

        <div className={styles.tableBody}>
          {loading ? (
            <div className={styles.emptyState}>
              <Loader2 className={styles.spinner} size={24} />
              <span style={{ marginLeft: 12 }}>LOADING TRANSACTIONS...</span>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className={styles.emptyState}>NO TRANSACTIONS FOUND</div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} className={styles.row}>
                <span className={styles.txId}>#{sale.id.slice(0, 8).toUpperCase()}</span>
                <span className={styles.dateTime}>
                  {new Date(sale.created_at).toLocaleDateString()} {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className={styles.itemsList}>
                  {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ').slice(0, 50)}
                  {sale.items.length > 2 ? '...' : ''}
                </span>
                <span className={styles.payment}>{sale.payment_method.toUpperCase()}</span>
                <span className={styles.total}>{settings.currency_symbol}{sale.total.toFixed(2)}</span>
                <button 
                  className={styles.receiptBtn}
                  onClick={() => handleViewTransaction(sale)}
                  title="View Transaction Details"
                >
                  <FileText size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <TransactionDetailModal
        isOpen={isTransactionModalOpen}
        transaction={selectedTransaction}
        onClose={handleCloseTransactionModal}
      />
    </div>
  );
}
