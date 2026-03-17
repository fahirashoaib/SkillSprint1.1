import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/users/login', { email, password }),
  register: (username, email, password) => api.post('/users/register', { username, email, password }),
};

export const courseAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
};

export const userAPI = {
  getProfile: (id) => api.get(`/users/${id}`),
  getAll: () => api.get('/users'), // Admin only
};

export const progressAPI = {
  update: (userId, data) => api.post(`/progress/${userId}`, data),
  completeCourse: (userId, courseId) => api.post(`/progress/${userId}/complete-course`, { courseId }),
};

// Admin APIs
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (limit = 10) => api.get(`/admin/users?limit=${limit}`),
  getCourses: () => api.get('/admin/courses'),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
};

// Add AI Generation APIs
export const aiAPI = {
  getDrafts: () => api.get('/ai/drafts').catch(error => {
    // If 404, return empty array (endpoint not implemented yet)
    if (error.response?.status === 404) {
      return { data: [] };
    }
    throw error;
  }),
  getDraft: (courseId) => api.get(`/ai/drafts/${courseId}`),
  updateDraft: (courseId, data) => api.put(`/ai/drafts/${courseId}`, data),
  publishDraft: (courseId) => api.post(`/ai/publish/${courseId}`),
  deleteDraft: (courseId) => api.delete(`/ai/drafts/${courseId}`)
};

// Document Upload APIs
export const documentAPI = {
  upload: (formData) => api.post('/upload/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/upload/documents'),
  process: (id) => api.post(`/upload/document/${id}/process`)
};


export default api;