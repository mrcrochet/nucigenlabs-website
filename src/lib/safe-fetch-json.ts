/**
 * Safe fetch that parses JSON only when the response is actually JSON.
 * When the server returns HTML (e.g. SPA index.html when API is down or proxy misconfigured),
 * avoids "Unexpected token '<'" and throws a clear error instead.
 * In production, relative URLs (/api/...) are prefixed with VITE_API_URL when set.
 */

import { apiUrl } from './api-base';

const API_UNAVAILABLE =
  "Le serveur API ne répond pas ou renvoie une page HTML. En local, lancez le backend (npm run api:server) sur le port 3001.";

export async function safeFetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const url =
    typeof input === 'string' && input.startsWith('/')
      ? apiUrl(input)
      : input;
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!contentType.includes("application/json") || text.trimStart().startsWith("<")) {
    const msg = res.ok
      ? API_UNAVAILABLE
      : `Erreur ${res.status}: ${res.statusText}. ${text.trimStart().startsWith("<") ? API_UNAVAILABLE : ""}`.trim();
    throw new Error(msg);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(API_UNAVAILABLE);
  }
}
