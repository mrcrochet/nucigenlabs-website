-- Audit Trail Table (Compliance & Auditability)
-- Tracks all user actions for compliance and audit purposes
-- Phase D.1: Audit Trail System (PRIORITY HIGH)

CREATE TABLE IF NOT EXISTS public.audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT, -- Denormalized for easier queries (from users table)
    
    -- Action identification
    action_type TEXT NOT NULL, 
    -- Examples: 'event_viewed', 'alert_created', 'recommendation_generated', 
    --          'filing_viewed', 'comparison_created', 'preference_updated'
    
    -- Resource information
    resource_type TEXT NOT NULL, 
    -- Examples: 'event', 'alert', 'recommendation', 'filing', 'earnings_call', 'user_preference'
    resource_id UUID NOT NULL, -- ID of the resource (nucigen_events.id, recommendations.id, etc.)
    
    -- Action metadata
    metadata JSONB, 
    -- Additional context about the action
    -- Example: {"event_type": "Geopolitical", "country": "Russia", "impact_score": 0.8}
    
    -- Request information (for compliance)
    source_ip TEXT, -- IP address of the user
    user_agent TEXT, -- User agent string
    request_path TEXT, -- API endpoint or page path (e.g., '/api/events/123', '/events/123')
    request_method TEXT, -- HTTP method (GET, POST, PUT, DELETE)
    
    -- Status
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
    error_message TEXT, -- Error message if status = 'error'
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups and compliance queries
CREATE INDEX IF NOT EXISTS idx_audit_trail_user ON public.audit_trail(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_email ON public.audit_trail(user_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON public.audit_trail(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_resource ON public.audit_trail(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON public.audit_trail(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_status ON public.audit_trail(status);

-- Composite index for common queries (user + resource type)
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_resource ON public.audit_trail(user_id, resource_type, created_at DESC);

-- Index for GIN on metadata (for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_audit_trail_metadata ON public.audit_trail USING GIN(metadata);

-- RPC Function: Get audit trail for a specific user (Clerk user ID)
-- This function filters audit trails based on Clerk user ID mapping
-- Used by the application layer to securely query audit trails
CREATE OR REPLACE FUNCTION public.get_user_audit_trail(
    clerk_user_id_param TEXT,
    limit_param INTEGER DEFAULT 100,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_email TEXT,
    action_type TEXT,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB,
    source_ip TEXT,
    user_agent TEXT,
    request_path TEXT,
    request_method TEXT,
    status TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    mapped_user_id UUID;
BEGIN
    -- Get Supabase UUID from Clerk user ID via clerk_user_mapping
    SELECT supabase_user_id INTO mapped_user_id
    FROM public.clerk_user_mapping
    WHERE clerk_user_id = clerk_user_id_param
    LIMIT 1;

    -- If mapping not found, return empty result
    IF mapped_user_id IS NULL THEN
        RETURN;
    END IF;

    -- Return audit trail records for this user
    RETURN QUERY
    SELECT
        at.id,
        at.user_id,
        at.user_email,
        at.action_type,
        at.resource_type,
        at.resource_id,
        at.metadata,
        at.source_ip,
        at.user_agent,
        at.request_path,
        at.request_method,
        at.status,
        at.error_message,
        at.created_at
    FROM public.audit_trail at
    WHERE at.user_id = mapped_user_id
    ORDER BY at.created_at DESC
    LIMIT limit_param
    OFFSET offset_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies (Row Level Security)
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can read audit trails directly
-- Users should use the RPC function get_user_audit_trail() to access their own audit trails
-- This ensures proper filtering via clerk_user_mapping
CREATE POLICY "Only service role can read audit trails directly"
    ON public.audit_trail
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Policy: Only service role can insert audit records (backend only)
CREATE POLICY "Only service role can insert audit records"
    ON public.audit_trail
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Policy: No updates or deletes allowed (immutable audit trail)
-- Audit trails should never be modified or deleted for compliance reasons

-- Function to automatically populate user_email from users table (on insert)
CREATE OR REPLACE FUNCTION populate_audit_trail_user_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL AND NEW.user_email IS NULL THEN
        SELECT email INTO NEW.user_email
        FROM public.users
        WHERE id = NEW.user_id
        LIMIT 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate user_email
CREATE TRIGGER trigger_populate_audit_trail_user_email
    BEFORE INSERT ON public.audit_trail
    FOR EACH ROW
    EXECUTE FUNCTION populate_audit_trail_user_email();

-- Comment for documentation
COMMENT ON TABLE public.audit_trail IS 'Immutable audit trail of all user actions for compliance and audit purposes. Required for enterprise clients and regulatory compliance.';
COMMENT ON COLUMN public.audit_trail.metadata IS 'JSONB containing additional context about the action (event type, scores, etc.) for detailed compliance reporting';
COMMENT ON COLUMN public.audit_trail.user_email IS 'Denormalized email from users table for easier compliance queries without joins';
