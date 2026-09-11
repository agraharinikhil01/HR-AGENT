import axios from 'axios';
import { tokenStore } from '../../auth/tokenStore.js';
import { refreshClient } from './refreshClient.js';
import { frontendEnv } from '../env.js';

export const client = axios.create({
  baseURL: `${frontendEnv.VITE_API_BASE_URL}/api/v1`,
  withCredentials: true,
  timeout: 60000,
});

// Request interceptor: attach bearer token from memory
client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh on 401 TOKEN_EXPIRED
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Auto-retry on cold-start (Render waking up from sleep)
    const isNetworkOrTimeout =
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      [502, 503, 504].includes(error.response?.status);

    if (isNetworkOrTimeout && original && !original._hasRetriedColdStart) {
      original._hasRetriedColdStart = true;
      // Wait 2.5 seconds for Render container to initialize and retry
      await new Promise((r) => setTimeout(r, 2500));
      return client(original);
    }

    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }

      isRefreshing = true;
      try {
        const { data } = await refreshClient.post('/auth/refresh');
        const newToken = data.data.accessToken;
        tokenStore.set(newToken);

        refreshQueue.forEach((p) => p.resolve(newToken));
        refreshQueue = [];

        original.headers.Authorization = `Bearer ${newToken}`;
        return client(original);
      } catch (refreshErr) {
        refreshQueue.forEach((p) => p.reject(refreshErr));
        refreshQueue = [];
        tokenStore.clear();
        // Redirect to login only if not already on public/auth routes
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/careers') && !window.location.pathname.includes('/offers/view')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
