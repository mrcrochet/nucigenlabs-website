-- ML Models Table
-- Stores versioned ML models (weights, metadata, performance metrics)
-- Supports both small models (stored in JSONB) and large models (metadata only, actual model in S3)

CREATE TABLE IF NOT EXISTS public.ml_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Model identification
    model_name TEXT NOT NULL, -- e.g., 'relevance_predictor', 'query_optimizer'
    model_type TEXT NOT NULL CHECK (model_type IN ('classification', 'regression', 'clustering', 'rl_policy')),
    algorithm TEXT NOT NULL, -- e.g., 'random_forest', 'xgboost', 'neural_network', 'q_learning'
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Model data
    model_data JSONB, -- For small models: full model weights/parameters in JSONB
    model_storage_url TEXT, -- For large models: URL to S3/storage (optional)
    model_size_bytes INTEGER, -- Size of model in bytes
    
    -- Training metadata
    training_data_hash TEXT, -- Hash of training data for reproducibility
    training_samples_count INTEGER, -- Number of samples used for training
    training_date TIMESTAMPTZ DEFAULT NOW(),
    training_duration_seconds INTEGER, -- Time taken to train
    
    -- Performance metrics
    accuracy NUMERIC(5, 4), -- For classification: accuracy (0-1)
    precision_score NUMERIC(5, 4), -- For classification: precision
    recall_score NUMERIC(5, 4), -- For classification: recall
    f1_score NUMERIC(5, 4), -- For classification: F1 score
    mse NUMERIC(10, 6), -- For regression: Mean Squared Error
    r2_score NUMERIC(5, 4), -- For regression: R² score
    cross_validation_score NUMERIC(5, 4), -- Cross-validation score
    
    -- Feature information
    feature_names TEXT[], -- List of feature names used by model
    feature_importance JSONB, -- Feature importance scores (if available)
    
    -- Model configuration
    hyperparameters JSONB, -- Model hyperparameters (max_depth, learning_rate, etc.)
    preprocessing_config JSONB, -- Preprocessing steps (scaling, encoding, etc.)
    
    -- Status
    is_active BOOLEAN DEFAULT false, -- Only one active model per model_name
    is_production BOOLEAN DEFAULT false, -- Production-ready model
    
    -- Metadata
    description TEXT,
    created_by TEXT, -- User/system that created the model
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ml_models_name_version ON public.ml_models(model_name, version);
CREATE INDEX IF NOT EXISTS idx_ml_models_active ON public.ml_models(model_name, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ml_models_production ON public.ml_models(model_name, is_production) WHERE is_production = true;
CREATE INDEX IF NOT EXISTS idx_ml_models_training_date ON public.ml_models(training_date DESC);

-- Unique constraint: only one active model per model_name
CREATE UNIQUE INDEX IF NOT EXISTS idx_ml_models_unique_active 
    ON public.ml_models(model_name) 
    WHERE is_active = true;

-- Function to deactivate old model when activating new one
CREATE OR REPLACE FUNCTION deactivate_old_ml_model()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE public.ml_models
        SET is_active = false
        WHERE model_name = NEW.model_name
        AND id != NEW.id
        AND is_active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active model per name
CREATE TRIGGER trigger_deactivate_old_ml_model
    BEFORE INSERT OR UPDATE ON public.ml_models
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE FUNCTION deactivate_old_ml_model();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_ml_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ml_models_updated_at
    BEFORE UPDATE ON public.ml_models
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_models_updated_at();

-- Function to get active model
CREATE OR REPLACE FUNCTION get_active_ml_model(p_model_name TEXT)
RETURNS TABLE (
    id UUID,
    model_name TEXT,
    model_type TEXT,
    algorithm TEXT,
    version INTEGER,
    model_data JSONB,
    model_storage_url TEXT,
    feature_names TEXT[],
    hyperparameters JSONB,
    preprocessing_config JSONB,
    accuracy NUMERIC,
    f1_score NUMERIC,
    r2_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.model_name,
        m.model_type,
        m.algorithm,
        m.version,
        m.model_data,
        m.model_storage_url,
        m.feature_names,
        m.hyperparameters,
        m.preprocessing_config,
        m.accuracy,
        m.f1_score,
        m.r2_score
    FROM public.ml_models m
    WHERE m.model_name = p_model_name
    AND m.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.ml_models
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read models" ON public.ml_models
    FOR SELECT
    TO authenticated
    USING (true);

COMMENT ON TABLE public.ml_models IS 'Stores versioned ML models with performance metrics and metadata';
COMMENT ON COLUMN public.ml_models.model_data IS 'Full model weights/parameters for small models (JSONB)';
COMMENT ON COLUMN public.ml_models.model_storage_url IS 'URL to external storage (S3) for large models';
COMMENT ON COLUMN public.ml_models.feature_importance IS 'Feature importance scores for interpretability';
