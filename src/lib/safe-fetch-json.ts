/**
 * Safe fetch that parses JSON only when the response is actually JSON.
 * When the server returns HTML (e.g. SPA index.html when API is down or proxy misconfigured),
 * avoids "Unexpected token '<'" and throws a clear error instead.
 * In production, relative URLs (/api/...) are prefixed with VITE_API_URL when set.
 */

import { apiUrl, getApiBaseUrl } from './api-base';

function getApiUnavailableMessage(): string {
  if (import.meta.env.PROD && !getApiBaseUrl()) {
    return "Le service de données est temporairement indisponible. Réessayez plus tard.";
  }
  return "Le serveur API ne répond pas ou renvoie une page HTML. En local, lancez le backend (npm run api:server) sur le port 3001.";
}

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
    const apiMsg = getApiUnavailableMessage();
    const msg = res.ok
      ? apiMsg
      : `Erreur ${res.status}: ${res.statusText}. ${text.trimStart().startsWith("<") ? apiMsg : ""}`.trim();
    throw new Error(msg);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(getApiUnavailableMessage());
  }
}
