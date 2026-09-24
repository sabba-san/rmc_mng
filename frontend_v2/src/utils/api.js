/**
 * API client — centralises all HTTP communication with the Flask backend.
 * Tokens stored in memory only (NOT localStorage) to prevent XSS theft.
 * Uses HttpOnly cookie approach for auth cookies via credentials: 'include'.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// In-memory token store — never written to localStorage or sessionStorage
let _accessToken = null;

export const setToken = (token) => { _accessToken = token; };
export const clearToken = () => { _accessToken = null; };
export const getToken = () => _accessToken;

// Attach JWT Bearer on every request
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// Generic error handler — never expose raw server errors to console in prod
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || 'An unexpected error occurred.';
    return Promise.reject(new Error(msg));
  }
);

// ── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
};

// ── Grants ───────────────────────────────────────────────────
export const grantsAPI = {
  list: (params) => api.get('/grants/', { params }),
  get: (id) => api.get(`/grants/${id}`),
  create: (data) => api.post('/grants/', data),
  update: (id, data) => api.put(`/grants/${id}`, data),
  submit: (id) => api.post(`/grants/${id}/submit`),
};

// ── Milestones ────────────────────────────────────────────────
export const milestonesAPI = {
  listByGrant: (grantId) => api.get(`/milestones/grant/${grantId}`),
  create: (data) => api.post('/milestones/', data),
  update: (id, data) => api.put(`/milestones/${id}`, data),
  delete: (id) => api.delete(`/milestones/${id}`),
};

// ── Research Outputs ──────────────────────────────────────────
export const outputsAPI = {
  list: (params) => api.get('/outputs/', { params }),
  create: (data) => api.post('/outputs/', data),
  update: (id, data) => api.put(`/outputs/${id}`, data),
  delete: (id) => api.delete(`/outputs/${id}`),
};

// ── Documents ────────────────────────────────────────────────
export const documentsAPI = {
  listByGrant: (grantId) => api.get(`/documents/grant/${grantId}`),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  download: (docId) => api.get(`/documents/download/${docId}`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/documents/${id}`),
};

export default api;
