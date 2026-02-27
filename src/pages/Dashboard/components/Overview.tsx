import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, AlertCircle, Package, DollarSign, Activity, Plus, ShoppingCart, RefreshCcw } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import styles from './Overview.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Sale } from '../../../types/sales';
import { useInventoryStore } from '../../../store/inventoryStore';

interface OverviewProps {
  items: InventoryItem[];
}

interface ActivityItem {
  type: 'sale' | 'restock' | 'added' | 'alert';
  title: string;
  description: string;
  time: string;
  timestamp: Date;
}

type ActivityFilter = 'today' | 'week' | 'month' | 'year' | 'all';

export default function Overview({ items: paginatedItems }: OverviewProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('today');
  const { settings } = useSettings();
  
  // Get aggregate stats from the store (Full DB counts)
  const { aggregateStats } = useInventoryStore();

  useEffect(() => {
    if (supabase) {
      fetchSales();
      
      // Subscribe to real-time sales updates
      const salesSubscription = supabase
        .channel('sales-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
          fetchSales();
        })
        .subscribe();

      return () => {
        supabase?.removeChannel(salesSubscription);
      };
    }
  }, []);

  const fetchSales = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error fetching sales for overview:', err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // ── Stats Calculations ──────────────────────────────────────────────────────
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const todaysSales = sales.filter((sale: Sale) => new Date(sale.created_at) >= startOfToday);
  const monthSales = sales.filter((sale: Sale) => new Date(sale.created_at) >= startOfMonth);
  const lastMonthSales = sales.filter((sale: Sale) => {
    const saleDate = new Date(sale.created_at);
    return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth;
  });

  const todaysRevenue = todaysSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
  const monthRevenue = monthSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0);
  const lastMonthRevenue = lastMonthSales.reduce((sum: number, sale: Sale) => sum + sale.total, 0);

  // Chart Data: Last 7 days revenue trend
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayRevenue = sales
        .filter((s: Sale) => s.created_at.startsWith(dateStr))
        .reduce((sum: number, s: Sale) => sum + s.total, 0);
      return { value: dayRevenue };
    });
  }, [sales]);

  // Activity List Generation
  const activities = useMemo(() => {
    const list: ActivityItem[] = [];
    const filterActivitiesByDate = (date: Date) => {
      if (activityFilter === 'today') return date >= startOfToday;
      if (activityFilter === 'all') return true;
      return true;
    };

    sales.forEach((sale: Sale) => {
      const d = new Date(sale.created_at);
      if (filterActivitiesByDate(d)) {
        list.push({
          type: 'sale',
          title: `ORDER COMPLETED #${sale.id.slice(0, 5).toUpperCase()}`,
          description: `${sale.items.length} items sold • ${settings.currency_symbol}${sale.total.toFixed(2)}`,
          time: formatRelativeTime(d),
          timestamp: d
        });
      }
    });

    // Merge recent stock alerts from paginated items as a fallback for real-time UI
    paginatedItems.filter((i: InventoryItem) => (i.stock ?? 0) < (i.minQuantity ?? 5)).forEach((item: InventoryItem) => {
      list.push({
        type: 'alert',
        title: 'LOW STOCK ALERT',
        description: `${item.name} is below threshold (${item.stock} left)`,
        time: 'Active',
        timestamp: new Date()
      });
    });

    return list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 20);
  }, [sales, paginatedItems, activityFilter, settings.currency_symbol, startOfToday]);

  function formatRelativeTime(date: Date) {
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className={styles.overview}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.greeting}>{getGreeting()}, ADMIN</span>
          <h1>{settings.store_name} DASHBOARD</h1>
        </div>
        <div className={styles.systemStatus}>
          SYSTEM STATUS: <span className={styles.operational}>OPERATIONAL</span>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TODAY'S REVENUE</span>
            <DollarSign size={14} color="#666" />
          </div>
          <div className={styles.statValue}>{settings.currency_symbol}{todaysRevenue.toLocaleString()}</div>
          <div className={styles.statChange}>
            <TrendingUp size={12} />
            {todaysSales.length} TRANSACTIONS
          </div>
          <div className={styles.statChart}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <Area type="monotone" dataKey="value" stroke="var(--brand-neon)" fill="rgba(0, 255, 157, 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TOTAL INVENTORY</span>
            <Package size={14} color="#666" />
          </div>
          <div className={styles.statValue}>{aggregateStats?.total_items ?? '...'}</div>
          <div className={styles.statChange}>
            <Activity size={12} />
            SELLABLE UNITS
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>LOW STOCK ALERTS</span>
            <AlertCircle size={14} color="#ff9800" />
          </div>
          <div className={styles.statValue}>{aggregateStats?.low_stock ?? '...'}</div>
          <div className={styles.statChangeWarning}>REQUIRES ATTENTION</div>
        </div>

        <div className={`${styles.statCard} ${aggregateStats?.out_of_stock ? styles.critical : ''}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>OUT OF STOCK</span>
            <AlertCircle size={14} color="#ef4444" />
          </div>
          <div className={styles.statValue}>{aggregateStats?.out_of_stock ?? '...'}</div>
          <div className={styles.statChangeCritical}>IMMEDIATE ACTION</div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.activityPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <h2>REAL-TIME FEED</h2>
              <div className={styles.activityFilters}>
                <button 
                  className={`${styles.filterTab} ${activityFilter === 'today' ? styles.activeTab : ''}`}
                  onClick={() => setActivityFilter('today')}
                >
                  TODAY
                </button>
                <button 
                  className={`${styles.filterTab} ${activityFilter === 'all' ? styles.activeTab : ''}`}
                  onClick={() => setActivityFilter('all')}
                >
                  ALL TIME
                </button>
              </div>
            </div>
            <Activity size={18} color="#666" />
          </div>
          <div className={styles.activityListScroll}>
            {activities.map((item, i) => (
              <div key={i} className={styles.activityItem}>
                <div className={`${styles.activityDot} ${styles[item.type]}`} />
                <div className={styles.activityContent}>
                  <div className={styles.activityTitle}>{item.title}</div>
                  <div className={styles.activityDescription}>{item.description} • {item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.quickActionsPanel}>
            <div className={styles.panelHeader} style={{ padding: 0, border: 0, marginBottom: 20 }}>
              <h2>QUICK ACTIONS</h2>
            </div>
            <div className={styles.quickActionsGrid}>
              <button className={styles.actionBtn} onClick={() => window.dispatchEvent(new CustomEvent('nav-inventory'))}>
                <div className={styles.actionIcon}><Plus size={20} /></div>
                <div className={styles.actionInfo}>
                  <span className={styles.actionLabel}>Add New Item</span>
                  <span className={styles.actionSub}>Expand your catalog</span>
                </div>
              </button>
              <button className={styles.actionBtn} onClick={() => window.dispatchEvent(new CustomEvent('nav-pos'))}>
                <div className={styles.actionIcon}><ShoppingCart size={20} /></div>
                <div className={styles.actionInfo}>
                  <span className={styles.actionLabel}>Launch POS</span>
                  <span className={styles.actionSub}>Create a new sale</span>
                </div>
              </button>
              <button className={styles.actionBtn} onClick={() => window.location.reload()}>
                <div className={styles.actionIcon}><RefreshCcw size={20} /></div>
                <div className={styles.actionInfo}>
                  <span className={styles.actionLabel}>Sync Data</span>
                  <span className={styles.actionSub}>Force cloud refresh</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
