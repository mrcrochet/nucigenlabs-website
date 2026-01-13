/**
 * Event Agent Configuration
 * 
 * Centralized configuration for EventAgent thresholds and parameters
 * These are TECHNICAL thresholds, not business logic filters
 */

// Market event threshold: minimum price change percentage to consider as event
// This is a technical filter to avoid noise, not a business importance filter
export const MARKET_EVENT_THRESHOLD_PERCENT = parseFloat(
  process.env.MARKET_EVENT_THRESHOLD_PERCENT || '2.0'
);

// Tavily relevance score threshold (technical quality filter)
export const TAVILY_RELEVANCE_THRESHOLD = parseFloat(
  process.env.TAVILY_RELEVANCE_THRESHOLD || '0.3'
);

// Maximum events to extract per search (to avoid overwhelming the system)
export const MAX_EVENTS_PER_SEARCH = parseInt(
  process.env.MAX_EVENTS_PER_SEARCH || '50'
);

// Raw data retention (for audit/replay/ML)
export const STORE_RAW_DATA = process.env.STORE_RAW_DATA === 'true';
