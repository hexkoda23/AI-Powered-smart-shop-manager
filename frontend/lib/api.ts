const isBrowser = typeof window !== 'undefined';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function getShopId(): string | null {
  if (!isBrowser) return null;
  return window.localStorage.getItem('notable_shop_id');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const shopId = getShopId();
  const headers = {
    'Content-Type': 'application/json',
    ...(shopId ? { 'X-Shop-Id': shopId } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw { response: { data: errorData } };
  }

  return response.json();
}

export interface Item {
  id: number;
  shop_id: number;
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
  shop_id: number;
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

export interface Customer {
  id: number;
  shop_id: number;
  name: string;
  phone?: string;
  address?: string;
  credit_limit: number;
  total_debt: number;
  created_at: string;
}

export interface DebtRecord {
  id: number;
  customer_id: number;
  amount: number;
  type: string;
  date: string;
  notes?: string;
}

export interface Shop {
  id: number;
  name: string;
  created_at: string;
}

export const authApi = {
  register: async (name: string, pin: string): Promise<Shop> => {
    return request<Shop>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, pin }),
    });
  },
  login: async (name: string, pin: string): Promise<Shop> => {
    return request<Shop>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ name, pin }),
    });
  },
  updateSettings: async (data: { name?: string; pin?: string }): Promise<Shop> => {
    return request<Shop>('/api/shops/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
};

export const itemsApi = {
  getAll: async (): Promise<Item[]> => {
    return request<Item[]>('/api/items');
  },
  getById: async (id: number): Promise<Item> => {
    return request<Item>(`/api/items/${id}`);
  },
  create: async (item: Partial<Item>): Promise<Item> => {
    const shopId = getShopId();
    return request<Item>('/api/items', {
      method: 'POST',
      body: JSON.stringify({ ...item, shop_id: shopId ? parseInt(shopId) : 0 }),
    });
  },
  update: async (id: number, item: Partial<Item>): Promise<Item> => {
    return request<Item>(`/api/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },
  delete: async (id: number): Promise<void> => {
    return request<void>(`/api/items/${id}`, {
      method: 'DELETE',
    });
  },
};

export const salesApi = {
  getAll: async (params?: { start_date?: string; end_date?: string; limit?: number }): Promise<Sale[]> => {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.limit) query.append('limit', params.limit.toString());
    return request<Sale[]>(`/api/sales?${query.toString()}`);
  },
  create: async (sale: { item_name: string; quantity: number; selling_price: number; sale_date?: string }): Promise<Sale> => {
    const shopId = getShopId();
    return request<Sale>('/api/sales', {
      method: 'POST',
      body: JSON.stringify({ ...sale, shop_id: shopId ? parseInt(shopId) : 0 }),
    });
  },
};

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    return request<Customer[]>('/api/customers');
  },
  create: async (customer: Partial<Customer>): Promise<Customer> => {
    const shopId = getShopId();
    return request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify({ ...customer, shop_id: shopId ? parseInt(shopId) : 0 }),
    });
  },
};

export const debtApi = {
  getRecords: async (customerId: number): Promise<DebtRecord[]> => {
    return request<DebtRecord[]>(`/api/debt/records/${customerId}`);
  },
  createRecord: async (record: { customer_id: number; amount: number; type: string; notes?: string }): Promise<DebtRecord> => {
    return request<DebtRecord>('/api/debt/records', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }
};

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    return request<DashboardStats>('/api/dashboard/stats');
  },
};

export const aiApi = {
  chat: async (message: string): Promise<AIChatResponse> => {
    const shopId = getShopId();
    return request<AIChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, shop_id: shopId ? parseInt(shopId) : 0 }),
    });
  },
  getRestockRecommendations: async (): Promise<{ recommendations: string[] }> => {
    return request<{ recommendations: string[] }>('/api/ai/restock-recommendations');
  },
  getTrends: async (): Promise<any> => {
    return request<any>('/api/ai/trends');
  },
};
