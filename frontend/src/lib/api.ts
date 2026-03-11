import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// ─── Auth ────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),

  me: () => api.get('/auth/me'),
};

// ─── Pages ───────────────────────────────
export const pagesApi = {
  list: () => api.get('/pages'),
  get: (id: string) => api.get(`/pages/${id}`),
  create: (data: { title?: string; parentId?: string }) =>
    api.post('/pages', data),
  update: (id: string, data: Partial<{ title: string; icon: string; tags: string[] }>) =>
    api.patch(`/pages/${id}`, data),
  delete: (id: string) => api.delete(`/pages/${id}`),
};

// ─── Search ──────────────────────────────
export const searchApi = {
  search: (q: string) =>
    api.get<{ id: string; type: 'page' | 'task'; title: string; subtitle?: string; url: string }[]>(`/search?q=${encodeURIComponent(q)}`),
};

// ─── Blocks ──────────────────────────────
export const blocksApi = {
  list: (pageId: string) => api.get(`/pages/${pageId}/blocks`),
  create: (pageId: string, data: { type: string; content: object; position: number }) =>
    api.post(`/pages/${pageId}/blocks`, data),
  update: (id: string, data: Partial<{ type: string; content: object; position: number }>) =>
    api.patch(`/blocks/${id}`, data),
  delete: (id: string) => api.delete(`/blocks/${id}`),
  reorder: (pageId: string, updates: { id: string; position: number }[]) =>
    api.patch(`/pages/${pageId}/blocks/reorder`, updates),
};

// ─── Habits ──────────────────────────────
export const habitsApi = {
  list: () => api.get('/habits'),
  create: (data: { name: string; description?: string; color?: string; icon?: string; frequency?: string }) =>
    api.post('/habits', data),
  update: (id: string, data: Partial<{ name: string; description: string; color: string; icon: string; frequency: string }>) =>
    api.patch(`/habits/${id}`, data),
  delete: (id: string) => api.delete(`/habits/${id}`),
  toggle: (id: string) => api.post(`/habits/${id}/toggle`),
};

// ─── Journal ─────────────────────────────
export const journalApi = {
  list: () => api.get('/journal'),
  byDate: (date: string) => api.get(`/journal/date/${date}`),
  upsert: (data: { date: string; title?: string; content?: string; mood?: string }) =>
    api.post('/journal', data),
  update: (id: string, data: Partial<{ title: string; content: string; mood: string }>) =>
    api.patch(`/journal/${id}`, data),
  delete: (id: string) => api.delete(`/journal/${id}`),
};

// ─── Users ───────────────────────────────
export const usersApi = {
  me: () => api.get('/users/me'),
  updateProfile: (data: { username?: string; email?: string; avatarUrl?: string }) =>
    api.patch('/users/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch('/users/me/password', { currentPassword, newPassword }),
  deleteAccount: () => api.delete('/users/me'),
};

// ─── AI ──────────────────────────────────
export const aiApi = {
  chat: (messages: { role: 'user' | 'model'; content: string }[]) =>
    api.post<{ reply: string }>('/ai/chat', { messages }),
  summarize: (content: string) =>
    api.post<{ summary: string }>('/ai/summarize', { content }),
  generateTasks: (description: string) =>
    api.post<{ tasks: string }>('/ai/generate-tasks', { description }),
  learningPlan: (topic: string, level?: string) =>
    api.post<{ plan: string }>('/ai/learning-plan', { topic, level }),
};

// ─── Learning ────────────────────────────
export const learningApi = {
  list: () => api.get('/learning'),
  create: (data: { name: string; description?: string; category?: string; progress?: number; status?: string; resources?: string; targetDate?: string }) =>
    api.post('/learning', data),
  update: (id: string, data: Partial<{ name: string; description: string; category: string; progress: number; status: string; resources: string; targetDate: string }>) =>
    api.patch(`/learning/${id}`, data),
  delete: (id: string) => api.delete(`/learning/${id}`),
};

// ─── Stocks ──────────────────────────────
export const stocksApi = {
  watchlist: () => api.get('/stocks/watchlist'),
  search: (q: string) => api.get(`/stocks/search?q=${encodeURIComponent(q)}`),
  quote: (symbol: string) => api.get(`/stocks/quote/${symbol}`),
  add: (symbol: string) => api.post('/stocks/watchlist', { symbol }),
  remove: (symbol: string) => api.delete(`/stocks/watchlist/${symbol}`),
};

// ─── GitHub ──────────────────────────────
export const githubApi = {
  profile: () => api.get('/github/profile'),
  repos: () => api.get('/github/repos'),
  activity: () => api.get('/github/activity'),
};

// ─── News ────────────────────────────────
export const newsApi = {
  techNews: () => api.get<NewsArticle[]>('/news/tech'),
};

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
}

// ─── Tasks ───────────────────────────────
export const tasksApi = {
  list: (params?: { status?: string; priority?: string }) =>
    api.get('/tasks', { params }),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: {
    title: string;
    priority?: string;
    dueDate?: string;
    description?: string;
  }) => api.post('/tasks', data),
  update: (id: string, data: Partial<{
    title: string;
    status: string;
    priority: string;
    dueDate: string;
    description: string;
  }>) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};
