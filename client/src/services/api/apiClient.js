import axios from 'axios';
import { tokenService } from './tokenService';

const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/+$/, '');

const apiClient = axios.create({
  baseURL: backendUrl || '/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request Interceptor: Automatically inject Authorization token
apiClient.interceptors.request.use(
  (config) => {
    // Determine which token to use based on URL path to prevent token pollution
    const url = config.url || '';
    const isAdminRoute = url.startsWith('/api/admin/') || url.includes('/admin');
    
    const token = isAdminRoute ? tokenService.getAdminToken() : tokenService.getUserToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error logging and token invalidation
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    
    if (status === 401) {
      // Clear only the expired role token based on URL
      const url = error.config?.url || '';
      const isAdminRoute = url.startsWith('/api/admin/') || url.includes('/admin');
      
      if (isAdminRoute) {
        tokenService.removeAdminToken();
        window.dispatchEvent(new Event('admin-session-expired'));
      } else {
        tokenService.removeUserToken();
        window.dispatchEvent(new Event('user-session-expired'));
      }
    }
    
    // Normalize error shape
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred.',
      status,
      response: error.response,
      originalError: error
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
