import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';

// ── Token Storage ───────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// ── Axios Instance ───────────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

export function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor - add auth token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenStorage.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );

  // Response interceptor - handle token refresh
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // If error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Wait for the refresh to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(instance(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = tokenStorage.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(
            `${API_URL}/api/auth/refresh`,
            {},
            {
              withCredentials: true,
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          tokenStorage.setTokens(accessToken, newRefreshToken);

          onTokenRefreshed(accessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear tokens and redirect to login
          tokenStorage.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

// Export singleton instance
export const api = createAxiosInstance();
