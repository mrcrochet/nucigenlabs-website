-- Migration: Create user_alert_rules table
-- Purpose: Store user-created alert rules (indicator/scenario) from CreateAlertModal

CREATE TABLE IF NOT EXISTS public.user_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  indicator TEXT NOT NULL,
  scenario_title TEXT,
  event_id UUID,
  threshold TEXT DEFAULT 'medium',
  notification_methods JSONB DEFAULT '{"email": true, "inApp": true, "webhook": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_alert_rules_user_id ON public.user_alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_user_alert_rules_event_id ON public.user_alert_rules(event_id);

ALTER TABLE public.user_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage alert rules"
  ON public.user_alert_rules
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
