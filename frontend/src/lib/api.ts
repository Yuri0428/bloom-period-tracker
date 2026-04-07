const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────
  signup: (name: string, email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<{ user: any }>('/auth/me'),

  updateMe: (updates: { name?: string; cycleLength?: number; periodLength?: number }) =>
    request<{ user: any }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // ── Cycles / Entries ──────────────────────────────────
  getEntries: () =>
    request<{ cycles: any[] }>('/cycles?limit=200'),

  getCalendarEntries: (from: string, to: string) =>
    request<{ cycles: any[] }>(`/cycles/calendar?from=${from}&to=${to}`),

  getPredictions: () =>
    request<{ predictions: any }>('/cycles/predictions'),

  getStats: () =>
    request<{ stats: any }>('/cycles/stats'),

  createCycle: (startDate: string, notes?: string) =>
    request<{ cycle: any }>('/cycles', {
      method: 'POST',
      body: JSON.stringify({ startDate, notes }),
    }),

  updateCycle: (id: string, updates: any) =>
    request<{ cycle: any }>(`/cycles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteCycle: (id: string) =>
    request(`/cycles/${id}`, { method: 'DELETE' }),

  saveLog: (cycleId: string, log: any) =>
    request<{ cycle: any }>(`/cycles/${cycleId}/logs`, {
      method: 'POST',
      body: JSON.stringify(log),
    }),

  deleteLog: (cycleId: string, date: string) =>
    request(`/cycles/${cycleId}/logs/${date}`, { method: 'DELETE' }),
};

export default api;