/**
 * Load thread + messages + signals for one investigation.
 */

import type { Dispatch, SetStateAction } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { getThread, getDetectiveGraph, triggerGenerateGraph } from '../api';
import type { InvestigationThread, InvestigationSignal, InvestigationMessage } from '../types';
import type { InvestigationGraph } from '../types';
import { buildGraphFromSignals } from '../../../lib/investigation/build-graph';
import { DEMO_THREAD_ID, getDemoGraphFixture } from '../demo-fixture';

export interface UseInvestigationOptions {
  threadId: string | null;
  apiOptions?: { clerkUserId?: string | null };
}

export interface UseInvestigationResult {
  thread: InvestigationThread | null;
  messages: InvestigationMessage[];
  signals: InvestigationSignal[];
  graph: InvestigationGraph | null;
  loading: boolean;
  error: string | null;
  graphGenerating: boolean;
  graphRefreshing: boolean;
  setMessages: Dispatch<SetStateAction<InvestigationMessage[]>>;
  setSignals: Dispatch<SetStateAction<InvestigationSignal[]>>;
  setDetectiveGraph: Dispatch<SetStateAction<InvestigationGraph | null>>;
  refetch: () => Promise<void>;
  refetchGraph: () => Promise<void>;
  triggerGraphGenerate: () => Promise<void>;
}

export function useInvestigation({ threadId, apiOptions }: UseInvestigationOptions): UseInvestigationResult {
  const [thread, setThread] = useState<InvestigationThread | null>(null);
  const [messages, setMessages] = useState<InvestigationMessage[]>([]);
  const [signals, setSignals] = useState<InvestigationSignal[]>([]);
  const [detectiveGraph, setDetectiveGraph] = useState<InvestigationGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphGenerating, setGraphGenerating] = useState(false);
  const [graphRefreshing, setGraphRefreshing] = useState(false);

  const graph =
    !thread
      ? null
      : thread.id === DEMO_THREAD_ID
        ? getDemoGraphFixture()
        : detectiveGraph ?? (signals.length ? buildGraphFromSignals(thread, signals) : null);

  const load = useCallback(async () => {
    if (!threadId) {
      setThread(null);
      setMessages([]);
      setSignals([]);
      setDetectiveGraph(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await getThread(threadId, apiOptions);
    if (res.success && res.thread) {
      setThread(res.thread);
      setMessages(res.messages ?? []);
      setSignals(res.signals ?? []);
      if (threadId !== DEMO_THREAD_ID) {
        const graphRes = await getDetectiveGraph(threadId, apiOptions);
        const hasGraph = graphRes.success && graphRes.graph;
        setDetectiveGraph(hasGraph ? graphRes.graph! : null);
        if (!hasGraph) {
          await triggerGenerateGraph(threadId, apiOptions);
          setGraphGenerating(true);
        }
      } else {
        setDetectiveGraph(null);
      }
    } else {
      setError(res.error ?? 'Piste introuvable');
      setThread(null);
      setMessages([]);
      setSignals([]);
      setDetectiveGraph(null);
    }
    setLoading(false);
  }, [threadId, apiOptions?.clerkUserId]);

  const refetchGraph = useCallback(async () => {
    if (!threadId || threadId === DEMO_THREAD_ID) return;
    setGraphRefreshing(true);
    const res = await getDetectiveGraph(threadId, apiOptions);
    if (res.success && res.graph) setDetectiveGraph(res.graph);
    setGraphRefreshing(false);
  }, [threadId, apiOptions?.clerkUserId]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll for graph when generation was triggered
  useEffect(() => {
    if (!graphGenerating || !threadId || threadId === DEMO_THREAD_ID) return;
    const POLL_INTERVAL_MS = 2500;
    const POLL_TIMEOUT_MS = 90000;
    const start = Date.now();
    const t = setInterval(async () => {
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        clearInterval(t);
        setGraphGenerating(false);
        return;
      }
      const res = await getDetectiveGraph(threadId, apiOptions);
      if (res.success && res.graph) {
        setDetectiveGraph(res.graph);
        setGraphGenerating(false);
        clearInterval(t);
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [graphGenerating, threadId, apiOptions?.clerkUserId]);

  const triggerGraphGenerate = useCallback(async () => {
    if (!threadId || threadId === DEMO_THREAD_ID) return;
    await triggerGenerateGraph(threadId, apiOptions);
    setGraphGenerating(true);
  }, [threadId, apiOptions?.clerkUserId]);

  return {
    thread,
    messages,
    signals,
    graph,
    loading,
    error,
    graphGenerating,
    graphRefreshing,
    setMessages,
    setSignals,
    setDetectiveGraph,
    refetch: load,
    refetchGraph,
    triggerGraphGenerate,
  };
}
