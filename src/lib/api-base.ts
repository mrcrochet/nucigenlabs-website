/**
 * API base URL for frontend requests.
 * - Dev: '' (relative, Vite proxy forwards /api to localhost:3001).
 * - Prod: set VITE_API_URL in Vercel (e.g. https://your-api.railway.app) so /api calls hit the deployed backend.
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? '';
}

/** Full URL for an API path (e.g. '/api/corporate-impact/signals' -> 'https://api.example.com/api/...' or '/api/...'). */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base.replace(/\/$/, '')}${p}` : p;
}
