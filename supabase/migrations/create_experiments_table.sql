-- Experiments Table (A/B Testing)
-- Manages A/B tests and experiments for continuous optimization
-- Tracks variants, metrics, and statistical significance

CREATE TABLE IF NOT EXISTS public.experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Experiment identification
    experiment_name TEXT NOT NULL,
    experiment_type TEXT NOT NULL CHECK (experiment_type IN (
        'prompt_variant',      -- Testing different prompts
        'model_variant',       -- Testing different models
        'parameter_variant',  -- Testing different parameters
        'algorithm_variant',  -- Testing different algorithms
        'ui_variant',         -- Testing different UI/UX
        'recommendation_variant' -- Testing different recommendation strategies
    )),
    
    -- Experiment configuration
    description TEXT,
    hypothesis TEXT, -- What we're testing
    success_metric TEXT NOT NULL, -- Primary metric to measure (e.g., 'click_rate', 'engagement_score')
    secondary_metrics TEXT[], -- Additional metrics to track
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    target_sample_size INTEGER, -- Target number of users/events to test
    
    -- Variants configuration
    variants JSONB NOT NULL, -- Array of variant configurations
    -- Example: [{"name": "control", "config": {...}}, {"name": "variant_a", "config": {...}}]
    
    -- Traffic allocation
    traffic_allocation NUMERIC(3, 2) DEFAULT 1.0, -- Percentage of traffic (0-1)
    variant_allocation JSONB, -- How traffic is split between variants
    -- Example: {"control": 0.5, "variant_a": 0.5}
    
    -- Results
    results JSONB, -- Aggregated results per variant
    statistical_significance NUMERIC(5, 4), -- P-value or confidence level
    winner_variant TEXT, -- Which variant won (if determined)
    improvement_percentage NUMERIC(5, 2), -- Improvement of winner vs control
    
    -- Metadata
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variant Assignments Table
-- Tracks which users/events are assigned to which variant
CREATE TABLE IF NOT EXISTS public.experiment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Experiment and entity
    experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'event', 'query')),
    entity_id TEXT NOT NULL, -- user_id, event_id, or query hash
    
    -- Variant assignment
    variant_name TEXT NOT NULL, -- Name of variant assigned
    
    -- Assignment metadata
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assignment_method TEXT DEFAULT 'random' CHECK (assignment_method IN ('random', 'hash_based', 'manual')),
    assignment_hash TEXT, -- Hash used for consistent assignment
    
    -- Metadata
    metadata JSONB
);

