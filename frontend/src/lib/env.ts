const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Always fallback to live Render backend if on Vercel or production web domain
const defaultBaseUrl = isLocalhost
  ? 'http://localhost:5000'
  : 'https://hr-agent-backend-36sm.onrender.com';

const rawApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseUrl = (rawApiUrl && rawApiUrl.startsWith('http') && !rawApiUrl.includes('localhost'))
  ? rawApiUrl
  : (isLocalhost ? 'http://localhost:5000' : 'https://hr-agent-backend-36sm.onrender.com');

export const frontendEnv = {
  VITE_API_BASE_URL: apiBaseUrl,
  VITE_ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME || 'true',
};
