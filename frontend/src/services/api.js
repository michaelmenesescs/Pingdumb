import axios from 'axios';

// Use empty base URL to let the proxy handle routing
const API_BASE_URL = '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sites API
export const sitesAPI = {
  getAll: () => api.get('/api/sites'),
  getById: (id) => api.get(`/api/sites/${id}`),
  create: async (siteData) => {
    console.log('API: Creating site with data:', siteData);
    const response = await api.post('/api/sites', siteData);
    console.log('API: Create response:', response);
    return response;
  },
  update: async (id, siteData) => {
    console.log('API: Updating site', id, 'with data:', siteData);
    const response = await api.put(`/api/sites/${id}`, siteData);
    console.log('API: Update response:', response);
    return response;
  },
  delete: (id) => api.delete(`/api/sites/${id}`),
  getUptimePercentage: (id) => api.get(`/api/sites/uptime-percentage/${id}`),
  stopAll: () => api.post('/api/sites/stop-all'),
  startAll: () => api.post('/api/sites/start-all'),
};

// Checks API
export const checksAPI = {
  getAll: (params) => api.get('/api/checks', { params }),
  getStats: (siteId, days = 7) => api.get(`/api/checks/stats/${siteId}`, { params: { days } }),
  getRecent: (siteId, limit = 10) => api.get(`/api/checks/recent/${siteId}`, { params: { limit } }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
