-- ============================================
-- PHASE 3C: User Alerts & Advanced Search
-- Tables for user alert preferences and notifications
-- ============================================

-- Table: alert_preferences (user alert configuration)
CREATE TABLE IF NOT EXISTS public.alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Alert triggers
  enabled BOOLEAN DEFAULT true,
  min_impact_score NUMERIC CHECK (min_impact_score >= 0 AND min_impact_score <= 1),
  min_confidence NUMERIC CHECK (min_confidence >= 0 AND min_confidence <= 1),
  
  -- Filters
  sectors TEXT[], -- Array of sectors to monitor
  regions TEXT[], -- Array of regions to monitor
  event_types TEXT[], -- Array of event types to monitor ('Geopolitical', 'Industrial', etc.)
  
  -- Notification settings
  notify_on_new_event BOOLEAN DEFAULT true,
  notify_on_high_impact BOOLEAN DEFAULT true,
  notify_on_sector_match BOOLEAN DEFAULT true,
  notify_on_region_match BOOLEAN DEFAULT true,
  
  -- Frequency
  notification_frequency TEXT DEFAULT 'realtime' CHECK (notification_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: user_alerts (generated alerts for users)
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  nucigen_event_id UUID REFERENCES public.nucigen_events(id) ON DELETE CASCADE NOT NULL,
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('new_event', 'high_impact', 'sector_match', 'region_match', 'custom')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  -- Matching reasons
  match_reasons TEXT[] NOT NULL, -- Array of reasons why this event matched
  
  -- Status
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed', 'saved')),
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one alert per user per event
  UNIQUE(user_id, nucigen_event_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alert_preferences_user_id ON public.alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user_id ON public.user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_status ON public.user_alerts(status);
CREATE INDEX IF NOT EXISTS idx_user_alerts_created_at ON public.user_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_alerts_nucigen_event_id ON public.user_alerts(nucigen_event_id);
CREATE INDEX IF NOT EXISTS idx_user_alerts_priority ON public.user_alerts(priority);

-- RLS Policies
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- Policies: Users can manage their own alert preferences
CREATE POLICY "Users can read own alert preferences"
  ON public.alert_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert preferences"
  ON public.alert_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert preferences"
  ON public.alert_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies: Users can manage their own alerts
CREATE POLICY "Users can read own alerts"
  ON public.user_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON public.user_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for alert generation)
CREATE POLICY "Service role full access to alerts"
  ON public.user_alerts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to alert preferences"
  ON public.alert_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alert_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_alert_preferences_updated_at_trigger
  BEFORE UPDATE ON public.alert_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_preferences_updated_at();

-- Function to create default alert preferences for new users
CREATE OR REPLACE FUNCTION create_default_alert_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.alert_preferences (
    user_id,
    enabled,
    min_impact_score,
    min_confidence,
    sectors,
    regions,
    event_types,
    notify_on_new_event,
    notify_on_high_impact,
    notify_on_sector_match,
    notify_on_region_match
  )
  VALUES (
    NEW.id,
    true,
    0.5, -- Default: medium impact
    0.6, -- Default: medium confidence
    CASE WHEN NEW.sector IS NOT NULL THEN ARRAY[NEW.sector] ELSE ARRAY[]::TEXT[] END,
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when user is created
DROP TRIGGER IF EXISTS on_user_created_alert_prefs ON public.users;
CREATE TRIGGER on_user_created_alert_prefs
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_alert_preferences();

