-- Prediction History Table
-- Tracks scenario probability changes over time

CREATE TABLE IF NOT EXISTS public.prediction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event reference
    event_id TEXT NOT NULL,
    
    -- Prediction snapshot
    prediction_json JSONB NOT NULL,
    
    -- Timestamp
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    tier TEXT DEFAULT 'standard',
    confidence_score NUMERIC(3, 2),
    evidence_count INTEGER DEFAULT 0,
    
    -- Indexes
    CONSTRAINT prediction_history_event_id_fkey FOREIGN KEY (event_id) 
        REFERENCES public.event_predictions(event_id) ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_prediction_history_event_id ON public.prediction_history(event_id);
CREATE INDEX IF NOT EXISTS idx_prediction_history_recorded_at ON public.prediction_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_history_event_recorded ON public.prediction_history(event_id, recorded_at DESC);

-- RLS Policies
ALTER TABLE public.prediction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read prediction history"
    ON public.prediction_history
    FOR SELECT
    USING (true);

CREATE POLICY "Service can manage prediction history"
    ON public.prediction_history
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to automatically record prediction history
CREATE OR REPLACE FUNCTION record_prediction_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only record if prediction_json changed
    IF OLD.prediction_json IS DISTINCT FROM NEW.prediction_json THEN
        INSERT INTO public.prediction_history (
            event_id,
            prediction_json,
            tier,
            confidence_score,
            evidence_count
        ) VALUES (
            NEW.event_id,
            NEW.prediction_json,
            NEW.tier,
            NEW.confidence_score,
            NEW.evidence_count
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-record history on prediction updates
CREATE TRIGGER trigger_record_prediction_history
    AFTER UPDATE ON public.event_predictions
    FOR EACH ROW
    EXECUTE FUNCTION record_prediction_history();

COMMENT ON TABLE public.prediction_history IS 'Tracks scenario probability changes over time for trend analysis';
COMMENT ON COLUMN public.prediction_history.prediction_json IS 'Full prediction snapshot at this point in time';
