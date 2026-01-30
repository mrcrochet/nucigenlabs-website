-- Migration: Create user_saved_claims table
-- Purpose: Persist Intelligence claim bookmarks (ClaimActions)

CREATE TABLE IF NOT EXISTS public.user_saved_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  claim_id TEXT NOT NULL,
  variant TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, claim_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_claims_user_id ON public.user_saved_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_claims_claim_id ON public.user_saved_claims(claim_id);

ALTER TABLE public.user_saved_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage saved claims"
  ON public.user_saved_claims
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
