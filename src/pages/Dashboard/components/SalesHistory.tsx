import { useState, useEffect, useRef } from 'react';
import {
  Search, Filter, FileText, Loader2, Download,
  ChevronUp, ChevronDown, X, CalendarDays
} from 'lucide-react';
import styles from './SalesHistory.module.css';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Sale } from '../../../types/sales';
import TransactionDetailModal from './TransactionDetailModal';
import { exportSalesToExcel } from '../../../utils/salesUtils';

type SortKey  = 'date' | 'total' | 'items';
type SortDir  = 'asc' | 'desc';
type DatePreset = 'today' | 'week' | 'month' | 'year' | 'all';

export default function SalesHistory() {
  const [sales, setSales]                             = useState<Sale[]>([]);
  const [loading, setLoading]                         = useState(true);
  const [searchQuery, setSearchQuery]                 = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Sale | null>(null);
  const [isModalOpen, setIsModalOpen]                 = useState(false);

  // Filter state
  const [showFilter,    setShowFilter]    = useState(false);
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'gcash' | 'card'>('all');
  const filterRef = useRef<HTMLDivElement>(null);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { settings } = useSettings();

  useEffect(() => {
    fetchSales();
  }, []);

  // Close filter panel when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
    setIsModalOpen(true);
  };

  // ─── Date preset helper ──────────────────────────────────────────────────
  const applyPreset = (preset: DatePreset) => {
    const now  = new Date();
    const pad  = (d: Date) => d.toISOString().split('T')[0];
    if (preset === 'all') { setDateFrom(''); setDateTo(''); return; }
    if (preset === 'today') {
      setDateFrom(pad(now)); setDateTo(pad(now)); return;
    }
    if (preset === 'week') {
      const w = new Date(now); w.setDate(now.getDate() - 7);
      setDateFrom(pad(w)); setDateTo(pad(now)); return;
    }
    if (preset === 'month') {
      setDateFrom(pad(new Date(now.getFullYear(), now.getMonth(), 1)));
      setDateTo(pad(now)); return;
    }
    if (preset === 'year') {
      setDateFrom(pad(new Date(now.getFullYear(), 0, 1)));
      setDateTo(pad(now)); return;
    }
  };

  const clearFilters = () => {
    setDateFrom(''); setDateTo('');
    setStatusFilter('all'); setPaymentFilter('all');
    setShowFilter(false);
  };

  const activeFilterCount =
    (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (paymentFilter !== 'all' ? 1 : 0);

  // ─── Filter ──────────────────────────────────────────────────────────────
  const filtered = sales.filter(sale => {
    const q = searchQuery.toLowerCase();
    const dateStr = new Date(sale.created_at).toLocaleDateString();
    const matchSearch =
      !q ||
      sale.id.toLowerCase().includes(q) ||
      sale.payment_method.toLowerCase().includes(q) ||
      dateStr.includes(q) ||
      sale.items.some(i => i.name.toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q));
    if (!matchSearch) return false;

    if (dateFrom && new Date(sale.created_at) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(sale.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    if (statusFilter !== 'all') {
      const s = (sale.transaction_status || 'completed').toLowerCase();
      if (s !== statusFilter) return false;
    }
    if (paymentFilter !== 'all') {
      if (!sale.payment_method.toLowerCase().includes(paymentFilter)) return false;
    }
    return true;
  });

  // ─── Sort ────────────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    let diff = 0;
    if (sortKey === 'date')  diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortKey === 'total') diff = a.total - b.total;
    if (sortKey === 'items') diff = a.items.length - b.items.length;
    return sortDir === 'asc' ? diff : -diff;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={10} style={{ opacity: 0.2 }} />;
    return sortDir === 'asc' ? <ChevronUp size={10} style={{ color: 'var(--brand-neon)' }} /> : <ChevronDown size={10} style={{ color: 'var(--brand-neon)' }} />;
  };

  // ─── Summary stats ───────────────────────────────────────────────────────
  const totalRevenue   = sales.reduce((s, x) => s + (x.total || 0), 0);
  const avgOrderValue  = sales.length ? totalRevenue / sales.length : 0;
  const now            = new Date();
  const thisMonthRev   = sales
    .filter(x => new Date(x.created_at).getMonth() === now.getMonth() && new Date(x.created_at).getFullYear() === now.getFullYear())
    .reduce((s, x) => s + x.total, 0);
  const methodCounts   = sales.reduce<Record<string, number>>((acc, x) => {
    const m = x.payment_method?.toLowerCase() || 'unknown';
    acc[m] = (acc[m] || 0) + 1; return acc;
  }, {});
  const topMethod      = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  const fmt = (n: number) => `${settings.currency_symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ─── Row item preview ────────────────────────────────────────────────────
  const itemPreview = (sale: Sale) => {
    const first2 = sale.items.slice(0, 2).map(i => `${i.quantity}× ${i.name}`).join(', ');
    const more   = sale.items.length > 2 ? ` +${sale.items.length - 2} more` : '';
    return { preview: first2, more };
  };

  const totalUnits = (sale: Sale) => sale.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.title}>
          <h1>SALES HISTORY</h1>
          <p>TRANSACTION LOGS &amp; RECEIPTS</p>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOTAL REVENUE</span>
            <span className={`${styles.statValue} ${styles.revenueValue}`}>{fmt(totalRevenue)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOTAL SALES</span>
            <span className={styles.statValue}>{sales.length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>THIS MONTH</span>
            <span className={`${styles.statValue} ${styles.revenueValue}`}>{fmt(thisMonthRev)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>AVG. ORDER</span>
            <span className={styles.statValue}>{fmt(avgOrderValue)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>TOP PAYMENT</span>
            <span className={`${styles.statValue} ${styles.methodValue}`}>{topMethod.toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="SEARCH BY ITEM, DATE, PAYMENT..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className={styles.toolbarRight} ref={filterRef}>
          <button
            className={`${styles.filterBtn} ${activeFilterCount > 0 ? styles.filterBtnActive : ''}`}
            onClick={() => setShowFilter(v => !v)}
          >
            <Filter size={16} />
            FILTER{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>

          <button
            className={styles.exportBtn}
            onClick={() => exportSalesToExcel(filtered)}
            title="Export filtered sales to Excel"
          >
            <Download size={16} />
            EXPORT
          </button>

          {/* ── Filter Panel Drop-down ─────────────────────────────────── */}
          {showFilter && (
            <div className={styles.filterPanel}>
              <div className={styles.filterPanelHeader}>
                <span>FILTER TRANSACTIONS</span>
                <button onClick={clearFilters} className={styles.clearBtn}>CLEAR ALL</button>
              </div>

              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>DATE PRESET</label>
                <div className={styles.presetRow}>
                  {(['today','week','month','year','all'] as DatePreset[]).map(p => (
                    <button key={p} className={styles.presetBtn} onClick={() => applyPreset(p)}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>CUSTOM DATE RANGE</label>
                <div className={styles.dateRange}>
                  <div className={styles.dateInputWrapper}>
                    <CalendarDays size={12} />
                    <input type="date" className={styles.dateInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  </div>
                  <span className={styles.dateSep}>→</span>
                  <div className={styles.dateInputWrapper}>
                    <CalendarDays size={12} />
                    <input type="date" className={styles.dateInput} value={dateTo} onChange={e => setDateTo(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>STATUS</label>
                <div className={styles.presetRow}>
                  {(['all','completed','pending','cancelled'] as const).map(s => (
                    <button
                      key={s}
                      className={`${styles.presetBtn} ${statusFilter === s ? styles.presetBtnActive : ''}`}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>PAYMENT METHOD</label>
                <div className={styles.presetRow}>
                  {(['all','cash','gcash','card'] as const).map(m => (
                    <button
                      key={m}
                      className={`${styles.presetBtn} ${paymentFilter === m ? styles.presetBtnActive : ''}`}
                      onClick={() => setPaymentFilter(m)}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Results count ──────────────────────────────────────────────── */}
      <div className={styles.resultsMeta}>
        {loading ? '' : `${sorted.length} of ${sales.length} TRANSACTIONS`}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <span className={styles.columnLabel}>TRANSACTION</span>
          <span className={`${styles.columnLabel} ${styles.sortable}`} onClick={() => handleSort('date')}>
            DATE &amp; TIME <SortIcon col="date" />
          </span>
          <span className={`${styles.columnLabel} ${styles.sortable}`} onClick={() => handleSort('items')}>
            ITEMS <SortIcon col="items" />
          </span>
          <span className={styles.columnLabel}>PAYMENT</span>
          <span className={styles.columnLabel}>STATUS</span>
          <span className={`${styles.columnLabel} ${styles.sortable}`} onClick={() => handleSort('total')}>
            TOTAL <SortIcon col="total" />
          </span>
          <span className={styles.columnLabel}>RECEIPT</span>
        </div>

        <div className={styles.tableBody}>
          {loading ? (
            <div className={styles.emptyState}>
              <Loader2 className={styles.spinner} size={24} />
              <span style={{ marginLeft: 12 }}>LOADING TRANSACTIONS...</span>
            </div>
          ) : sorted.length === 0 ? (
            <div className={styles.emptyState}>NO TRANSACTIONS FOUND</div>
          ) : (
            sorted.map(sale => {
              const { preview, more } = itemPreview(sale);
              const units = totalUnits(sale);
              const status = (sale.transaction_status || 'completed').toLowerCase();
              return (
                <div
                  key={sale.id}
                  className={styles.row}
                  onClick={() => handleViewTransaction(sale)}
                  title="Click to view receipt"
                >
                  <span className={styles.txId}>#{sale.id.slice(0, 8).toUpperCase()}</span>
                  <span className={styles.dateTime}>
                    {new Date(sale.created_at).toLocaleDateString()}
                    <span className={styles.time}> {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                  <span className={styles.itemsList}>
                    {preview}
                    {more && <span className={styles.moreTag}>{more}</span>}
                    <span className={styles.unitCount}>{units} unit{units !== 1 ? 's' : ''}</span>
                  </span>
                  <span className={styles.payment}>{sale.payment_method.toUpperCase()}</span>
                  <span className={`${styles.statusBadge} ${styles[`status_${status}`]}`}>
                    {status.toUpperCase()}
                  </span>
                  <span className={styles.total}>{fmt(sale.total)}</span>
                  <button
                    className={styles.receiptBtn}
                    onClick={e => { e.stopPropagation(); handleViewTransaction(sale); }}
                    title="View Receipt"
                  >
                    <FileText size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <TransactionDetailModal
        isOpen={isModalOpen}
        transaction={selectedTransaction}
        onClose={() => { setIsModalOpen(false); setSelectedTransaction(null); }}
      />
    </div>
  );
}
