import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me')
};

// Patrol APIs
export const patrolApi = {
  startShift: (data) => api.post('/patrol/start-shift', data),
  endShift: (shiftId, data) => api.put(`/patrol/end-shift/${shiftId}`, data),
  updateLiveLocation: (data) => api.put('/patrol/live-location', data),
  logCheckpoint: (data) => api.post('/patrol/log-checkpoint', data),
  getShift: (shiftId) => api.get(`/patrol/shift/${shiftId}`),
  getActiveShift: () => api.get('/patrol/active-shift'),
  getHistory: (limit) => api.get(`/patrol/history?limit=${limit || 10}`)
};

// Supervisor APIs
export const supervisorApi = {
  getLivePatrols: () => api.get('/supervisor/live-patrols'),
  getAlerts: () => api.get('/supervisor/alerts'),
  getAllShifts: (params) => api.get('/supervisor/shifts', { params }),
  getGuardsOnDuty: () => api.get('/supervisor/guards-on-duty'),
  getPatrolTimeline: (params) => api.get('/supervisor/patrol-timeline', { params })
};

// Site APIs
export const siteApi = {
  getAllSites: () => api.get('/sites'),
  getSiteById: (siteId) => api.get(`/sites/${siteId}`)
};

// Admin APIs (SUPERVISOR only)
export const adminApi = {
  // User management
  createUser: (data) => api.post('/admin/users', data),
  getAllUsers: () => api.get('/admin/users'),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // Site management
  createSite: (data) => api.post('/admin/sites', data),
  updateSite: (siteId, data) => api.put(`/admin/sites/${siteId}`, data),
  deleteSite: (siteId) => api.delete(`/admin/sites/${siteId}`),
  
  // Checkpoint management
  addCheckpoint: (siteId, data) => api.post(`/admin/sites/${siteId}/checkpoints`, data),
  deleteCheckpoint: (checkpointId) => api.delete(`/admin/checkpoints/${checkpointId}`),
  
  // QR Code generation
  getCheckpointQRCode: (checkpointId) => `${API_URL}/admin/checkpoints/${checkpointId}/qrcode`,
  getSiteQRCodes: (siteId) => api.get(`/admin/sites/${siteId}/qrcodes`)
};

export default api;
