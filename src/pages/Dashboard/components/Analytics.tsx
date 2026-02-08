import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Loader2 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import styles from './Analytics.module.css';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Sale } from '../../../types/sales';

type TimeRange = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('DAILY');
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, [timeRange]);

  const fetchSales = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      
      const now = new Date();
      let startDate = new Date();
      
      if (timeRange === 'DAILY') {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === 'WEEKLY') {
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === 'MONTHLY') {
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === 'YEARLY') {
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
      }

      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSales(data || []);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const { settings } = useSettings();

  // Calculate metrics
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const itemsSold = sales.reduce((sum, sale) => {
    return sum + (sale.items?.reduce((iSum, item) => iSum + (item.quantity || 0), 0) || 0);
  }, 0);

  // Prepare Chart Data
  const getChartData = () => {
    const now = new Date();
    
    interface ChartPoint {
      name: string;
      revenue: number;
      orders: number;
      dateKey?: string;
      monthKey?: string;
    }

    if (timeRange === 'DAILY') {
      const hourly: ChartPoint[] = Array.from({ length: 24 }, (_, i) => ({
        name: `${i.toString().padStart(2, '0')}:00`,
        revenue: 0,
        orders: 0
      }));

      sales.forEach(sale => {
        const d = new Date(sale.created_at);
        if (d.toDateString() === now.toDateString()) {
          const hour = d.getHours();
          hourly[hour].revenue += sale.total;
          hourly[hour].orders += 1;
        }
      });
      return hourly;
    }
    
    if (timeRange === 'WEEKLY') {
      const days: ChartPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        days.push({
          dateKey: d.toLocaleDateString(),
          name: d.toLocaleDateString([], { weekday: 'short' }),
          revenue: 0,
          orders: 0
        });
      }
      sales.forEach(sale => {
        const sDate = new Date(sale.created_at).toLocaleDateString();
        const entry = days.find(d => d.dateKey === sDate);
        if (entry) {
          entry.revenue += sale.total;
          entry.orders += 1;
        }
      });
      return days;
    }

    if (timeRange === 'MONTHLY') {
      const days: ChartPoint[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        days.push({
          dateKey: d.toLocaleDateString(),
          name: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
          revenue: 0,
          orders: 0
        });
      }
      sales.forEach(sale => {
        const sDate = new Date(sale.created_at).toLocaleDateString();
        const entry = days.find(d => d.dateKey === sDate);
        if (entry) {
          entry.revenue += sale.total;
          entry.orders += 1;
        }
      });
      return days;
    }

    if (timeRange === 'YEARLY') {
      const months: ChartPoint[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        months.push({
          monthKey: `${d.getFullYear()}-${d.getMonth()}`,
          name: d.toLocaleDateString([], { month: 'short' }),
          revenue: 0,
          orders: 0
        });
      }
      sales.forEach(sale => {
        const d = new Date(sale.created_at);
        const mKey = `${d.getFullYear()}-${d.getMonth()}`;
        const entry = months.find(m => m.monthKey === mKey);
        if (entry) {
          entry.revenue += sale.total;
          entry.orders += 1;
        }
      });
      return months;
    }

    return [];
  };

  const chartData = getChartData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: '#050505', 
          border: '1px solid #1a1a1a', 
          padding: '12px',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0, fontSize: '10px', color: '#666', fontWeight: 900 }}>{label}</p>
          <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 900, color: '#00ff9d' }}>
            {settings.currency_symbol}{payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.analyticsContainer}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>ANALYTICS REPORT</h1>
          <p>PERFORMANCE METRICS & TRENDS</p>
        </div>
        
        <div className={styles.timeSelector}>
          {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as TimeRange[]).map(range => (
            <button
              key={range}
              className={`${styles.timeBtn} ${timeRange === range ? styles.timeBtnActive : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TOTAL REVENUE</span>
            <DollarSign className={styles.statIcon} size={80} />
          </div>
          <div className={`${styles.statValue} ${styles.totalRevenueValue}`}>
            {settings.currency_symbol}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>TOTAL ORDERS</span>
            <ShoppingBag className={styles.statIcon} size={80} />
          </div>
          <div className={styles.statValue}>{totalOrders}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>AVG. ORDER VALUE</span>
            <TrendingUp className={styles.statIcon} size={80} />
          </div>
          <div className={`${styles.statValue} ${styles.avgOrderValue}`}>
            {settings.currency_symbol}{avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>ITEMS SOLD</span>
            <Package className={styles.statIcon} size={80} />
          </div>
          <div className={styles.statValue}>{itemsSold}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <h2>REVENUE TREND</h2>
            <div className={styles.chartViewBadge}>{timeRange} VIEW</div>
          </div>
          <div className={styles.chartContainer}>
            {loading ? (
              <div className={styles.spinnerWrapper}>
                <Loader2 className={styles.spinner} size={24} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ff9d" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#444" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    interval={timeRange === 'DAILY' ? 2 : 'preserveStartEnd'}
                  />
                  <YAxis 
                    stroke="#444" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${settings.currency_symbol}${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#00ff9d" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <h2>ORDER VOLUME</h2>
          </div>
          <div className={styles.chartContainer}>
            {loading ? (
              <div className={styles.spinnerWrapper}>
                <Loader2 className={styles.spinner} size={24} />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#444" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    interval={timeRange === 'DAILY' ? 3 : 'preserveStartEnd'}
                  />
                  <Tooltip 
                    cursor={{fill: '#111'}}
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{ 
                            backgroundColor: '#050505', 
                            border: '1px solid #1a1a1a', 
                            padding: '12px',
                            borderRadius: '4px'
                          }}>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#fff' }}>
                              {payload[0].value} ORDERS
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="#1a1a1a" 
                    radius={[2, 2, 0, 0]}
                    onMouseEnter={() => {}} // Could add hover effect
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
