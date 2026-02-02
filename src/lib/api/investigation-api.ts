/**
 * API client — Nucigen Intelligence Detective (Investigation Threads)
 * Conception: CONCEPTION_INTELLIGENCE_DETECTIVE.md
 *
 * Backend routes to implement: POST/GET /api/investigations, GET/POST messages, GET signals, PATCH thread
 */

import type {
  InvestigationThread,
  InvestigationSignal,
  InvestigationMessage,
  CreateThreadPayload,
  SendMessagePayload,
} from '../../types/investigation';

const API_BASE = import.meta.env.DEV ? '/api' : '/api';

export interface InvestigationApiOptions {
  /** Clerk user ID — requis pour que le backend identifie l'utilisateur (header x-clerk-user-id) */
  clerkUserId?: string | null;
}

function buildHeaders(options?: InvestigationApiOptions): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options?.clerkUserId) {
    headers['x-clerk-user-id'] = options.clerkUserId;
  }
  return headers;
}

async function fetchJson<T>(url: string, options?: RequestInit & { headers?: Record<string, string> }): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || 'Request failed');
  }
  return res.json();
}

/** Créer une piste d'enquête */
export async function createThread(
  payload: CreateThreadPayload,
  apiOptions?: InvestigationApiOptions
): Promise<{ success: boolean; thread?: InvestigationThread; error?: string }> {
  try {
    const data = await fetchJson<{ success: boolean; thread: InvestigationThread }>(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: buildHeaders(apiOptions),
      body: JSON.stringify(payload),
    });
    return { success: true, thread: data.thread };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/** Liste des pistes de l'utilisateur */
export async function getThreads(apiOptions?: InvestigationApiOptions): Promise<{
  success: boolean;
  threads?: InvestigationThread[];
  error?: string;
}> {
  try {
    const data = await fetchJson<{ success: boolean; threads: InvestigationThread[] }>(`${API_BASE}/investigations`, {
      headers: buildHeaders(apiOptions),
    });
    return { success: true, threads: data.threads };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/** Détail d'une piste (thread + messages + signals) */
export async function getThread(
  threadId: string,
  apiOptions?: InvestigationApiOptions
): Promise<{
  success: boolean;
  thread?: InvestigationThread;
  messages?: InvestigationMessage[];
  signals?: InvestigationSignal[];
  error?: string;
}> {
  try {
    const data = await fetchJson<{
      success: boolean;
      thread: InvestigationThread;
      messages: InvestigationMessage[];
      signals: InvestigationSignal[];
    }>(`${API_BASE}/investigations/${threadId}`, {
      headers: buildHeaders(apiOptions),
    });
    return {
      success: true,
      thread: data.thread,
      messages: data.messages,
      signals: data.signals,
    };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/** Envoyer un message sur une piste (déclenche collecte + mise à jour) */
export async function sendMessage(
  threadId: string,
  payload: SendMessagePayload,
  apiOptions?: InvestigationApiOptions
): Promise<{
  success: boolean;
  message?: InvestigationMessage;
  newSignals?: InvestigationSignal[];
  error?: string;
}> {
  try {
    const data = await fetchJson<{
      success: boolean;
      message: InvestigationMessage;
      newSignals: InvestigationSignal[];
    }>(`${API_BASE}/investigations/${threadId}/messages`, {
      method: 'POST',
      headers: buildHeaders(apiOptions),
      body: JSON.stringify(payload),
    });
    return { success: true, message: data.message, newSignals: data.newSignals };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/** Liste des signaux d'une piste */
export async function getSignals(
  threadId: string,
  apiOptions?: InvestigationApiOptions
): Promise<{
  success: boolean;
  signals?: InvestigationSignal[];
  error?: string;
}> {
  try {
    const data = await fetchJson<{ success: boolean; signals: InvestigationSignal[] }>(
      `${API_BASE}/investigations/${threadId}/signals`,
      { headers: buildHeaders(apiOptions) }
    );
    return { success: true, signals: data.signals };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/** Mettre à jour une piste (statut, titre) */
export async function updateThread(
  threadId: string,
  patch: { status?: InvestigationThread['status']; title?: string },
  apiOptions?: InvestigationApiOptions
): Promise<{ success: boolean; thread?: InvestigationThread; error?: string }> {
  try {
    const data = await fetchJson<{ success: boolean; thread: InvestigationThread }>(
      `${API_BASE}/investigations/${threadId}`,
      { method: 'PATCH', headers: buildHeaders(apiOptions), body: JSON.stringify(patch) }
    );
    return { success: true, thread: data.thread };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}

/** Télécharger le brief (texte) d'une piste */
export async function getBrief(
  threadId: string,
  apiOptions?: InvestigationApiOptions
): Promise<{ success: boolean; blob?: Blob; filename?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/investigations/${threadId}/brief`, {
      headers: buildHeaders(apiOptions),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((err as { error?: string }).error || 'Request failed');
    }
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition');
    const filename = disposition?.match(/filename="([^"]+)"/)?.[1] ?? `brief-${threadId.slice(0, 8)}.txt`;
    return { success: true, blob, filename };
  } catch (e: any) {
    return { success: false, error: e?.message };
  }
}
