'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { itemsApi, Item } from '@/lib/api';
import { Plus, Edit2, Trash2, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function StockPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    current_stock: 0,
    low_stock_threshold: 10,
    unit_price: 0,
    cost_price: 0,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const data = await itemsApi.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        await itemsApi.update(editingItem.id, formData);
      } else {
        await itemsApi.create(formData);
      }
      setFormData({ name: '', current_stock: 0, low_stock_threshold: 10, unit_price: 0, cost_price: 0 });
      setShowForm(false);
      setEditingItem(null);
      await loadItems();
      alert(editingItem ? 'Item updated successfully!' : 'Item created successfully!');
    } catch (error: any) {
      console.error('Failed to save item:', error);
      alert(error.response?.data?.detail || 'Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      current_stock: item.current_stock,
      low_stock_threshold: item.low_stock_threshold,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await itemsApi.delete(id);
      await loadItems();
      alert('Item deleted successfully!');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const lowStockItems = items.filter(item => item.current_stock <= item.low_stock_threshold);
  const wellStockedItems = items.filter(item => item.current_stock > item.low_stock_threshold);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Stock Management</h1>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingItem(null);
              setFormData({ name: '', current_stock: 0, low_stock_threshold: 10, unit_price: 0, cost_price: 0 });
            }}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </button>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-lg p-6 mb-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold text-red-900">Low Stock Alerts</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-red-300 dark:border-red-900/50"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-red-600 mt-1">
                    Only {item.current_stock} left (threshold: {item.low_stock_threshold})
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 mb-8 border border-transparent dark:border-slate-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                  required
                  disabled={!!editingItem}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    Unit Price (Selling)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                    Cost Price (Buying)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {formData.unit_price > 0 && formData.cost_price > 0 && (
                <div className="bg-primary-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Profit per unit: <span className="font-semibold text-primary-700">
                      {formatCurrency(formData.unit_price - formData.cost_price)}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-950 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stock List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">All Items</h2>
          {items.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-slate-400 py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-slate-500" />
              <p>No items in stock. Add your first item above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                  {items.map((item) => {
                    const isLowStock = item.current_stock <= item.low_stock_threshold;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-950/60">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                          {item.current_stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                          {item.low_stock_threshold}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-300">
                          {formatCurrency(item.cost_price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isLowStock ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
    );
}
