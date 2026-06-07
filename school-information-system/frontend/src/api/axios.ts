import axios from 'axios';
import { tokenService } from '../utils/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = tokenService.getAccessToken();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
api.interceptors.request.use((config) => {
  const token = tokenService.getAccessToken();

  console.log('TOKEN:', token);
  console.log('URL:', config.url);

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('HEADERS AFTER:', config.headers);

  return config;
});
api.interceptors.request.use((config) => {
  const token = tokenService.getAccessToken();

  console.log('TOKEN:', token);
  console.log('REQUEST URL:', config.url);

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('HEADERS:', config.headers);

  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenService.removeAccessToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
