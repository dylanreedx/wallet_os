// API base URL:
// - In production, default to the deployed backend if VITE_API_URL isn't set
// - In development, default to '' so we can rely on Vite's dev proxy (or localhost config)
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '' : 'https://wallet-os-backend.vercel.app');

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const sessionId = localStorage.getItem('sessionId');

  const headers: Record<string, string> = {
    ...(sessionId && { 'x-session-id': sessionId }),
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type if there's a body
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// Auth
export const auth = {
  login: async (email: string, name?: string) => {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
    // Session is NOT set here for magic links
    return data;
  },
  verifyCode: async (email: string, code: string) => {
    const data = await fetchWithAuth('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    if (data.sessionId) {
      localStorage.setItem('sessionId', data.sessionId);
    }
    return data;
  },
  verify: async (token: string) => {
    const data = await fetchWithAuth(`/api/auth/verify?token=${token}`);
    if (data.sessionId) {
      localStorage.setItem('sessionId', data.sessionId);
    }
    return data;
  },
  logout: async () => {
    await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('sessionId');
  },
  getIncome: async (userId: number) => {
    return fetchWithAuth(`/api/auth/income?userId=${userId}`);
  },
  updateIncome: async (userId: number, monthlyIncome: number) => {
    return fetchWithAuth('/api/auth/income', {
      method: 'PUT',
      body: JSON.stringify({ userId, monthlyIncome }),
    });
  },
};

// Expenses
export const expenses = {
  getAll: (userId: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchWithAuth(`/api/expenses?${params}`);
  },
  get: (id: number) => fetchWithAuth(`/api/expenses/${id}`),
  create: (data: {
    userId: number;
    amount: number;
    description: string;
    category?: string;
    date: string;
    goalId?: number;
    goalItemId?: number;
    visibility?: 'private' | 'friends' | 'public';
  }) =>
    fetchWithAuth('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: number,
    data: {
      amount?: number;
      description?: string;
      category?: string;
      date?: string;
      goalId?: number | null;
      goalItemId?: number | null;
      visibility?: 'private' | 'friends' | 'public';
    }
  ) =>
    fetchWithAuth(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchWithAuth(`/api/expenses/${id}`, {
      method: 'DELETE',
    }),
};

// Goals
export const goals = {
  getAll: (userId: number) => {
    return fetchWithAuth(`/api/goals?userId=${userId}`);
  },
  get: (id: number) => fetchWithAuth(`/api/goals/${id}`),
  create: (data: {
    userId: number;
    name: string;
    targetAmount: number;
    deadline: string;
    targetMonth?: string;
    description?: string;
  }) =>
    fetchWithAuth('/api/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: number,
    data: {
      name?: string;
      targetAmount?: number;
      currentAmount?: number;
      deadline?: string;
      targetMonth?: string;
      description?: string;
    }
  ) =>
    fetchWithAuth(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchWithAuth(`/api/goals/${id}`, {
      method: 'DELETE',
    }),
};

// Goal Items
export const goalItems = {
  getAll: (goalId: number) => fetchWithAuth(`/api/goals/${goalId}/items`),
  get: (goalId: number, itemId: number) =>
    fetchWithAuth(`/api/goals/${goalId}/items/${itemId}`),
  create: (
    goalId: number,
    data: {
      name: string;
      price: number;
      quantity?: number;
    }
  ) =>
    fetchWithAuth(`/api/goals/${goalId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    goalId: number,
    itemId: number,
    data: {
      name?: string;
      price?: number;
      quantity?: number;
      purchased?: boolean;
    }
  ) =>
    fetchWithAuth(`/api/goals/${goalId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (goalId: number, itemId: number) =>
    fetchWithAuth(`/api/goals/${goalId}/items/${itemId}`, {
      method: 'DELETE',
    }),
};

// Budget
export const budget = {
  analyze: (userId: number, month?: string) =>
    fetchWithAuth('/api/budget/analyze', {
      method: 'POST',
      body: JSON.stringify({ userId, month }),
    }),
  getSuggestions: (userId: number, month?: string) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (month) params.append('month', month);
    return fetchWithAuth(`/api/budget/suggestions?${params}`);
  },
};

// Monthly Expenses
export const monthlyExpenses = {
  getAll: (userId: number, includeInactive?: boolean) => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (includeInactive) params.append('includeInactive', 'true');
    return fetchWithAuth(`/api/monthly-expenses?${params}`);
  },
  create: (data: {
    userId: number;
    name: string;
    amount: number;
    category?: string;
    description?: string;
    isActive?: boolean;
  }) =>
    fetchWithAuth('/api/monthly-expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (
    id: number,
    data: {
      name?: string;
      amount?: number;
      category?: string;
      description?: string;
      isActive?: boolean;
    }
  ) =>
    fetchWithAuth(`/api/monthly-expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Social
export const social = {
  shareGoal: (
    goalId: number,
    userId: number,
    role?: 'viewer' | 'contributor' | 'owner'
  ) =>
    fetchWithAuth('/api/social/goals/share', {
      method: 'POST',
      body: JSON.stringify({ goalId, userId, role }),
    }),
  getSharedGoals: (userId: number) => {
    return fetchWithAuth(`/api/social/goals?userId=${userId}`);
  },
  getGoalUsers: (goalId: number) =>
    fetchWithAuth(`/api/social/goals/${goalId}/users`),
  updateRole: (
    goalId: number,
    userId: number,
    role: 'viewer' | 'contributor' | 'owner'
  ) =>
    fetchWithAuth(`/api/social/goals/${goalId}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  unshareGoal: (goalId: number, userId: number) =>
    fetchWithAuth(`/api/social/goals/${goalId}/users/${userId}`, {
      method: 'DELETE',
    }),
  inviteFriend: (email: string) =>
    fetchWithAuth('/api/social/friends/invite', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  getFriends: (userId: number) =>
    fetchWithAuth(`/api/social/friends?userId=${userId}`),
  acceptFriend: (friendId: number) =>
    fetchWithAuth('/api/social/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    }),
};

export const notifications = {
  getAll: () => fetchWithAuth('/api/notifications'),
  markRead: (id: number) =>
    fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () =>
    fetchWithAuth('/api/notifications/read-all', { method: 'PUT' }),
};

export const goalChats = {
  getMessages: (goalId: number) => fetchWithAuth(`/api/goals/${goalId}/chat`),
  sendMessage: (goalId: number, message: string) =>
    fetchWithAuth(`/api/goals/${goalId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint),
  post: (endpoint: string, data: any) =>
    fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  put: (endpoint: string, data: any) =>
    fetchWithAuth(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (endpoint: string) =>
    fetchWithAuth(endpoint, {
      method: 'DELETE',
    }),
};
