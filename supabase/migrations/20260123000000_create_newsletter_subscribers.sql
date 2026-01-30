-- Migration: Create newsletter_subscribers table
-- Purpose: Store newsletter signups from Footer

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created_at ON public.newsletter_subscribers(created_at DESC);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (signup form); service_role for reads
CREATE POLICY "Allow insert for newsletter signup"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage newsletter"
  ON public.newsletter_subscribers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
