'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { itemsApi, aiApi, Item, DeepInsight } from '../../lib/api';
import { Plus, Edit2, Trash2, AlertTriangle, Package, X, Save, TrendingUp, Info, Zap, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { isOwnerSessionValid } from '../../lib/auth';
import { cn } from '../../lib/utils';

export default function StockPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [insights, setInsights] = useState<DeepInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'restock'>('add');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    current_stock: 0,
    low_stock_threshold: 10,
    unit_price: 0,
    cost_price: 0,
  });

  useEffect(() => {
    if (!isOwnerSessionValid()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, insightsData] = await Promise.all([
        itemsApi.getAll(),
        aiApi.getDeepInsights()
      ]);
      setItems(itemsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to load stock data:', error);
    }
  };

  const handleOpenModal = (type: 'add' | 'edit' | 'restock', item?: Item) => {
    setModalType(type);
    setSelectedItem(item || null);
    if (type === 'edit' && item) {
      setFormData({
        name: item.name,
        current_stock: item.current_stock,
        low_stock_threshold: item.low_stock_threshold,
        unit_price: item.unit_price,
        cost_price: item.cost_price,
      });
    } else if (type === 'restock' && item) {
      setRestockQty(0);
    } else {
      setFormData({ name: '', current_stock: 0, low_stock_threshold: 10, unit_price: 0, cost_price: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (modalType === 'edit' && selectedItem) {
        await itemsApi.update(selectedItem.id, formData);
      } else if (modalType === 'add') {
        await itemsApi.create(formData);
      } else if (modalType === 'restock' && selectedItem) {
        await itemsApi.update(selectedItem.id, {
          current_stock: selectedItem.current_stock + restockQty,
        });
      }
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Failed to save operation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('CONFIRM_ITEM_REMOVAL?')) return;
    try {
      await itemsApi.delete(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const handleAutoGenerateOrder = () => {
    const highRisk = insights.filter(i => i.restock_score >= 50);
    if (highRisk.length === 0) return;

    const orderText = highRisk.map(i => `- ${i.name}: Suggested Restock ${i.suggested_restock_qty} units (Est. days remaining: ${i.days_remaining})`).join('\n');
    const fullText = `PROVISION_ORDER_LIST\nDATE: ${new Date().toLocaleDateString()}\n-------------------\n${orderText}\n-------------------`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highRiskItems = insights.filter(i => i.restock_score >= 70).slice(0, 3);

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <Package size={24} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: '2.5rem', lineHeight: 1 }}>Inventory</h1>
          </div>

          <button
            onClick={() => handleOpenModal('add')}
            className="btn btn-primary"
          >
            <Plus size={18} />
            NEW_ITEM
          </button>
        </div>

        {/* AI Insights Panel */}
        {insights.length > 0 && (
          <div className="card border-dashed mb-10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={120} color="var(--accent)" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} color="var(--accent)" />
                  <h3 style={{ fontSize: '1.25rem' }}>AI Restock Optimizer</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {highRiskItems.length > 0 ? (
                    highRiskItems.map(item => (
                      <div key={item.id} className="p-4 bg-[var(--bg-3)] rounded-[var(--radius)] border border-[var(--danger)]/30 backdrop-blur-sm">
                        <div className="flex justify-between items-start mb-2">
                          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</p>
                          <span className="badge badge-danger text-[10px] py-0 px-1">HIGH_RISK</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                          STOCKOUT_EST: <span className="text-[var(--danger)] font-bold">{item.days_remaining} DAYS</span>
                        </p>
                        <div className="mt-3 w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--danger)]"
                            style={{ width: `${item.restock_score}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="md:col-span-3 py-6 text-center opacity-50">
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>ALL_INVENTORY_LEVELS_NOMINAL</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[240px]">
                <div className="bg-[var(--bg-2)] p-4 rounded-[var(--radius)] border border-[var(--border)]">
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>GLOBAL_HEALTH</p>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      {insights.filter(i => i.restock_score < 50).length}/{insights.length}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Optimum</span>
                  </div>
                </div>
                <button
                  onClick={handleAutoGenerateOrder}
                  disabled={insights.filter(i => i.restock_score >= 50).length === 0}
                  className="btn btn-outline w-full flex items-center justify-center gap-2 py-3"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'ORDER_COPIED' : 'GENERATE_ORDER_LIST'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Restock Pills for Low Stock */}
        {items.filter(i => i.current_stock <= i.low_stock_threshold).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--danger)', alignSelf: 'center', marginRight: '0.5rem' }}>QUICK_RESTOCK:</span>
            {items.filter(i => i.current_stock <= i.low_stock_threshold).map(item => (
              <button
                key={item.id}
                onClick={() => handleOpenModal('restock', item)}
                className="badge badge-danger hover:brightness-125 transition-all flex items-center gap-2"
              >
                {item.name} ({item.current_stock})
                <ArrowUpRight size={10} />
              </button>
            ))}
          </div>
        )}

        {/* Stock List Card */}
        <div className="card flex flex-col min-h-[600px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="badge badge-info">Master Catalog</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>TOTAL_SKUS: {items.length}</span>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 opacity-30 gap-4">
              <Package size={48} />
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>CATALOG_EMPTY</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ITEM_IDENTITY</th>
                    <th className="text-center">STOCK_LVL</th>
                    <th className="text-right">DAILY_BURN</th>
                    <th className="text-right">EST_DAYS</th>
                    <th className="text-right">MARGIN_%</th>
                    <th className="text-right">STATUS</th>
                    <th className="text-right">MGMT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const insight = insights.find(ins => ins.id === item.id);
                    const isLow = item.current_stock <= item.low_stock_threshold || (insight && insight.days_remaining <= 7);
                    const margin = ((item.unit_price - item.cost_price) / item.unit_price) * 100;
                    return (
                      <tr key={item.id}>
                        <td>
                          <span style={{ fontWeight: 700 }}>{item.name}</span>
                        </td>
                        <td className="text-center">
                          <span className={cn("mono font-bold", isLow ? "text-[var(--danger)]" : "text-[var(--white)]")}>
                            {item.current_stock}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className="mono text-[var(--text-3)]">{insight?.daily_burn_rate || 0}</span>
                        </td>
                        <td className="text-right">
                          <span className={cn("mono font-bold", (insight?.days_remaining || 0) <= 7 ? "text-[var(--danger)]" : "text-[var(--white)]")}>
                            {insight?.days_remaining === 999 ? '∞' : insight?.days_remaining}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex flex-col items-end">
                            <span className={cn("mono font-bold", margin > 30 ? "text-[var(--accent)]" : margin > 15 ? "text-[var(--gold)]" : "text-[var(--danger)]")}>
                              {margin.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="text-right">
                          <span className={cn("badge", isLow ? "badge-danger" : "badge-accent")}>
                            {isLow ? 'REPLENISH' : 'OPTIMAL'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal('restock', item)}
                              className="btn btn-outline p-1.5"
                              title="Quick Restock"
                            >
                              <Save size={14} color="var(--accent)" />
                            </button>
                            <button
                              onClick={() => handleOpenModal('edit', item)}
                              className="btn btn-outline p-1.5"
                              title="Edit Item"
                            >
                              <Edit2 size={14} color="var(--text-2)" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="btn btn-outline p-1.5 hover:bg-red-950/30"
                              title="Delete Item"
                            >
                              <Trash2 size={14} color="var(--danger)" />
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
      </main>

      {/* Modal Overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        >
          <div
            className="card p-8 w-full max-w-lg relative animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border-2)' }}
          >
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-[var(--bg-3)] rounded-full text-[var(--text-3)]"
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              {modalType === 'add' ? 'Register New Item' : modalType === 'edit' ? `Edit ${selectedItem?.name}` : `Restock ${selectedItem?.name}`}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {modalType !== 'restock' ? (
                <>
                  <div className="space-y-2">
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>PRODUCT_NAME</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input w-full"
                      required
                      placeholder="e.g. Indomie Onion Chicken"
                      disabled={modalType === 'edit'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>INIT_STOCK</label>
                      <input
                        type="number"
                        value={formData.current_stock}
                        onChange={(e) => setFormData({ ...formData, current_stock: parseInt(e.target.value) || 0 })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>ALERT_FLOOR</label>
                      <input
                        type="number"
                        value={formData.low_stock_threshold}
                        onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>BUYING_PRICE</label>
                      <input
                        type="number"
                        value={formData.cost_price}
                        onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>UNIT_PRICE</label>
                      <input
                        type="number"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>

                  {formData.unit_price > 0 && (
                    <div className="p-4 rounded-[var(--radius)] bg-[var(--bg-3)] border border-[var(--border)] flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} color="var(--accent)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Projected Margin</span>
                      </div>
                      <span style={{ color: 'var(--accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {(((formData.unit_price - formData.cost_price) / formData.unit_price) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-[var(--radius)] bg-[var(--bg-3)] border border-[var(--border)]">
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>CURRENT_RESERVE</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedItem?.current_stock} <span style={{ fontSize: '0.9rem', color: 'var(--text-3)', fontWeight: 400 }}>UNITS</span></p>
                  </div>
                  <div className="space-y-2">
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>ADD_QUANTITY</label>
                    <input
                      type="number"
                      value={restockQty}
                      onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                      className="input w-full text-center text-2xl h-16"
                      required
                      autoFocus
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-3)' }}>
                    <Info size={14} />
                    <span style={{ fontSize: '0.75rem' }}>New total will be {(selectedItem?.current_stock || 0) + restockQty} units</span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline flex-1 py-3"
                >
                  CANCEL_OP
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 py-3"
                >
                  {loading ? 'EXECUTING...' : 'COMMIT_CHANGES'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowUpRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}
