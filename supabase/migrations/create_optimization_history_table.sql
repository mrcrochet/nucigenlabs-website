-- Optimization History Table
-- Tracks parameter changes and their effects for auto-optimization
-- Enables rollback and learning from past optimizations

CREATE TABLE IF NOT EXISTS public.optimization_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Optimization identification
    optimization_type TEXT NOT NULL CHECK (optimization_type IN (
        'cache_ttl',
        'batch_size',
        'concurrency',
        'api_model',
        'api_temperature',
        'api_max_tokens',
        'query_max_results',
        'pipeline_interval',
        'other'
    )),
    component_name TEXT NOT NULL, -- e.g., 'openai_optimizer', 'tavily_collector', 'cache_service'
    
    -- Parameter changes
    parameter_name TEXT NOT NULL, -- e.g., 'cache_ttl_seconds', 'max_concurrency'
    old_value JSONB, -- Previous value
    new_value JSONB NOT NULL, -- New value
    change_reason TEXT, -- Why this change was made
    
    -- Optimization metadata
    optimization_method TEXT CHECK (optimization_method IN (
        'manual',
        'grid_search',
        'bayesian_optimization',
        'ml_prediction',
        'ab_testing',
        'gradient_descent'
    )),
    optimization_algorithm TEXT, -- Specific algorithm used
    
    -- Before metrics (baseline)
    baseline_metrics JSONB, -- Metrics before change
    -- Example: {"cache_hit_rate": 0.65, "avg_latency_ms": 250, "cost_per_day": 10.5}
    
    -- After metrics (after change)
    result_metrics JSONB, -- Metrics after change (measured after stabilization period)
    measurement_period_hours INTEGER, -- How long metrics were measured
    
    -- Impact analysis
    improvement_percentage NUMERIC(5, 2), -- Improvement in primary metric (%)
    primary_metric_name TEXT, -- Which metric was optimized (e.g., 'cache_hit_rate')
    secondary_impacts JSONB, -- Impact on other metrics
    -- Example: {"cost_change": -15.2, "latency_change": 5.1}
    
    -- Status
    status TEXT DEFAULT 'testing' CHECK (status IN (
        'testing',      -- Currently being tested
        'adopted',      -- Adopted as permanent change
        'rolled_back',  -- Rolled back due to negative impact
        'superseded'    -- Replaced by better optimization
    )),
    
    -- Rollback information
    rolled_back_at TIMESTAMPTZ,
    rollback_reason TEXT,
    
    -- Metadata
    optimized_by TEXT, -- System or user that made the change
    created_at TIMESTAMPTZ DEFAULT NOW(),
    measured_at TIMESTAMPTZ, -- When result_metrics were measured
    adopted_at TIMESTAMPTZ -- When change was adopted
);

-- Optimization Candidates Table
-- Stores potential optimizations identified by the system
CREATE TABLE IF NOT EXISTS public.optimization_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Candidate identification
    optimization_type TEXT NOT NULL,
    component_name TEXT NOT NULL,
    parameter_name TEXT NOT NULL,
    
    -- Proposed change
    current_value JSONB,
    proposed_value JSONB NOT NULL,
    expected_improvement NUMERIC(5, 2), -- Expected improvement percentage
    confidence_score NUMERIC(3, 2), -- Confidence in prediction (0-1)
    
    -- Reasoning
    reasoning TEXT, -- Why this optimization is proposed
    analysis_data JSONB, -- Supporting data/analysis
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Awaiting review/testing
        'approved',     -- Approved for testing
        'testing',      -- Currently being tested
        'rejected',     -- Rejected (won't test)
        'adopted',      -- Adopted after successful test
        'expired'       -- Expired (superseded or outdated)
    )),
    
    -- Metadata
    identified_by TEXT, -- System that identified this candidate
    identified_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    tested_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_optimization_history_type_component 
    ON public.optimization_history(optimization_type, component_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_history_status 
    ON public.optimization_history(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_history_adopted 
    ON public.optimization_history(status, adopted_at DESC) WHERE status = 'adopted';

CREATE INDEX IF NOT EXISTS idx_optimization_candidates_status 
    ON public.optimization_candidates(status, identified_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimization_candidates_type 
    ON public.optimization_candidates(optimization_type, component_name);

-- Function to get current parameter value
CREATE OR REPLACE FUNCTION get_current_parameter_value(
    p_component_name TEXT,
    p_parameter_name TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
BEGIN
    SELECT new_value INTO v_value
    FROM public.optimization_history
    WHERE component_name = p_component_name
    AND parameter_name = p_parameter_name
    AND status = 'adopted'
    ORDER BY adopted_at DESC
    LIMIT 1;
    
    RETURN COALESCE(v_value, 'null'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to record optimization attempt
CREATE OR REPLACE FUNCTION record_optimization(
    p_optimization_type TEXT,
    p_component_name TEXT,
    p_parameter_name TEXT,
    p_old_value JSONB,
    p_new_value JSONB,
    p_change_reason TEXT,
    p_optimization_method TEXT,
    p_baseline_metrics JSONB
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.optimization_history (
        optimization_type,
        component_name,
        parameter_name,
        old_value,
        new_value,
        change_reason,
        optimization_method,
        baseline_metrics,
        status
    ) VALUES (
        p_optimization_type,
        p_component_name,
        p_parameter_name,
        p_old_value,
        p_new_value,
        p_change_reason,
        p_optimization_method,
        p_baseline_metrics,
        'testing'
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function to finalize optimization (adopt or rollback)
CREATE OR REPLACE FUNCTION finalize_optimization(
    p_id UUID,
    p_result_metrics JSONB,
    p_improvement_percentage NUMERIC,
    p_primary_metric_name TEXT,
    p_secondary_impacts JSONB,
    p_adopt BOOLEAN
)
RETURNS void AS $$
BEGIN
    IF p_adopt THEN
        UPDATE public.optimization_history
        SET 
            status = 'adopted',
            result_metrics = p_result_metrics,
            improvement_percentage = p_improvement_percentage,
            primary_metric_name = p_primary_metric_name,
            secondary_impacts = p_secondary_impacts,
            measured_at = NOW(),
            adopted_at = NOW()
        WHERE id = p_id;
    ELSE
        UPDATE public.optimization_history
        SET 
            status = 'rolled_back',
            result_metrics = p_result_metrics,
            improvement_percentage = p_improvement_percentage,
            primary_metric_name = p_primary_metric_name,
            secondary_impacts = p_secondary_impacts,
            measured_at = NOW(),
            rolled_back_at = NOW(),
            rollback_reason = 'Negative impact detected'
        WHERE id = p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get optimization history for a component
CREATE OR REPLACE FUNCTION get_optimization_history(
    p_component_name TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    parameter_name TEXT,
    old_value JSONB,
    new_value JSONB,
    improvement_percentage NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oh.id,
        oh.parameter_name,
        oh.old_value,
        oh.new_value,
        oh.improvement_percentage,
        oh.status,
        oh.created_at
    FROM public.optimization_history oh
    WHERE oh.component_name = p_component_name
    ORDER BY oh.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.optimization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access history" ON public.optimization_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access candidates" ON public.optimization_candidates
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read history" ON public.optimization_history
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON TABLE public.optimization_history IS 'Tracks parameter changes and their effects for auto-optimization';
COMMENT ON TABLE public.optimization_candidates IS 'Stores potential optimizations identified by the system';
COMMENT ON COLUMN public.optimization_history.baseline_metrics IS 'Metrics before optimization (baseline)';
COMMENT ON COLUMN public.optimization_history.result_metrics IS 'Metrics after optimization (measured after stabilization)';
