-- ============================================
-- Add Trade Impact to Market Signals
-- ============================================

-- Add trade_impact column to market_signals table
ALTER TABLE public.market_signals
ADD COLUMN IF NOT EXISTS trade_impact JSONB DEFAULT NULL;

-- Add index for trade_impact queries
CREATE INDEX IF NOT EXISTS idx_market_signals_trade_impact 
ON public.market_signals USING GIN(trade_impact);

-- Add comment
COMMENT ON COLUMN public.market_signals.trade_impact IS 'Trade impact data from UN Comtrade analysis (JSONB)';
