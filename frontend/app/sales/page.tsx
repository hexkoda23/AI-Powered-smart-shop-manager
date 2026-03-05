'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { salesApi, itemsApi, aiApi, customersApi, debtApi, Item, Sale, Suggestion, Customer } from '../../lib/api';
import { ShoppingBag, ArrowRight, History, AlertCircle, CheckCircle2, Zap, Sparkles, X, User, CreditCard } from 'lucide-react';
import { formatCurrency, formatDateTime, cn } from '../../lib/utils';
import { getRole, Role } from '../../lib/auth';
import { UserCheck, User as UserIcon } from 'lucide-react';

export default function SalesPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showGhost, setShowGhost] = useState(false);
  const [ghostType, setGhostType] = useState<'upsell' | 'margin' | 'idle'>('idle');
  const [payLater, setPayLater] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerRisk, setCustomerRisk] = useState<{ risk: 'LOW' | 'MEDIUM' | 'HIGH', current: number, limit: number } | null>(null);
  const [role, setRole] = useState<Role>(null);

  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 0,
    selling_price: 0,
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
    setRole(getRole());
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, salesData, customersData] = await Promise.all([
        itemsApi.getAll(),
        salesApi.getAll({ limit: 20 }),
        customersApi.getAll()
      ]);
      setItems(itemsData);
      setRecentSales(salesData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCustomerSelect = async (customerId: number) => {
    setSelectedCustomerId(customerId);
    const risk = await aiApi.getCustomerRisk(customerId);
    setCustomerRisk(risk);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (formData.quantity <= 0) {
        setError('QUANTITY_MUST_BE_POSITIVE');
        setLoading(false);
        return;
      }

      const total = formData.quantity * formData.selling_price;

      if (payLater && !selectedCustomerId) {
        setError('SELECT_CUSTOMER_FOR_CREDIT');
        setLoading(false);
        return;
      }

      await salesApi.create(formData);

      if (payLater && selectedCustomerId) {
        await debtApi.logDebt(selectedCustomerId, total, `Credit sale: ${formData.item_name} x ${formData.quantity}`);
      }

      setFormData({ item_name: '', quantity: 0, selling_price: 0 });
      setPayLater(false);
      setSelectedCustomerId(null);
      setCustomerRisk(null);
      await loadData();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'TRANSACTION_FAILED';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestions = async (itemName: string) => {
    const item = items.find(i => i.name === itemName);
    if (item) {
      const results = await aiApi.getSuggestions(item.id);
      setSuggestions(results);
      if (results.length > 0) {
        setShowGhost(true);
        setGhostType(results[0].type);
      } else {
        setShowGhost(false);
      }
    } else {
      setSuggestions([]);
      setShowGhost(false);
    }
  };

  const handleItemSelect = (itemName: string) => {
    const item = items.find(i => i.name === itemName);
    setFormData({
      ...formData,
      item_name: itemName,
      selling_price: item?.unit_price || 0,
    });
    updateSuggestions(itemName);
  };

  const selectedItem = items.find(i => i.name === formData.item_name) || null;

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--accent-dim)', borderRadius: 'var(--radius)', border: '1px solid var(--accent)' }}>
              <ShoppingBag size={24} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: '2.5rem', lineHeight: 1 }}>Point of Sale</h1>
          </div>

          {role && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl border animate-in zoom-in duration-500 self-start md:self-auto",
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Form Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card" style={{ borderTop: success ? '4px solid var(--accent)' : error ? '4px solid var(--danger)' : '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-8">
                <h3 style={{ fontSize: '1.25rem' }}>Record Transaction</h3>
                <span className="badge badge-info">Manual Entry</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 rounded-[var(--radius)] bg-[rgba(255,59,92,0.1)] border border-[var(--danger)] flex items-center gap-3">
                    <AlertCircle size={18} color="var(--danger)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-[var(--radius)] bg-[var(--accent-dim)] border border-[var(--accent)] flex items-center gap-3">
                    <CheckCircle2 size={18} color="var(--accent)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)' }}>SALE_RECORDED_SUCCESSFULLY</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>ITEM_SELECTION</label>
                  <input
                    list="items-list"
                    type="text"
                    value={formData.item_name}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    onInput={(e) => setFormData({ ...formData, item_name: e.currentTarget.value })}
                    className="input w-full"
                    placeholder="Search or select stock item..."
                    required
                  />
                  <datalist id="items-list">
                    {items.map((item) => (
                      <option key={item.id} value={item.name} />
                    ))}
                  </datalist>

                  {selectedItem && (
                    <div className="flex items-center gap-4 mt-2 p-3 bg-[var(--bg-3)] rounded-[var(--radius)] border border-[var(--border)]">
                      <div className="flex flex-col">
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>AVAILABLE_STOCK</span>
                        <span style={{ fontWeight: 700, color: selectedItem.current_stock <= selectedItem.low_stock_threshold ? 'var(--danger)' : 'var(--accent)' }}>
                          {selectedItem.current_stock} units
                        </span>
                      </div>
                      <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border)' }} />
                      <div className="flex flex-col">
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>UNIT_PRICE</span>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(selectedItem.unit_price)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>QUANTITY</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      className="input w-full text-center"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>SELLING_PRICE</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                      className="input w-full text-center"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-4 rounded-[var(--radius)] bg-[var(--bg-3)] border border-[var(--border)] border-dashed">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={payLater}
                        onChange={(e) => setPayLater(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)]"
                      />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>RECORD AS CREDIT SALE</span>
                    </label>
                    <CreditCard size={18} color={payLater ? "var(--accent)" : "var(--text-3)"} />
                  </div>

                  {payLater && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-2">
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-3)' }}>SELECT_CUSTOMER</label>
                        <select
                          className="input w-full"
                          value={selectedCustomerId || ''}
                          onChange={(e) => handleCustomerSelect(parseInt(e.target.value))}
                          required
                        >
                          <option value="">Choose Customer...</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                          ))}
                        </select>
                      </div>

                      {customerRisk && (
                        <div className={cn(
                          "p-3 rounded-[var(--radius)] border flex flex-col gap-2",
                          customerRisk.risk === 'HIGH' ? "bg-red-950/20 border-red-500/30" : "bg-blue-950/20 border-blue-500/30"
                        )}>
                          <div className="flex justify-between items-center">
                            <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>DEBT_STATUS: {customerRisk.risk}</span>
                            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{((customerRisk.current / customerRisk.limit) * 100).toFixed(0)}% LIMIT_USED</span>
                          </div>
                          <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full", customerRisk.risk === 'HIGH' ? "bg-[var(--danger)]" : "bg-[var(--accent)]")}
                              style={{ width: `${Math.min(100, (customerRisk.current / customerRisk.limit) * 100)}%` }}
                            />
                          </div>
                          {customerRisk.risk === 'HIGH' && (
                            <div className="flex items-center gap-2 text-[var(--danger)]">
                              <AlertCircle size={12} />
                              <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>CREDIT_LIMIT_NEARLY_EXCEEDED</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-[var(--radius)] bg-[var(--bg-3)] border border-[var(--accent)] border-dashed flex justify-between items-center group overflow-hidden relative">
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '100%', backgroundColor: 'var(--accent)', opacity: 0.05, transform: 'skewX(-20deg) translateX(20px)' }} />
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>TOTAL_AMOUNT</span>
                    <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                      {formatCurrency(formData.quantity * formData.selling_price)}
                    </p>
                  </div>
                  <ArrowRight size={32} className="opacity-20 group-hover:translate-x-1 transition-transform" />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full py-4 text-lg"
                >
                  {loading ? 'PROCESSING...' : 'COMPLETE SALE'}
                </button>
              </form>
            </div>

            <div className="card p-4 flex items-center gap-4 bg-[var(--bg-2)] opacity-60">
              <div style={{ padding: '0.5rem', backgroundColor: 'var(--bg-3)', borderRadius: '50%' }}>
                <AlertCircle size={16} color="var(--info)" />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
                Verified transactions are automatically logged to the daily ledger and inventory levels.
              </p>
            </div>
          </div>

          {/* Right Column: Recent Sales Activity */}
          <div className="lg:col-span-7 card flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <History size={20} color="var(--text-3)" />
                <h3 style={{ fontSize: '1.25rem' }}>Activity Feed</h3>
              </div>
              <span className="badge badge-accent">Live Updates</span>
            </div>

            {recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 opacity-30 gap-4">
                <ShoppingBag size={48} />
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>NO_RECENT_ACTIVITY</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>PRODUCT_IDENTITY</th>
                      <th className="text-center">QTY</th>
                      <th className="text-right">UNIT_VAL</th>
                      <th className="text-right">EXTENDED_VAL</th>
                      <th className="text-right">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td>
                          <span style={{ fontWeight: 700 }}>{sale.item_name}</span>
                        </td>
                        <td className="text-center">
                          <span className="mono">{sale.quantity}</span>
                        </td>
                        <td className="text-right">
                          <span className="mono">{formatCurrency(sale.selling_price)}</span>
                        </td>
                        <td className="text-right">
                          <span className="mono" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                            {formatCurrency(sale.quantity * sale.selling_price)}
                          </span>
                        </td>
                        <td className="text-right">
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                            {formatDateTime(sale.sale_date).split(', ')[1]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button className="btn btn-outline w-full mt-auto" style={{ marginTop: '2rem' }}>
              RECONCILE_AND_EXPORT
            </button>
          </div>
        </div>
      </main>

      {/* AI Ghost Assistant */}
      <div
        className={cn(
          "fixed bottom-8 right-8 z-[100] transition-all duration-500 transform",
          showGhost ? "translate-y-0 opacity-100 scale-100" : "translate-y-12 opacity-0 scale-90 pointer-events-none"
        )}
      >
        <div className="relative">
          {/* Glow Effect */}
          <div
            className={cn(
              "absolute inset-0 rounded-3xl blur-2xl opacity-20 animate-pulse",
              ghostType === 'margin' ? "bg-[var(--danger)]" : "bg-[var(--accent)]"
            )}
          />

          <div className="card p-5 w-72 relative bg-[var(--bg-2)] border-[var(--border)] shadow-2xl overflow-hidden">
            <button
              onClick={() => setShowGhost(false)}
              className="absolute top-2 right-2 p-1 hover:bg-[var(--bg-3)] rounded-full text-[var(--text-3)]"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  "p-2 rounded-full",
                  ghostType === 'margin' ? "bg-[rgba(255,59,92,0.1)]" : "bg-[var(--accent-dim)]"
                )}
              >
                {ghostType === 'margin' ? <Zap size={16} color="var(--danger)" /> : <Sparkles size={16} color="var(--accent)" />}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 800 }}>
                {ghostType === 'margin' ? 'MARGIN_OPTIMIZER' : 'UPSELL_GHOST_BOT'}
              </span>
            </div>

            {suggestions.map((sig, idx) => (
              <div key={idx} className="space-y-3">
                <p style={{ fontSize: '0.85rem', lineHeight: 1.4, fontWeight: 500 }}>
                  {sig.reason}
                </p>

                <button
                  onClick={() => handleItemSelect(sig.name)}
                  className={cn(
                    "w-full py-2 rounded-[var(--radius)] text-[0.7rem] font-bold transition-all",
                    ghostType === 'margin' ? "bg-[var(--danger)] hover:bg-[var(--danger)]/80 text-white" : "bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-black"
                  )}
                >
                  SWITCH_TO_{sig.name.toUpperCase()}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
