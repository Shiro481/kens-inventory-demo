import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Package, DollarSign, Activity, Wrench } from 'lucide-react';
import styles from './Overview.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Sale } from '../../../types/sales';

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

/**
 * Overview component - Dashboard overview with statistics, charts, and recent activity
 * @param items - Array of inventory items for statistics calculation
 */
export default function Overview({ items }: OverviewProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('today');

  // Inverted status check since I don't have the exact import path for getStatus from types/inventory 
  // but I can see it was used in lines 218 of Dashboard.tsx. 
  // Let's use a local helper if needed or assume lines 15 in Pos.tsx works.
  const { settings } = useSettings();

  /**
   * Get local stock status based on quantity and minimum threshold
   * Uses settings context for low stock threshold
   * @param item - Inventory item to check
   * @returns Stock status string
   */
  const getLocalStatus = (item: InventoryItem) => {
    const stock = item.stock ?? item.quantity ?? 0;
    const min = item.minQuantity ?? item.min_qty ?? settings.low_stock_threshold;
    if (stock <= 0) return 'Out of Stock';
    if (stock < min) return 'Low Stock';
    return 'In Stock';
  };

  useEffect(() => {
    fetchSales();
  }, []);

  /**
   * Fetch sales data from Supabase for overview statistics
   * Updates sales state and handles loading/error states
   */
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
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const lowStockItems = items.filter(item => getLocalStatus(item) === 'Low Stock').length;
  const outOfStockItems = items.filter(item => getLocalStatus(item) === 'Out of Stock').length;

  // Calculate Sales Statistics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const todaysSales = sales.filter(sale => new Date(sale.created_at) >= startOfToday);
  const weekSales = sales.filter(sale => new Date(sale.created_at) >= startOfWeek);
  const monthSales = sales.filter(sale => new Date(sale.created_at) >= startOfMonth);
  const lastMonthSales = sales.filter(sale => {
    const saleDate = new Date(sale.created_at);
    return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth;
  });

  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0);
  const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.total, 0);
  const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
  const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.total, 0);

  // Calculate growth percentage
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
    : '0.0';
  const isGrowthPositive = parseFloat(revenueGrowth) >= 0;

  // Calculate Popular Parts based on Sales History
  const itemSalesCount: Record<number, number> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      itemSalesCount[item.id] = (itemSalesCount[item.id] || 0) + item.quantity;
    });
  });

  const popularParts = items
    .filter(item => itemSalesCount[item.id] > 0)
    .sort((a, b) => itemSalesCount[b.id] - itemSalesCount[a.id])
    .slice(0, 5)
    .map(item => ({
      ...item,
      totalSold: itemSalesCount[item.id]
    }));

  // Generate Activity List
  const activities: ActivityItem[] = [];

  const filterActivitiesByDate = (date: Date) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (activityFilter === 'today') return date >= startOfDay;
    if (activityFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }
    if (activityFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return date >= monthAgo;
    }
    if (activityFilter === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      return date >= yearAgo;
    }
    return true; // 'all'
  };

  // 1. Add Sales to Activities
  sales.forEach(sale => {
    const saleDate = new Date(sale.created_at);
    if (filterActivitiesByDate(saleDate)) {
      activities.push({
        type: 'sale',
        title: `SALE COMPLETED #${sale.id.slice(0, 6).toUpperCase()}`,
        description: `${sale.items.length} items sold • ${settings.currency_symbol}${sale.total.toFixed(2)}`,
        time: formatRelativeTime(saleDate),
        timestamp: saleDate
      });
    }
  });

  // 2. Add Restocked Items to Activities
  items.forEach(item => {
    if ((item as any).restocked_at) {
      const restockDate = new Date((item as any).restocked_at);
      console.log('Processing restock item:', item.name, 'Date:', restockDate, 'Filter:', filterActivitiesByDate(restockDate));
      if (filterActivitiesByDate(restockDate)) {
        const restockQuantity = (item as any).restock_quantity || 0;
        activities.push({
          type: 'restock',
          title: 'ITEM RESTOCKED',
          description: `${item.name} (+${restockQuantity} units)`,
          time: formatRelativeTime(restockDate),
          timestamp: restockDate
        });
      }
    }
  });

  // 3. Add New Items to Activities
  items.forEach(item => {
    if ((item as any).created_at) {
      const addedDate = new Date((item as any).created_at);
      if (filterActivitiesByDate(addedDate)) {
        activities.push({
          type: 'added',
          title: 'NEW ITEM ADDED',
          description: `${item.name} (${item.sku || 'NO SKU'})`,
          time: formatRelativeTime(addedDate),
          timestamp: addedDate
        });
      }
    }
  });

  // 3. Add Low Stock Alerts (Limited to Today/Always Relevant)
  if (activityFilter === 'today' || activityFilter === 'all' || activityFilter === 'week') {
    items.filter(i => getLocalStatus(i) === 'Low Stock').forEach(item => {
      activities.push({
        type: 'alert',
        title: 'INVENTORY ALERT',
        description: `${item.name} is running low (${item.stock ?? item.quantity ?? 0} left)`,
        time: 'Just now',
        timestamp: new Date()
      });
    });
  }

  const sortedActivities = activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  function formatRelativeTime(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  return (
    <div className={styles.overview}>
      <div className={styles.header}>
        <h1>{settings.store_name} OVERVIEW</h1>
        <div className={styles.systemStatus}>
          SYSTEM STATUS: <span className={styles.operational}>OPERATIONAL</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TODAY'S SALES</span>
            <DollarSign size={18} color="#666" />
          </div>
          <div className={styles.statValue}>{settings.currency_symbol}{todaysRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className={styles.statChange}>
            <Activity size={12} />
            {todaysSales.length} TRANSACTION{todaysSales.length !== 1 ? 'S' : ''}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>THIS WEEK</span>
            <TrendingUp size={18} color="#666" />
          </div>
          <div className={styles.statValue}>{settings.currency_symbol}{weekRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className={styles.statChange}>
            <Package size={12} />
            {weekSales.length} SALES
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>THIS MONTH</span>
            <DollarSign size={18} color="#666" />
          </div>
          <div className={styles.statValue}>{settings.currency_symbol}{monthRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className={isGrowthPositive ? styles.statChange : styles.statChangeWarning}>
            <TrendingUp size={12} />
            {isGrowthPositive ? '+' : ''}{revenueGrowth}% vs LAST MONTH
          </div>
        </div>

        <div className={`${styles.statCard} ${outOfStockItems > 0 ? styles.critical : styles.warning}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>INVENTORY ALERTS</span>
            <AlertCircle size={18} color={outOfStockItems > 0 ? "#ef4444" : "#ff9800"} />
          </div>
          <div className={styles.statValue}>{lowStockItems + outOfStockItems}</div>
          <div className={outOfStockItems > 0 ? styles.statChangeCritical : styles.statChangeWarning}>
            {outOfStockItems > 0 ? `⚠ ${outOfStockItems} OUT OF STOCK` : `${lowStockItems} LOW STOCK`}
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.activityPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <h2>RECENT ACTIVITY</h2>
              <div className={styles.activityFilters}>
                <button 
                  className={`${styles.filterTab} ${activityFilter === 'today' ? styles.activeTab : ''}`}
                  onClick={() => setActivityFilter('today')}
                >
                  TODAY
                </button>
                <button 
                  className={`${styles.filterTab} ${activityFilter === 'week' ? styles.activeTab : ''}`}
                  onClick={() => setActivityFilter('week')}
                >
                  WEEK
                </button>
                <button 
                  className={`${styles.filterTab} ${activityFilter === 'month' ? styles.activeTab : ''}`}
                  onClick={() => setActivityFilter('month')}
                >
                  MONTH
                </button>
              </div>
            </div>
            <Activity size={18} color="#666" />
          </div>
          <div className={styles.activityListScroll}>
            <div className={styles.activityList}>
              {loading ? (
                <div style={{ padding: '20px', color: '#444', fontSize: '11px' }}>LOADING ACTIVITIES...</div>
              ) : sortedActivities.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <div className={`${styles.activityDot} ${styles[activity.type]}`}></div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTitle}>{activity.title}</div>
                    <div className={styles.activityDescription}>
                      {activity.description} • {activity.time}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && sortedActivities.length === 0 && (
                <div style={{ padding: '20px', color: '#444', fontSize: '11px' }}>NO RECENT ACTIVITY FOR THIS PERIOD</div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.popularPanel}>
          <div className={styles.panelHeader}>
            <h2>MOST SOLD PARTS</h2>
            <Wrench size={18} color="#666" />
          </div>
          <div className={styles.popularList}>
            {loading ? (
              <div style={{ padding: '20px', color: '#444', fontSize: '11px' }}>LOADING DATA...</div>
            ) : popularParts.length === 0 ? (
              <div style={{ padding: '20px', color: '#444', fontSize: '11px' }}>NO SALES DATA YET</div>
            ) : popularParts.map((part, index) => (
              <div key={part.id} className={styles.popularItem}>
                <div className={styles.popularRank}>0{index + 1}</div>
                <div className={styles.popularInfo}>
                  <div className={styles.popularName}>{part.name}</div>
                  <div className={styles.popularCategory}>{part.category || 'UNCATEGORIZED'}</div>
                </div>
                <div className={styles.popularStats}>
                  <div className={styles.popularPrice}>{settings.currency_symbol}{(part.price || 0).toFixed(2)}</div>
                  <div className={styles.popularUnits}>{part.totalSold} sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
