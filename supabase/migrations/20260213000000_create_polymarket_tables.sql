-- Polymarket prediction market integration tables

-- Table: polymarket_markets
-- Stores active prediction markets fetched from Polymarket Gamma API
CREATE TABLE IF NOT EXISTS polymarket_markets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condition_id TEXT UNIQUE NOT NULL,
  question TEXT NOT NULL,
  slug TEXT,
  outcome_yes_price NUMERIC(6,5),
  outcome_no_price NUMERIC(6,5),
  volume NUMERIC DEFAULT 0,
  liquidity NUMERIC DEFAULT 0,
  category TEXT,
  end_date TIMESTAMPTZ,
  url TEXT,
  tags TEXT[] DEFAULT '{}',
  event_id TEXT,
  event_title TEXT,
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polymarket_condition ON polymarket_markets(condition_id);
CREATE INDEX IF NOT EXISTS idx_polymarket_tags ON polymarket_markets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_polymarket_question_fts ON polymarket_markets USING GIN(to_tsvector('english', question));

-- Table: signal_market_matches
-- Links Nucigen PressureSignals to Polymarket markets with divergence data
CREATE TABLE IF NOT EXISTS signal_market_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id TEXT NOT NULL,
  market_id UUID REFERENCES polymarket_markets(id) ON DELETE CASCADE,
  match_score NUMERIC(4,3),
  model_probability NUMERIC(6,5),
  crowd_probability NUMERIC(6,5),
  divergence NUMERIC(6,5),
  matched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smm_signal ON signal_market_matches(signal_id);
CREATE INDEX IF NOT EXISTS idx_smm_market ON signal_market_matches(market_id);
CREATE INDEX IF NOT EXISTS idx_smm_matched_at ON signal_market_matches(matched_at DESC);

-- RLS: these tables are read/written by service role only (cron jobs)
ALTER TABLE polymarket_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_market_matches ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service_role_polymarket_markets" ON polymarket_markets
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "service_role_signal_market_matches" ON signal_market_matches
  FOR ALL USING (true) WITH CHECK (true);
