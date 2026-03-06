'use client';

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import StatCard from '../../components/StatCard';
import { DashboardStats } from '../../lib/api';
import { dashboardApi } from '../../lib/api';
import { getShopContext, getRole, Role, isOwnerSessionValid } from '../../lib/auth';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Package, AlertTriangle, Calendar, ShoppingCart, Info, UserCheck, User as UserIcon, RefreshCcw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '../../lib/utils';

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeStore, setActiveStore] = useState('Default');
    const [role, setRole] = useState<Role>(null);

    useEffect(() => {
        const context = getShopContext();
        if (!context.id) {
            router.replace('/login');
            return;
        }

        loadStats();
        if (context.name) setActiveStore(context.name);
        setRole(getRole());
    }, [router]);

    const loadStats = async () => {
        try {
            const data = await dashboardApi.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen page-enter" style={{ backgroundColor: 'var(--bg)' }}>
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                            INITIALIZING DASHBOARD...
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="card border-[var(--danger)]/30 text-center max-w-xl mx-auto py-16">
                        <div className="w-20 h-20 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} color="var(--danger)" />
                        </div>
                        <h2 style={{ color: 'var(--white)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>DASHBOARD_SYNC_FAILURE</h2>
                        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                            We encountered a problem establishing a secure connection to your shop database. This may be due to an expired session or temporary system maintenance.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => { setLoading(true); loadStats(); }}
                                className="btn btn-primary flex items-center justify-center gap-2 px-8"
                            >
                                <RefreshCcw size={18} />
                                RETRY_CONNECTION
                            </button>
                            <button
                                onClick={() => router.push('/login')}
                                className="btn btn-outline px-8"
                            >
                                RE-AUTHENTICATE
                            </button>
                            <button
                                onClick={() => router.push('/register')}
                                className="btn btn-outline px-8 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-dim)]"
                            >
                                INITIALIZE_NEW_SHOP
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const bestSellingData = stats.best_selling_items.map(item => ({
        name: item.name,
        quantity: item.quantity,
    }));

    return (
        <div className="min-h-screen page-enter" style={{ backgroundColor: 'var(--bg)' }}>
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="badge badge-accent">Operational</span>
                            <span className="badge badge-info">Store: {activeStore}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: '0.7rem' }}>
                                LAST_SYNC: {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                        <h1 style={{ fontSize: '2.5rem', lineHeight: 1 }}>Overview</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {role && (
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-2xl border animate-in zoom-in duration-500",
                                role === 'owner'
                                    ? "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)] shadow-[0_0_20px_rgba(0,229,160,0.1)]"
                                    : "bg-[var(--info)]/10 border-[var(--info)]/20 text-[var(--info)] shadow-[0_0_20px_rgba(0,149,255,0.1)]"
                            )}>
                                {role === 'owner' ? <UserCheck size={16} /> : <UserIcon size={16} />}
                                <span className="font-display font-bold tracking-widest text-xs uppercase">
                                    {role === 'owner' ? 'Owner' : 'Worker'} Page
                                </span>
                            </div>
                        )}

                        <div className="card p-3 flex items-center gap-3" style={{ padding: '0.75rem 1.25rem' }}>
                            <Calendar size={18} color="var(--accent)" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="Daily Profit"
                        value={stats.daily_profit}
                        icon={DollarSign}
                        isCurrency
                        trend={{ value: 12.5, isPositive: true }}
                    />
                    <StatCard
                        title="Weekly Profit"
                        value={stats.weekly_profit}
                        icon={TrendingUp}
                        isCurrency
                        trend={{ value: 4.2, isPositive: true }}
                    />
                    <StatCard
                        title="Monthly Profit"
                        value={stats.monthly_profit}
                        icon={DollarSign}
                        isCurrency
                        trend={{ value: 2.1, isPositive: false }}
                    />
                    <div
                        onClick={() => router.push('/stock')}
                        className="cursor-pointer transition-transform hover:scale-[1.02]"
                        title="View Low Stock Items in Inventory"
                    >
                        <StatCard
                            title="Inventory Risk"
                            value={stats.low_stock_items.length}
                            icon={AlertTriangle}
                        />
                    </div>
                </div>

                {/* Volume Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[
                        { label: 'TODAY_VOLUME', val: stats.total_sales_today, color: 'var(--accent)' },
                        { label: 'WEEK_VOLUME', val: stats.total_sales_week, color: 'var(--info)' },
                        { label: 'MONTH_VOLUME', val: stats.total_sales_month, color: 'var(--gold)' }
                    ].map((item, i) => (
                        <div key={i} className="card flex items-center justify-between group">
                            <div>
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)' }}>{item.label}</p>
                                <p style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>{item.val} <span style={{ fontSize: '0.9rem', color: 'var(--text-3)', fontWeight: 400 }}>UNITS</span></p>
                            </div>
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: 'var(--bg-3)',
                                    borderRadius: 'var(--radius)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--border)'
                                }}
                            >
                                <ShoppingCart size={18} style={{ color: item.color }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Analytics & Alerts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* Best Selling Chart */}
                    <div className="lg:col-span-2 card">
                        <div className="flex items-center justify-between mb-8">
                            <h3 style={{ fontSize: '1.25rem' }}>Top Performance</h3>
                            <span className="badge badge-info">Units Sold</span>
                        </div>
                        <div style={{ width: '100%', height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={bestSellingData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--text-3)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                                        itemStyle={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                                        cursor={{ fill: 'var(--bg-3)' }}
                                    />
                                    <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                                        {bestSellingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--accent)' : 'var(--bg-3)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Low Stock Sidebar */}
                    <div className="card flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 style={{ fontSize: '1.25rem' }}>Critical Stock</h3>
                            <AlertTriangle size={18} color="var(--danger)" />
                        </div>

                        <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '350px' }}>
                            {stats.low_stock_items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                                    <Package size={40} className="mb-4" />
                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>NOMINAL_LEVELS</p>
                                </div>
                            ) : (
                                stats.low_stock_items.map((item) => (
                                    <div key={item.id} className="p-4 rounded-[var(--radius)] bg-[var(--bg-3)] border border-[var(--border)] flex justify-between items-center group">
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                                                QTY: {item.current_stock} / MIN: {item.low_stock_threshold}
                                            </p>
                                        </div>
                                        <div
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--danger)',
                                                boxShadow: '0 0 10px var(--danger)'
                                            }}
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        {stats.low_stock_items.length > 0 && (
                            <button className="btn btn-outline w-full mt-auto pt-4" style={{ marginTop: '1.5rem' }}>
                                VIEW_ALL_ALERTS
                            </button>
                        )}
                    </div>
                </div>

                {/* Slow Moving Items Section */}
                {stats.slow_moving_items.length > 0 && (
                    <div className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
                        <div className="flex items-center gap-3 mb-6">
                            <Info size={20} color="var(--gold)" />
                            <h3 style={{ fontSize: '1.25rem' }}>Optimization Insights</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.slow_moving_items.map((item) => (
                                <div key={item.name} className="p-4 bg-[var(--bg-3)] rounded-[var(--radius)] border border-[var(--border)]">
                                    <p style={{ color: 'var(--text-2)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>SLOW_MOVING</p>
                                    <p style={{ fontWeight: 700 }}>{item.name}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--gold)', marginTop: '0.5rem' }}>
                                        Only {item.quantity} sold this month
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
