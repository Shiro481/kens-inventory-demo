import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, AlertCircle, Package, DollarSign, Activity, Wrench } from 'lucide-react';
import styles from './Overview.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { supabase } from '../../../lib/supabase';
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

export default function Overview({ items }: OverviewProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('today');

  // Inverted status check since I don't have the exact import path for getStatus from types/inventory 
  // but I can see it was used in lines 218 of Dashboard.tsx. 
  // Let's use a local helper if needed or assume lines 15 in Pos.tsx works.
  const getLocalStatus = (item: InventoryItem) => {
    const stock = item.stock ?? item.quantity ?? 0;
    const min = item.minQuantity ?? item.min_qty ?? 10;
    if (stock <= 0) return 'Out of Stock';
    if (stock < min) return 'Low Stock';
    return 'In Stock';
  };

  useEffect(() => {
    fetchSales();
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
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalParts = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.price || 0) * (item.stock ?? item.quantity ?? 0), 0);
  const lowStockItems = items.filter(item => getLocalStatus(item) === 'Low Stock').length;
  const outOfStockItems = items.filter(item => getLocalStatus(item) === 'Out of Stock').length;

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
        description: `${sale.items.length} items sold • $${sale.total.toFixed(2)}`,
        time: formatRelativeTime(saleDate),
        timestamp: saleDate
      });
    }
  });

  // 2. Add New Items to Activities
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
        <h1>GARAGE OVERVIEW</h1>
        <div className={styles.systemStatus}>
          SYSTEM STATUS: <span className={styles.operational}>OPERATIONAL</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TOTAL PARTS</span>
            <Package size={18} color="#666" />
          </div>
          <div className={styles.statValue}>{totalParts}</div>
          <div className={styles.statChange}>
            <TrendingUp size={12} />
            LIVE UPDATE
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TOTAL VALUE</span>
            <DollarSign size={18} color="#666" />
          </div>
          <div className={styles.statValue}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
          <div className={styles.statChange}>
            <TrendingUp size={12} />
            VALUATION
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>LOW STOCK</span>
            <AlertTriangle size={18} color="#ff9800" />
          </div>
          <div className={styles.statValue}>{lowStockItems}</div>
          <div className={styles.statChangeWarning}>
            REORDER NEEDED
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.critical}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>OUT OF STOCK</span>
            <AlertCircle size={18} color="#ef4444" />
          </div>
          <div className={styles.statValue}>{outOfStockItems}</div>
          <div className={styles.statChangeCritical}>
            ⚠ CRITICAL
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
                  <div className={styles.popularPrice}>${(part.price || 0).toFixed(2)}</div>
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
