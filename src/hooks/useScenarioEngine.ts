/**
 * Scenario Engine hooks — TanStack Query wrappers for scenario API.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { safeFetchJson } from '../lib/safe-fetch-json';
import type { CustomScenarioFormData } from '../components/scenario-v2/CustomScenarioModal';

interface ScenarioHistoryItem {
  id: string;
  title: string;
  scope: string;
  severity: string;
  timeframe: string;
  createdAt: string;
  status: 'completed' | 'running' | 'queued';
  plausibility: number;
}

interface GenerateResponse {
  success: boolean;
  scenario: Record<string, unknown>;
  id?: string;
  error?: string;
}

interface HistoryResponse {
  success: boolean;
  scenarios: ScenarioHistoryItem[];
}

interface ScenarioByIdResponse {
  success: boolean;
  scenario: Record<string, unknown>;
  meta?: {
    id: string;
    title: string;
    scope: string;
    severity: string;
    timeframe: string;
    status: string;
    plausibility: number;
    createdAt: string;
  };
}

/** Generate a new scenario — mutation with 90s timeout */
export function useGenerateScenario() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async (formData: CustomScenarioFormData) => {
      const userId = user?.id;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (userId) {
        headers['x-clerk-user-id'] = userId;
      }

      const res = await safeFetchJson<GenerateResponse>(
        '/api/scenarios/generate',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        },
        { timeoutMs: 90_000 },
      );
      if (!res.success) throw new Error(res.error || 'Generation failed');
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenario-history'] });
    },
  });
}

/** Fetch scenario history for the current user */
export function useScenarioHistory(userId?: string) {
  return useQuery({
    queryKey: ['scenario-history', userId],
    queryFn: async () => {
      if (!userId) return { success: true, scenarios: [] } as HistoryResponse;
      return safeFetchJson<HistoryResponse>(
        `/api/scenarios/history?userId=${encodeURIComponent(userId)}`,
        { headers: { 'x-clerk-user-id': userId } },
      );
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

/** Fetch a complete scenario by its DB id */
export function useScenarioById(id?: string | null) {
  return useQuery({
    queryKey: ['scenario', id],
    queryFn: async () => {
      if (!id) throw new Error('No id');
      return safeFetchJson<ScenarioByIdResponse>(`/api/scenarios/${id}`);
    },
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}
