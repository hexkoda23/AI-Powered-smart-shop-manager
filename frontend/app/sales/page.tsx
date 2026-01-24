'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { salesApi, itemsApi, Item, Sale } from '../../lib/api';
import { Plus, X } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../lib/utils';

export default function SalesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 1,
    selling_price: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, salesData] = await Promise.all([
        itemsApi.getAll(),
        salesApi.getAll({ limit: 20 }),
      ]);
      setItems(itemsData);
      setRecentSales(salesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await salesApi.create(formData);
      setFormData({ item_name: '', quantity: 1, selling_price: 0 });
      setShowForm(false);
      await loadData();
      alert('Sale recorded successfully!');
    } catch (error: any) {
      console.error('Failed to record sale:', error);
      alert('Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (itemName: string) => {
    const item = items.find(i => i.name === itemName);
    setFormData({
      ...formData,
      item_name: itemName,
      selling_price: item?.unit_price || 0,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Record Sale</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Sale
          </button>
        </div>

        {/* Sales Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 mb-8 border border-transparent dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Record New Sale</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Item Name
                </label>
                <input
                  list="items-list"
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => handleItemSelect(e.target.value)}
                  onInput={(e) => setFormData({ ...formData, item_name: e.currentTarget.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                  placeholder="Type or select item name"
                  required
                />
                <datalist id="items-list">
                  {items.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    Selling Price (per unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="bg-primary-50 dark:bg-slate-950/50 p-4 rounded-lg border border-transparent dark:border-slate-800">
                <p className="text-sm text-gray-600 dark:text-slate-300">
                  Total: <span className="font-semibold text-primary-700">
                    {formatCurrency(formData.quantity * formData.selling_price)}
                  </span>
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-950 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Recording...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Sales</h2>
          {recentSales.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-slate-400 py-12">
              <p>No sales recorded yet. Record your first sale above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-slate-950/60">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {sale.item_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                        {sale.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                        {formatCurrency(sale.selling_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(sale.quantity * sale.selling_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                        {formatDateTime(sale.sale_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
