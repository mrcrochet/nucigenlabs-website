-- Migration: Add user engagement tracking table
-- Purpose: Track user interactions with Discover items (views, saves, clicks, shares)

CREATE TABLE IF NOT EXISTS public.user_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('view', 'save', 'click', 'share', 'read_time')),
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data (e.g., read_time in seconds, share_platform)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate tracking (same user, same event, same type within 1 hour)
  CONSTRAINT unique_engagement UNIQUE (user_id, event_id, engagement_type, created_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON public.user_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_event_id ON public.user_engagement(event_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_type ON public.user_engagement(engagement_type);
CREATE INDEX IF NOT EXISTS idx_user_engagement_created_at ON public.user_engagement(created_at DESC);

-- Index for analytics queries (user + type + date)
CREATE INDEX IF NOT EXISTS idx_user_engagement_analytics ON public.user_engagement(user_id, engagement_type, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own engagement data
CREATE POLICY "Users can view their own engagement"
  ON public.user_engagement
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own engagement
CREATE POLICY "Users can insert their own engagement"
  ON public.user_engagement
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role can manage all engagement"
  ON public.user_engagement
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to get engagement stats for an event
CREATE OR REPLACE FUNCTION get_event_engagement_stats(event_uuid UUID)
RETURNS TABLE (
  total_views BIGINT,
  total_saves BIGINT,
  total_clicks BIGINT,
  total_shares BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE engagement_type = 'view')::BIGINT as total_views,
    COUNT(*) FILTER (WHERE engagement_type = 'save')::BIGINT as total_saves,
    COUNT(*) FILTER (WHERE engagement_type = 'click')::BIGINT as total_clicks,
    COUNT(*) FILTER (WHERE engagement_type = 'share')::BIGINT as total_shares,
    COUNT(DISTINCT user_id)::BIGINT as unique_users
  FROM public.user_engagement
  WHERE event_id = event_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user engagement summary
CREATE OR REPLACE FUNCTION get_user_engagement_summary(user_uuid UUID, days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_views BIGINT,
  total_saves BIGINT,
  total_clicks BIGINT,
  total_shares BIGINT,
  avg_read_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE engagement_type = 'view')::BIGINT as total_views,
    COUNT(*) FILTER (WHERE engagement_type = 'save')::BIGINT as total_saves,
    COUNT(*) FILTER (WHERE engagement_type = 'click')::BIGINT as total_clicks,
    COUNT(*) FILTER (WHERE engagement_type = 'share')::BIGINT as total_shares,
    AVG((metadata->>'read_time')::NUMERIC) FILTER (WHERE engagement_type = 'read_time') as avg_read_time
  FROM public.user_engagement
  WHERE user_id = user_uuid
    AND created_at >= NOW() - (days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
