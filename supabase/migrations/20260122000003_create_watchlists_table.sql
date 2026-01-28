-- ============================================
-- Migration: Create Watchlists Table (MVP)
-- ============================================
-- NEW ARCHITECTURE: Watchlist system for tracking entities
-- Users can watch: countries, companies, sectors, supply chains

CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Entity being watched
  entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'country', 'sector', 'supply-chain', 'signal', 'event')),
  entity_id TEXT NOT NULL, -- ID of the entity (company ticker, country code, sector name, etc.)
  entity_name TEXT NOT NULL, -- Display name
  
  -- Additional metadata
  entity_metadata JSONB DEFAULT '{}', -- Additional info (e.g., company sector, country region)
  
  -- Notification preferences for this entity
  notify_on_signal BOOLEAN DEFAULT true,
  notify_on_event BOOLEAN DEFAULT true,
  notify_on_scenario BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique entity per user
  UNIQUE(user_id, entity_type, entity_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON public.watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_entity_type ON public.watchlists(entity_type);
CREATE INDEX IF NOT EXISTS idx_watchlists_entity_id ON public.watchlists(entity_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_entity ON public.watchlists(user_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_created_at ON public.watchlists(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own watchlists
CREATE POLICY "Users can view their own watchlists"
  ON public.watchlists
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text
    )
  );

-- RLS Policy: Users can insert their own watchlists
CREATE POLICY "Users can insert their own watchlists"
  ON public.watchlists
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text
    )
  );

-- RLS Policy: Users can update their own watchlists
CREATE POLICY "Users can update their own watchlists"
  ON public.watchlists
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text
    )
  );

-- RLS Policy: Users can delete their own watchlists
CREATE POLICY "Users can delete their own watchlists"
  ON public.watchlists
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_watchlists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER watchlists_updated_at
  BEFORE UPDATE ON public.watchlists
  FOR EACH ROW
  EXECUTE FUNCTION update_watchlists_updated_at();
