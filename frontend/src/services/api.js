import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject stored token if present in localStorage as fallback
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('vault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default API;
