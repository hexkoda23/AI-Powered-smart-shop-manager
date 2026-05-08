'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Calendar, DollarSign, Package, RefreshCcw, ShoppingCart, UserCheck, User as UserIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import { DashboardStats, Sale, dashboardApi, salesApi } from '../../lib/api';
import { Role, getRole, getShopContext, getWorkerProfile } from '../../lib/auth';
import { cn, formatCurrency, formatDateTime } from '../../lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeStore, setActiveStore] = useState('Notable');
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const context = getShopContext();
    if (!context.id) {
      router.replace('/login');
      return;
    }
    if (context.name) setActiveStore(context.name);
    setRole(getRole());
    loadStats();
  }, [router]);

  const loadStats = async () => {
    setLoading(true);
    try {
      setErrorMsg(null);
      const [statsData, salesData] = await Promise.all([
        dashboardApi.getStats(),
        salesApi.getAll({ limit: 10 }),
      ]);
      setStats(statsData);
      setRecentSales(salesData);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      setErrorMsg(error?.response?.data?.detail || 'Could not reach the shop server.');
    } finally {
      setLoading(false);
    }
  };

  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return recentSales
      .filter((sale) => new Date(sale.sale_date).toDateString() === today)
      .reduce((sum, sale) => sum + sale.quantity * sale.selling_price, 0);
  }, [recentSales]);

  const chartData = stats ? [
    { name: 'Today', profit: stats.daily_profit },
    { name: 'Week', profit: stats.weekly_profit },
    { name: 'Month', profit: stats.monthly_profit },
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen page-enter bg-[#0A0A0F]">
        <Navbar />
        <main className="app-main flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-white/45">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#6C63FF] border-t-transparent" />
            <span className="text-sm">Loading dashboard</span>
          </div>
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen page-enter bg-[#0A0A0F]">
        <Navbar />
        <main className="app-main">
          <div className="card mx-auto max-w-xl py-14 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-300/70" />
            <h1 className="font-display text-2xl font-bold">Dashboard sync failed</h1>
            <p className="mt-2 text-sm text-white/45">{errorMsg}</p>
            <button onClick={loadStats} className="btn btn-primary mt-6">
              <RefreshCcw size={16} />
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter bg-[#0A0A0F]">
      <Navbar />
      <main className="app-main">
        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-white md:text-5xl">{activeStore}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/45">
              <Calendar size={16} className="text-[#b9b5ff]" />
              {new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              <span className={cn('badge ml-1', role === 'owner' ? 'badge-accent' : 'badge-info')}>
                {role === 'owner' ? <UserCheck size={12} /> : <UserIcon size={12} />}
                {role === 'owner' ? 'Owner' : (getWorkerProfile() || 'Worker')}
              </span>
            </div>
          </div>
          <button onClick={loadStats} className="btn btn-ghost self-start md:self-auto">
            <RefreshCcw size={16} />
            Refresh
          </button>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Today's Revenue" value={todayRevenue} icon={DollarSign} isCurrency tone="success" trend={{ value: 8.4, isPositive: true }} />
          <StatCard title="Today's Profit" value={stats.daily_profit} icon={DollarSign} isCurrency tone="accent" trend={{ value: 4.2, isPositive: true }} />
          <StatCard title="Sales Today" value={stats.total_sales_today} icon={ShoppingCart} tone="info" />
          <button type="button" onClick={() => router.push('/stock')} className="text-left">
            <StatCard title="Low Stock Items" value={stats.low_stock_items.length} icon={AlertTriangle} tone={stats.low_stock_items.length ? 'danger' : 'warn'} />
          </button>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="card xl:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Weekly Profit</h2>
                <p className="text-sm text-white/45">Fast read on current performance</p>
              </div>
              <span className="badge badge-accent">Naira</span>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8B8B9E', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8B8B9E', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(108,99,255,0.08)' }}
                    contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#F0F0F5' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="profit" fill="#6C63FF" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Low Stock Alerts</h2>
              <AlertTriangle size={18} className="text-amber-300" />
            </div>
            <div className="space-y-3">
              {stats.low_stock_items.length === 0 ? (
                <div className="py-12 text-center text-white/35">
                  <Package className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  No low stock items yet
                </div>
              ) : (
                stats.low_stock_items.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="mt-1 text-xs text-white/45">Stock {item.current_stock} / Threshold {item.low_stock_threshold}</p>
                      </div>
                      <button onClick={() => router.push('/stock')} className="btn btn-ghost px-3 py-2 text-xs">
                        Restock
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold">Recent Sales</h2>
              <p className="text-sm text-white/45">Last 10 sales recorded in the shop</p>
            </div>
            <span className="badge badge-info">Live</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Price</th>
                  <th>Time</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-white/35">No sales yet</td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-medium text-white">{sale.item_name}</td>
                      <td className="mono text-center">{sale.quantity}</td>
                      <td className="mono text-right text-emerald-300">{formatCurrency(sale.quantity * sale.selling_price)}</td>
                      <td>{formatDateTime(sale.sale_date)}</td>
                      <td><span className="badge badge-info">{sale.recorded_by || 'Owner'}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
