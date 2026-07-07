import axios from 'axios';
import { getCookie, deleteCookie } from 'cookies-next';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from cookies
    const token = getCookie('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error status codes
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear auth cookie and redirect to login
          deleteCookie('token');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden
          console.warn('Access forbidden');
          break;
        case 404:
          console.warn('Resource not found');
          break;
        case 500:
          console.warn('Internal server error');
          break;
        default:
          console.warn('An error occurred:', error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.warn('No response from server');
    } else {
      // Something else happened
      console.warn('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
