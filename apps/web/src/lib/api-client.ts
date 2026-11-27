import axios from 'axios';

/**
 * Shared Axios instance for BuildERP web app.
 *
 * Base URL is read from the Vite env variable VITE_API_URL.
 * Automatically attaches the Authorization header when a JWT access
 * token is present in localStorage.
 */
const BASE_URL = (import.meta as ImportMeta & { env: Record<string, string> }).env[
  'VITE_API_URL'
] ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30_000,
});

// ── Request interceptor — attach JWT ──────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('builderp_access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Forward tenant slug from localStorage if present
  const tenantSlug = localStorage.getItem('builderp_tenant');
  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug;
  }

  return config;
});

// ── Response interceptor — unwrap envelope / handle 401 ───────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Clear stale tokens and redirect to login
      localStorage.removeItem('builderp_access');
      localStorage.removeItem('builderp_refresh');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
