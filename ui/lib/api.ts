import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Request interceptor - automatically add JWT token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, config.data);
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        console.error('[API REQUEST ERROR]', error);
        return Promise.reject(error);
    }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
    (response) => {
        console.log(`[API RESPONSE] ${response.status} ${response.config.url}`, response.data);
        return response;
    },
    (error: AxiosError) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.response?.status === 401) {
            // Don't redirect if it's a login attempt (allow UI to show error)
            if (error.config?.url?.includes('/auth/login')) {
                return Promise.reject(error);
            }

            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            console.error('Access forbidden');
        }

        return Promise.reject(error);
    }
);

export default api;

// Type definitions for common API responses
export interface ApiResponse<T = any> {
    status: 'success' | 'fail' | 'error';
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
    };
}
