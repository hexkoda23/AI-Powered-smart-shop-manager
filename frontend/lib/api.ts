const isBrowser = typeof window !== 'undefined';
const storage = {
  read<T>(key: string, fallback: T): T {
    if (!isBrowser) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  write<T>(key: string, value: T) {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

export interface Item {
  id: number;
  name: string;
  current_stock: number;
  low_stock_threshold: number;
  unit_price: number;
  cost_price: number;
  created_at: string;
  updated_at?: string;
}

export interface Sale {
  id: number;
  item_id: number;
  item_name: string;
  quantity: number;
  selling_price: number;
  sale_date: string;
  created_at: string;
}

export interface DashboardStats {
  daily_profit: number;
  weekly_profit: number;
  monthly_profit: number;
  total_sales_today: number;
  total_sales_week: number;
  total_sales_month: number;
  low_stock_items: Item[];
  best_selling_items: { name: string; quantity: number }[];
  slow_moving_items: { name: string; quantity: number }[];
}

export interface AIChatResponse {
  response: string;
  insights?: string[];
  recommendations?: string[];
}

function nowISO() {
  return new Date().toISOString();
}

function parseDate(d: string) {
  return new Date(d);
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeProfit(sale: Sale, items: Item[]) {
  const item = items.find(i => i.id === sale.item_id || i.name === sale.item_name);
  const cost = item?.cost_price || 0;
  return (sale.selling_price - cost) * sale.quantity;
}

function nextItemId(items: Item[]) {
  return items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

function validateUniqueItemName(items: Item[], name: string) {
  if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
    throw { response: { data: { detail: 'Item with this name already exists' } } };
  }
}

function ensureItemExists(items: Item[], id: number) {
  const item = items.find(i => i.id === id);
  if (!item) {
    throw { response: { data: { detail: 'Item not found' } } };
  }
  return item;
}

function ensureStockAvailability(item: Item, quantity: number) {
  if (item.current_stock < quantity) {
    throw { response: { data: { detail: 'Not enough stock available' } } };
  }
}

export const itemsApi = {
  getAll: async (): Promise<Item[]> => {
    return storage.read<Item[]>('items', []);
  },
  getById: async (id: number): Promise<Item> => {
    const items = storage.read<Item[]>('items', []);
    const item = items.find(i => i.id === id);
    if (!item) throw { response: { data: { detail: 'Item not found' } } };
    return item;
  },
  create: async (partial: Partial<Item>): Promise<Item> => {
    const items = storage.read<Item[]>('items', []);
    const name = (partial.name || '').trim();
    if (!name) throw { response: { data: { detail: 'Item name is required' } } };
    validateUniqueItemName(items, name);
    const newItem: Item = {
      id: nextItemId(items),
      name,
      current_stock: partial.current_stock ?? 0,
      low_stock_threshold: partial.low_stock_threshold ?? 10,
      unit_price: partial.unit_price ?? 0,
      cost_price: partial.cost_price ?? 0,
      created_at: nowISO(),
      updated_at: undefined,
    };
    const updated = [...items, newItem];
    storage.write('items', updated);
    return newItem;
  },
  update: async (id: number, partial: Partial<Item>): Promise<Item> => {
    const items = storage.read<Item[]>('items', []);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw { response: { data: { detail: 'Item not found' } } };
    const current = items[idx];
    const updatedItem: Item = {
      ...current,
      name: partial.name ?? current.name,
      current_stock: partial.current_stock ?? current.current_stock,
      low_stock_threshold: partial.low_stock_threshold ?? current.low_stock_threshold,
      unit_price: partial.unit_price ?? current.unit_price,
      cost_price: partial.cost_price ?? current.cost_price,
      updated_at: nowISO(),
    };
    const updated = [...items];
    updated[idx] = updatedItem;
    storage.write('items', updated);
    return updatedItem;
  },
  delete: async (id: number): Promise<void> => {
    const items = storage.read<Item[]>('items', []);
    ensureItemExists(items, id);
    const remainingItems = items.filter(i => i.id !== id);
    const sales = storage.read<Sale[]>('sales', []);
    const remainingSales = sales.filter(s => s.item_id !== id);
    storage.write('items', remainingItems);
    storage.write('sales', remainingSales);
  },
};

export const salesApi = {
  getAll: async (params?: { start_date?: string; end_date?: string; limit?: number }): Promise<Sale[]> => {
    let sales = storage.read<Sale[]>('sales', []);
    if (params?.start_date) {
      const start = parseDate(params.start_date);
      sales = sales.filter(s => parseDate(s.sale_date) >= start);
    }
    if (params?.end_date) {
      const end = parseDate(params.end_date);
      sales = sales.filter(s => parseDate(s.sale_date) <= end);
    }
    sales = sales.sort((a, b) => parseDate(b.sale_date).getTime() - parseDate(a.sale_date).getTime());
    if (params?.limit && params.limit > 0) {
      sales = sales.slice(0, params.limit);
    }
    return sales;
  },
  create: async (sale: { item_name: string; quantity: number; selling_price: number; sale_date?: string }): Promise<Sale> => {
    const items = storage.read<Item[]>('items', []);
    const matched = items.find(i => i.name.toLowerCase() === sale.item_name.toLowerCase());
    if (!matched) {
      throw { response: { data: { detail: 'Item not found. Please add it in Stock.' } } };
    }
    ensureStockAvailability(matched, sale.quantity);
    const sales = storage.read<Sale[]>('sales', []);
    const newSale: Sale = {
      id: sales.length ? Math.max(...sales.map(s => s.id)) + 1 : 1,
      item_id: matched.id,
      item_name: matched.name,
      quantity: sale.quantity,
      selling_price: sale.selling_price,
      sale_date: sale.sale_date ?? nowISO(),
      created_at: nowISO(),
    };
    const updatedSales = [newSale, ...sales];
    const updatedItems = items.map(i =>
      i.id === matched.id ? { ...i, current_stock: i.current_stock - sale.quantity, updated_at: nowISO() } : i
    );
    storage.write('sales', updatedSales);
    storage.write('items', updatedItems);
    return newSale;
  },
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const items = storage.read<Item[]>('items', []);
    const sales = storage.read<Sale[]>('sales', []);
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const todaySales = sales.filter(s => parseDate(s.sale_date) >= todayStart);
    const weekSales = sales.filter(s => parseDate(s.sale_date) >= weekStart);
    const monthSales = sales.filter(s => parseDate(s.sale_date) >= monthStart);
    const daily_profit = todaySales.reduce((sum, s) => sum + computeProfit(s, items), 0);
    const weekly_profit = weekSales.reduce((sum, s) => sum + computeProfit(s, items), 0);
    const monthly_profit = monthSales.reduce((sum, s) => sum + computeProfit(s, items), 0);
    const total_sales_today = todaySales.reduce((sum, s) => sum + s.quantity, 0);
    const total_sales_week = weekSales.reduce((sum, s) => sum + s.quantity, 0);
    const total_sales_month = monthSales.reduce((sum, s) => sum + s.quantity, 0);
    const low_stock_items = items.filter(i => i.current_stock <= i.low_stock_threshold);
    const qtyByItem: Record<string, number> = {};
    monthSales.forEach(s => {
      qtyByItem[s.item_name] = (qtyByItem[s.item_name] || 0) + s.quantity;
    });
    const best_selling_items = Object.entries(qtyByItem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));
    const allNames = Array.from(new Set(items.map(i => i.name)));
    const slowData = allNames.map(name => ({ name, quantity: qtyByItem[name] || 0 }));
    const slow_moving_items = slowData
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
    return {
      daily_profit,
      weekly_profit,
      monthly_profit,
      total_sales_today,
      total_sales_week,
      total_sales_month,
      low_stock_items,
      best_selling_items,
      slow_moving_items,
    };
  },
};

export const aiApi = {
  chat: async (message: string): Promise<AIChatResponse> => {
    const items = storage.read<Item[]>('items', []);
    const sales = storage.read<Sale[]>('sales', []);
    const monthStart = startOfMonth(new Date());
    const monthSales = sales.filter(s => parseDate(s.sale_date) >= monthStart);
    const qtyByItem: Record<string, number> = {};
    monthSales.forEach(s => {
      qtyByItem[s.item_name] = (qtyByItem[s.item_name] || 0) + s.quantity;
    });
    const insights: string[] = [];
    const recommendations: string[] = [];
    const lowStock = items.filter(i => i.current_stock <= i.low_stock_threshold);
    if (lowStock.length) {
      lowStock.forEach(i => recommendations.push(`Restock ${i.name}: ${i.current_stock} left (threshold ${i.low_stock_threshold})`));
    }
    const best = Object.entries(qtyByItem).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (best.length) {
      insights.push(`Top sellers this month: ${best.map(([n, q]) => `${n} (${q})`).join(', ')}`);
    }
    const totalProfit = monthSales.reduce((sum, s) => sum + computeProfit(s, items), 0);
    insights.push(`Estimated profit this month: ₦${totalProfit.toFixed(2)}`);
    let response = "Here are your shop insights.";
    const q = message.toLowerCase();
    if (q.includes('restock')) {
      response = recommendations.length ? "You should restock these items soon." : "No items need restocking right now.";
    } else if (q.includes('sell') || q.includes('best')) {
      response = best.length ? "These are your best selling items." : "No sales recorded yet for this month.";
    } else if (q.includes('profit')) {
      response = `Your estimated profit this month is ₦${totalProfit.toFixed(2)}.`;
    } else if (q.includes('slow')) {
      const slow = items
        .map(i => ({ name: i.name, quantity: qtyByItem[i.name] || 0 }))
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 3);
      response = slow.length ? `Slow moving items: ${slow.map(s => `${s.name} (${s.quantity})`).join(', ')}` : "No slow moving items detected.";
    } else {
      response = "I analyzed your data and prepared insights and recommendations.";
    }
    return { response, insights, recommendations };
  },
  getRestockRecommendations: async (): Promise<{ recommendations: string[] }> => {
    const items = storage.read<Item[]>('items', []);
    const recs = items
      .filter(i => i.current_stock <= i.low_stock_threshold)
      .map(i => `Restock ${i.name}: ${i.current_stock} left (threshold ${i.low_stock_threshold})`);
    return { recommendations: recs };
  },
  getTrends: async (): Promise<any> => {
    const sales = storage.read<Sale[]>('sales', []);
    const byDay: Record<string, number> = {};
    sales.forEach(s => {
      const d = parseDate(s.sale_date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      byDay[key] = (byDay[key] || 0) + s.quantity;
    });
    return { daily: byDay };
  },
};