-- Experiment Metrics Table
-- Tracks metrics for each variant over time
CREATE TABLE IF NOT EXISTS public.experiment_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Experiment and variant
    experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    
    -- Time window
    time_window_start TIMESTAMPTZ NOT NULL,
    time_window_end TIMESTAMPTZ NOT NULL,
    
    -- Metrics
    sample_size INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    success_rate NUMERIC(5, 4) DEFAULT 0, -- Primary success metric rate
    
    -- Secondary metrics (stored as JSONB for flexibility)
    secondary_metrics JSONB, -- e.g., {"avg_engagement": 0.75, "click_rate": 0.12}
    
    -- Statistical metrics
    mean_value NUMERIC(10, 6),
    std_deviation NUMERIC(10, 6),
    confidence_interval_lower NUMERIC(10, 6),
    confidence_interval_upper NUMERIC(10, 6),
    
    -- Metadata
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_experiments_status ON public.experiments(status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiments_name ON public.experiments(experiment_name);
CREATE INDEX IF NOT EXISTS idx_experiments_active ON public.experiments(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_exp_entity 
    ON public.experiment_assignments(experiment_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_variant 
    ON public.experiment_assignments(experiment_id, variant_name);

CREATE INDEX IF NOT EXISTS idx_experiment_metrics_exp_variant 
    ON public.experiment_metrics(experiment_id, variant_name, time_window_start DESC);

-- Function to get variant for an entity
CREATE OR REPLACE FUNCTION get_experiment_variant(
    p_experiment_name TEXT,
    p_entity_type TEXT,
    p_entity_id TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_variant TEXT;
    v_experiment_id UUID;
    v_hash TEXT;
BEGIN
    -- Get active experiment
    SELECT id INTO v_experiment_id
    FROM public.experiments
    WHERE experiment_name = p_experiment_name
    AND status = 'active'
    LIMIT 1;
    
    IF v_experiment_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Check if already assigned
    SELECT variant_name INTO v_variant
    FROM public.experiment_assignments
    WHERE experiment_id = v_experiment_id
    AND entity_type = p_entity_type
    AND entity_id = p_entity_id
    LIMIT 1;
    
    IF v_variant IS NOT NULL THEN
        RETURN v_variant;
    END IF;
    
    -- Assign based on hash (consistent assignment)
    v_hash := encode(digest(p_entity_id || v_experiment_id::text, 'sha256'), 'hex');
    
    -- Get variant allocation from experiment
    SELECT 
        CASE 
            WHEN (('x' || substring(v_hash, 1, 8))::bit(32)::bigint % 100) < 50 THEN 'control'
            ELSE 'variant_a'
        END
    INTO v_variant
    FROM public.experiments
    WHERE id = v_experiment_id;
    
    -- Record assignment
    INSERT INTO public.experiment_assignments (
        experiment_id,
        entity_type,
        entity_id,
        variant_name,
        assignment_method,
        assignment_hash
    ) VALUES (
        v_experiment_id,
        p_entity_type,
        p_entity_id,
        v_variant,
        'hash_based',
        v_hash
    );
    
    RETURN v_variant;
END;
$$ LANGUAGE plpgsql;

-- Function to record experiment metric
CREATE OR REPLACE FUNCTION record_experiment_metric(
    p_experiment_id UUID,
    p_variant_name TEXT,
    p_metric_name TEXT,
    p_value NUMERIC,
    p_time_window_start TIMESTAMPTZ,
    p_time_window_end TIMESTAMPTZ
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.experiment_metrics (
        experiment_id,
        variant_name,
        time_window_start,
        time_window_end,
        mean_value
    ) VALUES (
        p_experiment_id,
        p_variant_name,
        p_time_window_start,
        p_time_window_end,
        p_value
    )
    ON CONFLICT DO NOTHING; -- Avoid duplicates
END;
$$ LANGUAGE plpgsql;

-- Function to calculate experiment results
CREATE OR REPLACE FUNCTION calculate_experiment_results(p_experiment_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_results JSONB;
    v_control_metrics RECORD;
    v_variant_metrics RECORD;
BEGIN
    -- Get control metrics
    SELECT 
        AVG(success_rate) as avg_success_rate,
        COUNT(*) as sample_size,
        AVG(mean_value) as avg_mean
    INTO v_control_metrics
    FROM public.experiment_metrics
    WHERE experiment_id = p_experiment_id
    AND variant_name = 'control';
    
    -- Get variant metrics
    SELECT 
        AVG(success_rate) as avg_success_rate,
        COUNT(*) as sample_size,
        AVG(mean_value) as avg_mean
    INTO v_variant_metrics
    FROM public.experiment_metrics
    WHERE experiment_id = p_experiment_id
    AND variant_name != 'control'
    LIMIT 1;
    
    -- Calculate improvement
    v_results := jsonb_build_object(
        'control', jsonb_build_object(
            'avg_success_rate', v_control_metrics.avg_success_rate,
            'sample_size', v_control_metrics.sample_size,
            'avg_mean', v_control_metrics.avg_mean
        ),
        'variant', jsonb_build_object(
            'avg_success_rate', v_variant_metrics.avg_success_rate,
            'sample_size', v_variant_metrics.sample_size,
            'avg_mean', v_variant_metrics.avg_mean
        ),
        'improvement', CASE 
            WHEN v_control_metrics.avg_success_rate > 0 THEN
                ((v_variant_metrics.avg_success_rate - v_control_metrics.avg_success_rate) / v_control_metrics.avg_success_rate * 100)
            ELSE 0
        END
    );
    
    RETURN v_results;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_experiments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_experiments_updated_at
    BEFORE UPDATE ON public.experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_experiments_updated_at();

-- RLS Policies
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access experiments" ON public.experiments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access assignments" ON public.experiment_assignments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access metrics" ON public.experiment_metrics
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read experiments" ON public.experiments
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON TABLE public.experiments IS 'A/B testing experiments for continuous optimization';
COMMENT ON TABLE public.experiment_assignments IS 'Tracks which entities are assigned to which experiment variants';
COMMENT ON TABLE public.experiment_metrics IS 'Tracks metrics for each variant over time';
