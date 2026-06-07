import axios from 'axios';
import { tokenService } from './tokenService';

const apiClient = axios.create({
  baseURL: '/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request Interceptor: Automatically inject Authorization token
apiClient.interceptors.request.use(
  (config) => {
    // Check for admin token first, then user token
    const token = tokenService.getAdminToken() || tokenService.getUserToken();
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
      // Unauthorized: Clear compromised tokens
      tokenService.clearAllTokens();
      // Dispatch global event so App.jsx or AuthContext can react and redirect
      window.dispatchEvent(new Event('auth-session-expired'));
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
