import { useState, useEffect } from 'react';
import {
  TrendingUp, ShoppingBag, DollarSign, Package, Loader2, Tag
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LabelList
} from 'recharts';
import styles from './Analytics.module.css';
import { supabase } from '../../../lib/supabase';
import { useSettings } from '../../../context/SettingsContext';
import type { Sale } from '../../../types/sales';

type TimeRange = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('WEEKLY');
  const [sales, setSales]         = useState<Sale[]>([]);
  const [prevSales, setPrevSales] = useState<Sale[]>([]);
  const [loading, setLoading]     = useState(true);
  const { settings } = useSettings();

  useEffect(() => { fetchSales(); }, [timeRange]);

  const getDateBounds = (range: TimeRange, offset: 0 | 1) => {
    const now = new Date();
    let start = new Date();
    let end   = new Date();

    if (range === 'DAILY') {
      const shift = offset * 1;
      start = new Date(now); start.setDate(now.getDate() - shift); start.setHours(0,0,0,0);
      end   = new Date(now); end.setDate(now.getDate() - shift + 1); end.setHours(0,0,0,0);
    } else if (range === 'WEEKLY') {
      const shift = offset * 7;
      start = new Date(now); start.setDate(now.getDate() - 6 - shift); start.setHours(0,0,0,0);
      end   = new Date(now); end.setDate(now.getDate() - shift); end.setHours(23,59,59,999);
    } else if (range === 'MONTHLY') {
      const shift = offset * 30;
      start = new Date(now); start.setDate(now.getDate() - 29 - shift); start.setHours(0,0,0,0);
      end   = new Date(now); end.setDate(now.getDate() - shift); end.setHours(23,59,59,999);
    } else if (range === 'YEARLY') {
      const shift = offset * 12;
      const startM = new Date(now); startM.setMonth(now.getMonth() - 11 - shift, 1); startM.setHours(0,0,0,0);
      const endM   = new Date(now); endM.setMonth(now.getMonth() - shift + 1, 0); endM.setHours(23,59,59,999);
      return { start: startM, end: endM };
    }
    return { start, end };
  };

  const fetchSales = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      const curr = getDateBounds(timeRange, 0);
      const prev = getDateBounds(timeRange, 1);

      const [{ data: currData }, { data: prevData }] = await Promise.all([
        supabase.from('sales').select('*').gte('created_at', curr.start.toISOString()).lte('created_at', curr.end.toISOString()).order('created_at', { ascending: true }),
        supabase.from('sales').select('*').gte('created_at', prev.start.toISOString()).lte('created_at', prev.end.toISOString()),
      ]);

      setSales(currData || []);
      setPrevSales(prevData || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Metrics ─────────────────────────────────────────────────────────────
  const totalRevenue   = sales.reduce((s, x) => s + (x.total || 0), 0);
  const totalOrders    = sales.length;
  const avgOrderValue  = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const itemsSold      = sales.reduce((s, x) => s + x.items.reduce((si, i) => si + (i.quantity || 0), 0), 0);

  const prevRevenue   = prevSales.reduce((s, x) => s + (x.total || 0), 0);
  const prevOrders    = prevSales.length;
  const prevAvg       = prevOrders > 0 ? prevRevenue / prevOrders : 0;
  const prevItems     = prevSales.reduce((s, x) => s + x.items.reduce((si, i) => si + (i.quantity || 0), 0), 0);

  const delta = (curr: number, prev: number) => {
    if (prev === 0) return null;
    return ((curr - prev) / prev * 100);
  };

  const revenueGrowth  = delta(totalRevenue, prevRevenue);
  const ordersGrowth   = delta(totalOrders, prevOrders);
  const avgGrowth      = delta(avgOrderValue, prevAvg);
  const itemsGrowth    = delta(itemsSold, prevItems);

  // ─── Top Products ────────────────────────────────────────────────────────
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productMap[item.name]) productMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      productMap[item.name].qty     += item.quantity;
      productMap[item.name].revenue += item.subtotal ?? (item.price * item.quantity);
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  // ─── Payment Breakdown ───────────────────────────────────────────────────
  const paymentMap: Record<string, number> = {};
  sales.forEach(s => {
    const m = (s.payment_method || 'Unknown').toUpperCase();
    paymentMap[m] = (paymentMap[m] || 0) + s.total;
  });
  const paymentBreakdown = Object.entries(paymentMap).sort((a, b) => b[1] - a[1]);
  const paymentTotal = paymentBreakdown.reduce((s, [, v]) => s + v, 0);

  // ─── Chart Data ──────────────────────────────────────────────────────────
  const getChartData = () => {
    const now = new Date();
    interface Pt { name: string; revenue: number; orders: number; dateKey?: string; monthKey?: string; }

    if (timeRange === 'DAILY') {
      const hourly: Pt[] = Array.from({ length: 24 }, (_, i) => ({
        name: `${i.toString().padStart(2, '0')}:00`, revenue: 0, orders: 0
      }));
      sales.forEach(sale => {
        const d = new Date(sale.created_at);
        if (d.toDateString() === now.toDateString()) {
          hourly[d.getHours()].revenue += sale.total;
          hourly[d.getHours()].orders  += 1;
        }
      });
      return hourly;
    }

    if (timeRange === 'WEEKLY') {
      const days: Pt[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(now.getDate() - i);
        days.push({ dateKey: d.toLocaleDateString(), name: d.toLocaleDateString([], { weekday: 'short' }), revenue: 0, orders: 0 });
      }
      sales.forEach(s => {
        const e = days.find(d => d.dateKey === new Date(s.created_at).toLocaleDateString());
        if (e) { e.revenue += s.total; e.orders += 1; }
      });
      return days;
    }

    if (timeRange === 'MONTHLY') {
      const days: Pt[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(now.getDate() - i);
        days.push({ dateKey: d.toLocaleDateString(), name: d.toLocaleDateString([], { month: 'short', day: 'numeric' }), revenue: 0, orders: 0 });
      }
      sales.forEach(s => {
        const e = days.find(d => d.dateKey === new Date(s.created_at).toLocaleDateString());
        if (e) { e.revenue += s.total; e.orders += 1; }
      });
      return days;
    }

    if (timeRange === 'YEARLY') {
      const months: Pt[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(); d.setMonth(now.getMonth() - i);
        months.push({ monthKey: `${d.getFullYear()}-${d.getMonth()}`, name: d.toLocaleDateString([], { month: 'short' }), revenue: 0, orders: 0 });
      }
      sales.forEach(s => {
        const d = new Date(s.created_at);
        const e = months.find(m => m.monthKey === `${d.getFullYear()}-${d.getMonth()}`);
        if (e) { e.revenue += s.total; e.orders += 1; }
      });
      return months;
    }
    return [];
  };

  const chartData = getChartData();

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const fmt    = (n: number) => `${settings.currency_symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtShort = (n: number) => {
    if (n >= 1_000_000) return `${settings.currency_symbol}${(n/1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${settings.currency_symbol}${(n/1_000).toFixed(1)}K`;
    return fmt(n);
  };

  const GrowthBadge = ({ pct }: { pct: number | null }) => {
    if (pct === null) return <span className={styles.growthNeutral}>— vs prev</span>;
    const up = pct >= 0;
    return (
      <span className={up ? styles.growthUp : styles.growthDown}>
        {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}% <span className={styles.growthLabel}>vs prev period</span>
      </span>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className={styles.tooltip}>
        <p className={styles.ttLabel}>{label}</p>
        <p className={styles.ttRevenue}>{fmt(payload[0]?.value || 0)}</p>
        {payload[1]?.value > 0 && (
          <p className={styles.ttOrders}>{payload[1].value} order{payload[1].value !== 1 ? 's' : ''}</p>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1>ANALYTICS REPORT</h1>
          <p>PERFORMANCE METRICS &amp; TRENDS</p>
        </div>
        <div className={styles.timeSelector}>
          {(['DAILY','WEEKLY','MONTHLY','YEARLY'] as TimeRange[]).map(r => (
            <button
              key={r}
              className={`${styles.timeBtn} ${timeRange === r ? styles.timeBtnActive : ''}`}
              onClick={() => setTimeRange(r)}
            >{r}</button>
          ))}
        </div>
      </header>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        {[
          { label: 'TOTAL REVENUE',    value: fmt(totalRevenue),                      growth: revenueGrowth, icon: <DollarSign  size={80} className={styles.statIcon} />, accent: true },
          { label: 'TOTAL ORDERS',     value: String(totalOrders),                    growth: ordersGrowth,  icon: <ShoppingBag size={80} className={styles.statIcon} /> },
          { label: 'AVG. ORDER VALUE', value: fmt(avgOrderValue),                     growth: avgGrowth,     icon: <TrendingUp  size={80} className={styles.statIcon} />, accent: true },
          { label: 'ITEMS SOLD',       value: String(itemsSold),                      growth: itemsGrowth,   icon: <Package     size={80} className={styles.statIcon} /> },
        ].map(({ label, value, growth, icon, accent }) => (
          <div key={label} className={styles.statCard}>
            {icon}
            <span className={styles.statLabel}>{label}</span>
            <span className={`${styles.statValue} ${accent ? styles.accentValue : ''}`}>{value}</span>
            <GrowthBadge pct={growth ?? null} />
          </div>
        ))}
      </div>

      {/* ── Revenue Trend (full width) ─────────────────────────────────── */}
      <div className={styles.chartPanel}>
        <div className={styles.panelHeader}>
          <h2>REVENUE TREND</h2>
          <div className={styles.chartViewBadge}>{timeRange} VIEW</div>
        </div>
        <div className={styles.chartContainer}>
          {loading ? (
            <div className={styles.spinnerWrapper}><Loader2 className={styles.spinner} size={24} /></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00ff9d" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#00ff9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                <XAxis dataKey="name" stroke="#333" fontSize={10} tickLine={false} axisLine={false}
                  interval={timeRange === 'DAILY' ? 2 : 'preserveStartEnd'} />
                <YAxis stroke="#333" fontSize={10} tickLine={false} axisLine={false}
                  tickFormatter={v => fmtShort(v)} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#00ff9d" strokeWidth={2}
                  fillOpacity={1} fill="url(#colorRevenue)" />
                {/* Hidden area to expose orders in tooltip payload */}
                <Area type="monotone" dataKey="orders" stroke="transparent" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Bottom Row: 3 panels ──────────────────────────────────────────── */}
      <div className={styles.bottomGrid}>

        {/* Top Products */}
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <h2>TOP PRODUCTS</h2>
            <span className={styles.chartViewBadge}>BY REVENUE</span>
          </div>
          <div className={styles.chartContainer}>
            {loading ? (
              <div className={styles.spinnerWrapper}><Loader2 className={styles.spinner} size={24} /></div>
            ) : topProducts.length === 0 ? (
              <div className={styles.emptyChart}>NO SALES DATA</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" horizontal={false} />
                  <XAxis type="number" stroke="#333" fontSize={9} tickLine={false} axisLine={false}
                    tickFormatter={v => fmtShort(v)} />
                  <YAxis type="category" dataKey="name" stroke="#444" fontSize={9} tickLine={false}
                    axisLine={false} width={120}
                    tickFormatter={v => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className={styles.tooltip}>
                          <p className={styles.ttLabel}>{payload[0]?.payload?.name}</p>
                          <p className={styles.ttRevenue}>{fmt(payload[0]?.value || 0)}</p>
                          <p className={styles.ttOrders}>{payload[0]?.payload?.qty} units sold</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="revenue" fill="#1a3d2b" stroke="#00ff9d" strokeWidth={1} radius={[0, 2, 2, 0]}
                    activeBar={{ fill: '#00ff9d', stroke: '#00ff9d' }}>
                    <LabelList dataKey="revenue" position="right" style={{ fill: '#555', fontSize: 9, fontWeight: 900 }}
                      formatter={((v: number) => fmtShort(v)) as any} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <h2>PAYMENT SPLIT</h2>
            <Tag size={14} className={styles.panelIcon} />
          </div>
          {loading ? (
            <div className={styles.spinnerWrapper}><Loader2 className={styles.spinner} size={24} /></div>
          ) : paymentBreakdown.length === 0 ? (
            <div className={styles.emptyChart}>NO SALES DATA</div>
          ) : (
            <div className={styles.paymentList}>
              {paymentBreakdown.map(([method, amount]) => {
                const pct = paymentTotal > 0 ? (amount / paymentTotal * 100) : 0;
                return (
                  <div key={method} className={styles.paymentRow}>
                    <div className={styles.paymentMeta}>
                      <span className={styles.paymentMethod}>{method}</span>
                      <span className={styles.paymentAmount}>{fmt(amount)}</span>
                    </div>
                    <div className={styles.paymentBarTrack}>
                      <div className={styles.paymentBarFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.paymentPct}>{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
              <div className={styles.paymentTotal}>
                <span>TOTAL REVENUE</span>
                <span>{fmt(paymentTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Order Volume */}
        <div className={styles.chartPanel}>
          <div className={styles.panelHeader}>
            <h2>ORDER VOLUME</h2>
            <span className={styles.chartViewBadge}>{totalOrders} ORDERS</span>
          </div>
          <div className={styles.chartContainer}>
            {loading ? (
              <div className={styles.spinnerWrapper}><Loader2 className={styles.spinner} size={24} /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111" vertical={false} />
                  <XAxis dataKey="name" stroke="#333" fontSize={9} tickLine={false} axisLine={false}
                    interval={timeRange === 'DAILY' ? 3 : 'preserveStartEnd'} />
                  <YAxis stroke="#333" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className={styles.tooltip}>
                          <p className={styles.ttRevenue}>{payload[0].value} orders</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="orders" fill="#1a3d2b" stroke="#00ff9d" strokeWidth={1} radius={[2, 2, 0, 0]}
                    activeBar={{ fill: '#00ff9d', stroke: '#00ff9d' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
