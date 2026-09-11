import axios from 'axios';
import { frontendEnv } from '../env.js';

// Dedicated instance without interceptors to prevent infinite refresh recursion
export const refreshClient = axios.create({
  baseURL: `${frontendEnv.VITE_API_BASE_URL}/api/v1`,
  withCredentials: true,
  timeout: 45000,
});
