import { TrendingUp, AlertTriangle, AlertCircle, Package, DollarSign, Activity, Wrench } from 'lucide-react';
import styles from './Overview.module.css';
import type { InventoryItem } from '../../../types/inventory';
import { getStatus } from '../../../types/inventory';

interface OverviewProps {
  items: InventoryItem[];
}

export default function Overview({ items }: OverviewProps) {
  // Calculate stats
  const totalParts = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.price || 0) * (item.stock ?? item.quantity ?? 0), 0);
  const lowStockItems = items.filter(item => getStatus(item) === 'Low Stock').length;
  const outOfStockItems = items.filter(item => getStatus(item) === 'Out of Stock').length;

  // Get popular parts (sorted by quantity * price)
  const popularParts = [...items]
    .sort((a, b) => {
      const valueA = (a.price || 0) * (a.stock ?? a.quantity ?? 0);
      const valueB = (b.price || 0) * (b.stock ?? b.quantity ?? 0);
      return valueB - valueA;
    })
    .slice(0, 3);

  // Mock recent activity (in a real app, this would come from a separate activity log)
  const recentActivity = [
    {
      type: 'complete',
      title: 'JOB #2948 COMPLETE',
      description: 'Used 5L Synthetic Oil',
      time: '1 hour ago'
    },
    {
      type: 'restock',
      title: 'RESTOCK RECEIVED',
      description: 'Shipment #8821 from AutoParts Warehouse',
      time: '3 hours ago'
    },
    {
      type: 'alert',
      title: 'INVENTORY ALERT',
      description: 'Oil Filters below minimum threshold',
      time: '5 hours ago'
    }
  ];

  return (
    <div className={styles.overview}>
      <div className={styles.header}>
        <h1>GARAGE OVERVIEW</h1>
        <div className={styles.systemStatus}>
          SYSTEM STATUS: <span className={styles.operational}>OPERATIONAL</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TOTAL PARTS</span>
            <Package size={18} color="#666" />
          </div>
          <div className={styles.statValue}>{totalParts}</div>
          <div className={styles.statChange}>
            <TrendingUp size={12} />
            +15 THIS WEEK
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
            +5% FROM LAST MONTH
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>LOW STOCK</span>
            <AlertTriangle size={18} color="#ff9800" />
          </div>
          <div className={styles.statValue}>{lowStockItems}</div>
          <div className={styles.statChangeWarning}>
            REORDER SUGGESTED
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

      {/* Two Column Layout */}
      <div className={styles.contentGrid}>
        {/* Recent Activity */}
        <div className={styles.activityPanel}>
          <div className={styles.panelHeader}>
            <h2>RECENT ACTIVITY</h2>
            <Activity size={18} color="#666" />
          </div>
          <div className={styles.activityList}>
            {recentActivity.map((activity, index) => (
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
          </div>
        </div>

        {/* Popular Parts */}
        <div className={styles.popularPanel}>
          <div className={styles.panelHeader}>
            <h2>POPULAR PARTS</h2>
            <Wrench size={18} color="#666" />
          </div>
          <div className={styles.popularList}>
            {popularParts.map((part, index) => (
              <div key={part.id} className={styles.popularItem}>
                <div className={styles.popularRank}>0{index + 1}</div>
                <div className={styles.popularInfo}>
                  <div className={styles.popularName}>{part.name}</div>
                  <div className={styles.popularCategory}>{part.category || 'UNCATEGORIZED'}</div>
                </div>
                <div className={styles.popularStats}>
                  <div className={styles.popularPrice}>${(part.price || 0).toFixed(2)}</div>
                  <div className={styles.popularUnits}>{part.stock ?? part.quantity ?? 0} units</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
