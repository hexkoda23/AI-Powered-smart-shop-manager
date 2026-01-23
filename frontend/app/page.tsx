'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import StatCard from '@/components/StatCard';
import { DashboardStats } from '@/lib/api';
import { dashboardApi } from '@/lib/api';
import { DollarSign, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-600">Failed to load dashboard data</div>
        </div>
      </div>
    );
  }

  const bestSellingData = stats.best_selling_items.map(item => ({
    name: item.name,
    quantity: item.quantity,
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Daily Profit"
            value={stats.daily_profit}
            icon={DollarSign}
            isCurrency
          />
          <StatCard
            title="Weekly Profit"
            value={stats.weekly_profit}
            icon={TrendingUp}
            isCurrency
          />
          <StatCard
            title="Monthly Profit"
            value={stats.monthly_profit}
            icon={DollarSign}
            isCurrency
          />
          <StatCard
            title="Low Stock Items"
            value={stats.low_stock_items.length}
            icon={AlertTriangle}
          />
        </div>

        {/* Sales Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 border border-transparent dark:border-slate-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Today's Sales</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.total_sales_today} items</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 border border-transparent dark:border-slate-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">This Week</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.total_sales_week} items</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 border border-transparent dark:border-slate-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">This Month</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.total_sales_month} items</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Best Selling Items */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 border border-transparent dark:border-slate-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Best Selling Items</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bestSellingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 border border-transparent dark:border-slate-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Low Stock Alerts</h3>
            {stats.low_stock_items.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-slate-400 py-12">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-slate-500" />
                <p>All items are well stocked!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.low_stock_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-slate-300">
                        Only {item.current_stock} left (threshold: {item.low_stock_threshold})
                      </p>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Slow Moving Items */}
        {stats.slow_moving_items.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 border border-transparent dark:border-slate-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Slow Moving Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.slow_moving_items.map((item) => (
                <div key={item.name} className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/40 rounded-lg">
                  <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">{item.quantity} sold this month</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
