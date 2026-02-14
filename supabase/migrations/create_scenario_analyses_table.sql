-- Scenario Analyses table
-- Stores generated scenario dashboard payloads for history & retrieval.

CREATE TABLE scenario_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  scope TEXT NOT NULL,
  severity TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  status TEXT DEFAULT 'completed',
  plausibility INTEGER,
  form_data JSONB NOT NULL,
  result_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scenario_analyses_user ON scenario_analyses(user_id, created_at DESC);
