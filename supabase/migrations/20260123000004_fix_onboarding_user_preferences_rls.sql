-- Migration: Fix onboarding - RLS for user_preferences (Clerk / anon)
-- Purpose: Allow frontend (anon) to upsert preferences during onboarding
-- Clerk users have no auth.uid(); policies use "user_id exists in public.users"

-- Ensure table exists (may already exist from phase5 or dashboard)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preferred_sectors TEXT[] DEFAULT '{}',
  preferred_regions TEXT[] DEFAULT '{}',
  preferred_event_types TEXT[] DEFAULT '{}',
  focus_areas TEXT[],
  feed_priority TEXT DEFAULT 'relevance' CHECK (feed_priority IN ('relevance', 'recency', 'impact', 'balanced')),
  min_impact_score NUMERIC DEFAULT 0.3 CHECK (min_impact_score >= 0 AND min_impact_score <= 1),
  min_confidence_score NUMERIC DEFAULT 0.5 CHECK (min_confidence_score >= 0 AND min_confidence_score <= 1),
  preferred_time_horizons TEXT[] DEFAULT '{}',
  notify_on_new_event BOOLEAN DEFAULT true,
  notify_frequency TEXT DEFAULT 'realtime' CHECK (notify_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies that use auth.uid() (block Clerk users)
DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Clerk users can read own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Clerk users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow all inserts from triggers" ON public.user_preferences;
DROP POLICY IF EXISTS "Allow insert for users in users table" ON public.user_preferences;

-- SELECT: allow anon/authenticated when row's user_id exists in public.users
CREATE POLICY "Onboarding: read preferences when user exists"
  ON public.user_preferences
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_preferences.user_id)
  );

-- INSERT: allow anon/authenticated when inserting for a user_id that exists in public.users
CREATE POLICY "Onboarding: insert preferences when user exists"
  ON public.user_preferences
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id)
  );

-- UPDATE: allow anon/authenticated when row's user_id exists (fix: include anon for Clerk)
CREATE POLICY "Onboarding: update preferences when user exists"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated, anon
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_preferences.user_id)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id)
  );

-- Service role full access (backend)
DROP POLICY IF EXISTS "Service role can manage preferences" ON public.user_preferences;
CREATE POLICY "Service role can manage preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger: create default preferences row when user is created (get_or_create_supabase_user_id)
CREATE OR REPLACE FUNCTION public.create_default_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, preferred_sectors, preferred_regions)
  VALUES (NEW.id, '{}', '{}')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'create_default_preferences_for_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_preferences_for_user();
