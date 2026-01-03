-- ============================================
-- PHASE 5: User Preferences Table
-- For personalized feed and improved alerts
-- ============================================

-- Table: user_preferences
-- Stores detailed user interests and preferences for feed personalization
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Interest areas (multiple selections)
  preferred_sectors TEXT[] DEFAULT '{}', -- ['Technology', 'Energy', 'Finance', etc.]
  preferred_regions TEXT[] DEFAULT '{}', -- ['US', 'EU', 'China', 'Middle East', etc.]
  preferred_event_types TEXT[] DEFAULT '{}', -- ['Geopolitical', 'Industrial', 'SupplyChain', etc.]
  
  -- Focus areas (what they care about most)
  focus_areas TEXT[], -- Custom tags: ['semiconductor supply chains', 'energy geopolitics', etc.]
  
  -- Feed preferences
  feed_priority TEXT DEFAULT 'relevance' CHECK (feed_priority IN ('relevance', 'recency', 'impact', 'balanced')),
  min_impact_score NUMERIC DEFAULT 0.3 CHECK (min_impact_score >= 0 AND min_impact_score <= 1),
  min_confidence_score NUMERIC DEFAULT 0.5 CHECK (min_confidence_score >= 0 AND min_confidence_score <= 1),
  
  -- Time horizon preferences
  preferred_time_horizons TEXT[] DEFAULT '{}', -- ['hours', 'days', 'weeks']
  
  -- Notification preferences (can be different from alert preferences)
  notify_on_new_event BOOLEAN DEFAULT true,
  notify_frequency TEXT DEFAULT 'realtime' CHECK (notify_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_sectors ON public.user_preferences USING GIN(preferred_sectors);
CREATE INDEX IF NOT EXISTS idx_user_preferences_regions ON public.user_preferences USING GIN(preferred_regions);
CREATE INDEX IF NOT EXISTS idx_user_preferences_event_types ON public.user_preferences USING GIN(preferred_event_types);

-- RLS Policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
CREATE POLICY "Users can read own preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage preferences" ON public.user_preferences;
CREATE POLICY "Service role can manage preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Function to create default preferences from onboarding data
CREATE OR REPLACE FUNCTION create_default_preferences_from_onboarding()
RETURNS TRIGGER AS $$
BEGIN
  -- Create preferences based on user's onboarding data
  INSERT INTO public.user_preferences (user_id, preferred_sectors, preferred_regions)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.sector IS NOT NULL THEN ARRAY[NEW.sector]
      ELSE '{}'
    END,
    '{}' -- Regions will be set during onboarding
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when user is created
DROP TRIGGER IF EXISTS trigger_create_default_preferences ON public.users;
CREATE TRIGGER trigger_create_default_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_preferences_from_onboarding();

