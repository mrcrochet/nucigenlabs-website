-- Nucigen Intelligence Detective — Investigation Threads (pistes d'enquête)
-- Conception: CONCEPTION_INTELLIGENCE_DETECTIVE.md

-- Piste d'enquête
CREATE TABLE IF NOT EXISTS public.investigation_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  initial_hypothesis TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('geopolitics', 'commodities', 'security', 'finance')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'closed')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  investigative_axes TEXT[] DEFAULT '{}',
  current_assessment TEXT CHECK (current_assessment IN ('supported', 'partially_supported', 'unclear', 'contradicted')),
  blind_spots TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investigation_threads_user_id ON public.investigation_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_investigation_threads_status ON public.investigation_threads(status);
CREATE INDEX IF NOT EXISTS idx_investigation_threads_updated_at ON public.investigation_threads(updated_at DESC);

-- Signal (preuve / élément)
CREATE TABLE IF NOT EXISTS public.investigation_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.investigation_threads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('article', 'report', 'testimony', 'data', 'sanction', 'seizure')),
  source TEXT NOT NULL,
  url TEXT,
  date DATE,
  actors TEXT[] DEFAULT '{}',
  summary TEXT NOT NULL,
  credibility_score TEXT CHECK (credibility_score IN ('A', 'B', 'C', 'D')),
  extracted_facts TEXT[] DEFAULT '{}',
  impact_on_hypothesis TEXT CHECK (impact_on_hypothesis IN ('supports', 'weakens', 'neutral')),
  raw_evidence JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investigation_signals_thread_id ON public.investigation_signals(thread_id);
CREATE INDEX IF NOT EXISTS idx_investigation_signals_created_at ON public.investigation_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investigation_signals_type ON public.investigation_signals(type);

-- Messages (historique chat)
CREATE TABLE IF NOT EXISTS public.investigation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.investigation_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  citations TEXT[] DEFAULT '{}',
  evidence_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investigation_messages_thread_id ON public.investigation_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_investigation_messages_created_at ON public.investigation_messages(created_at ASC);

-- Liens causaux (Phase 4)
CREATE TABLE IF NOT EXISTS public.investigation_causal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.investigation_threads(id) ON DELETE CASCADE,
  from_actor TEXT NOT NULL,
  to_actor TEXT NOT NULL,
  mechanism TEXT NOT NULL CHECK (mechanism IN ('funding', 'trafficking', 'influence', 'logistics')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  evidence_signal_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investigation_causal_links_thread_id ON public.investigation_causal_links(thread_id);

-- RLS
ALTER TABLE public.investigation_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_causal_links ENABLE ROW LEVEL SECURITY;

-- Policies: service role full access (API uses service role and filters by user_id from Clerk)
CREATE POLICY "Service role full access investigation_threads"
  ON public.investigation_threads FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access investigation_signals"
  ON public.investigation_signals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access investigation_messages"
  ON public.investigation_messages FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access investigation_causal_links"
  ON public.investigation_causal_links FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Optional: if using Supabase Auth with synced user_id, users can access own threads
-- CREATE POLICY "Users own threads" ON public.investigation_threads
--   FOR ALL USING (auth.uid() = user_id);
-- (Signals/messages/causal_links are then accessed via thread ownership in app logic)

COMMENT ON TABLE public.investigation_threads IS 'Nucigen Intelligence Detective: pistes d''enquête (hypothèses poursuivies dans le temps)';
COMMENT ON TABLE public.investigation_signals IS 'Signaux / preuves rattachés à une piste (articles, rapports, témoignages, etc.)';
COMMENT ON TABLE public.investigation_messages IS 'Historique des messages chat (user/assistant) par piste';
COMMENT ON TABLE public.investigation_causal_links IS 'Liens causaux acteur→acteur (Phase 4)';
