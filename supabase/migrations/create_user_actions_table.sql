-- User Actions Table
-- Tracks user behavior for reinforcement learning and recommendation optimization
-- Records clicks, reads, shares, ignores, and other engagement signals

CREATE TABLE IF NOT EXISTS public.user_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User and entity identification
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.nucigen_events(id) ON DELETE SET NULL,
    recommendation_id UUID REFERENCES public.recommendations(id) ON DELETE SET NULL,
    
    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN (
        'click',           -- Clicked on event/recommendation
        'view',            -- Viewed event details
        'read',            -- Read full content (time-based)
        'share',           -- Shared event
        'bookmark',        -- Bookmarked event
        'ignore',          -- Ignored/dismissed event
        'feedback_positive', -- Positive feedback
        'feedback_negative', -- Negative feedback
        'alert_created',   -- Created alert for similar events
        'export',          -- Exported event data
        'deep_dive'        -- Clicked "learn more" or deep dive
    )),
    
    -- Action metadata
    action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT, -- User session ID for grouping actions
    page_url TEXT, -- Page where action occurred
    referrer TEXT, -- Where user came from
    
    -- Engagement metrics
    time_spent_seconds INTEGER, -- Time spent on event (for 'read' actions)
    scroll_depth NUMERIC(3, 2), -- How far user scrolled (0-1)
    interaction_count INTEGER DEFAULT 1, -- Number of interactions in this action
    
    -- Context
    feed_position INTEGER, -- Position in feed (1 = top, higher = lower)
    feed_type TEXT, -- 'personalized', 'general', 'intelligence', etc.
    recommendation_priority TEXT, -- Priority of recommendation if applicable
    
    -- Reward signal (for RL)
    reward_score NUMERIC(5, 4), -- Calculated reward for this action (0-1)
    reward_calculated_at TIMESTAMPTZ, -- When reward was calculated
    
    -- Metadata
    user_agent TEXT,
    ip_address INET, -- For analytics (can be anonymized)
    metadata JSONB -- Additional context-specific data
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON public.user_actions(user_id, action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_actions_event_id ON public.user_actions(event_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_type_timestamp ON public.user_actions(action_type, action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_actions_session ON public.user_actions(session_id, action_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_actions_reward ON public.user_actions(reward_score) WHERE reward_score IS NOT NULL;

-- Composite index for user-event pairs (common query pattern)
CREATE INDEX IF NOT EXISTS idx_user_actions_user_event 
    ON public.user_actions(user_id, event_id, action_timestamp DESC);

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS NUMERIC(5, 4) AS $$
DECLARE
    v_score NUMERIC(5, 4);
    v_total_actions INTEGER;
    v_weighted_score NUMERIC;
BEGIN
    -- Calculate weighted engagement score based on action types
    SELECT 
        COALESCE(SUM(
            CASE action_type
                WHEN 'click' THEN 1.0
                WHEN 'view' THEN 1.5
                WHEN 'read' THEN 2.0
                WHEN 'share' THEN 3.0
                WHEN 'bookmark' THEN 2.5
                WHEN 'feedback_positive' THEN 3.0
                WHEN 'deep_dive' THEN 2.5
                WHEN 'alert_created' THEN 2.0
                WHEN 'ignore' THEN -0.5
                WHEN 'feedback_negative' THEN -1.0
                ELSE 0.5
            END
        ), 0) / NULLIF(COUNT(*), 0)
    INTO v_weighted_score
    FROM public.user_actions
    WHERE user_id = p_user_id
    AND action_timestamp >= NOW() - (p_days || ' days')::INTERVAL;
    
    -- Normalize to 0-1 range
    v_score := LEAST(1.0, GREATEST(0.0, v_weighted_score / 10.0));
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to get user action history for an event
CREATE OR REPLACE FUNCTION get_user_event_actions(
    p_user_id UUID,
    p_event_id UUID
)
RETURNS TABLE (
    action_type TEXT,
    action_timestamp TIMESTAMPTZ,
    time_spent_seconds INTEGER,
    reward_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.action_type,
        ua.action_timestamp,
        ua.time_spent_seconds,
        ua.reward_score
    FROM public.user_actions ua
    WHERE ua.user_id = p_user_id
    AND ua.event_id = p_event_id
    ORDER BY ua.action_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate user actions for RL training
CREATE OR REPLACE FUNCTION aggregate_user_actions_for_rl(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    event_id UUID,
    total_actions INTEGER,
    total_reward NUMERIC,
    last_action_type TEXT,
    last_action_timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ua.event_id,
        COUNT(*)::INTEGER as total_actions,
        COALESCE(SUM(ua.reward_score), 0)::NUMERIC as total_reward,
        (array_agg(ua.action_type ORDER BY ua.action_timestamp DESC))[1] as last_action_type,
        MAX(ua.action_timestamp) as last_action_timestamp
    FROM public.user_actions ua
    WHERE ua.user_id = p_user_id
    AND ua.action_timestamp >= p_start_date
    AND ua.action_timestamp < p_end_date
    AND ua.event_id IS NOT NULL
    GROUP BY ua.event_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.user_actions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can read own actions" ON public.user_actions
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id::text OR user_id IN (
        SELECT id FROM public.users WHERE id::text = auth.uid()::text
    ));

CREATE POLICY "Users can insert own actions" ON public.user_actions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id::text OR user_id IN (
        SELECT id FROM public.users WHERE id::text = auth.uid()::text
    ));

COMMENT ON TABLE public.user_actions IS 'Tracks user behavior for reinforcement learning and recommendation optimization';
COMMENT ON COLUMN public.user_actions.reward_score IS 'Calculated reward for RL training (0-1, higher = better engagement)';
COMMENT ON COLUMN public.user_actions.feed_position IS 'Position in feed (1 = top) - important for RL context';
