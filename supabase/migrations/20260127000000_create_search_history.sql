-- Migration: Create search_history table for per-user search history (ChatGPT-style)
-- Purpose: Persist search sessions so users can see and reopen past searches

CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  title TEXT,
  input_type TEXT NOT NULL DEFAULT 'text',
  session_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(user_id, created_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage search_history"
  ON public.search_history
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE public.search_history IS 'Per-user search session history; session_snapshot allows restoring a session when reopening from history.';
