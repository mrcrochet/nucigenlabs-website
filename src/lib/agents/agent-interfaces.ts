/**
 * Agent Interfaces
 * 
 * Each agent has a single responsibility and produces one type of output
 * Following the UI contract strictly
 */

import type {
  Signal,
  Event,
  Recommendation,
  Alert,
  Analysis,
  Metric,
} from '../../types/intelligence';

// ============================================
// BASE AGENT INTERFACE
// ============================================

export interface AgentConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface AgentResponse<T> {
  data: T | null;
  error?: string;
  metadata?: {
    processing_time_ms: number;
    tokens_used?: number;
    confidence?: number;
  };
}

// ============================================
// 1. INTELLIGENCE SIGNAL AGENT
// ============================================

export interface SignalAgentInput {
  events: Event[];
  user_preferences?: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
    preferred_event_types?: string[];
  };
}

export interface SignalAgent {
  /**
   * Synthesize multiple events into a single signal
   * Returns null if fewer than 2 related events exist
   */
  generateSignal(input: SignalAgentInput): Promise<AgentResponse<Signal>>;
  
  /**
   * Generate multiple signals from a batch of events
   */
  generateSignals(input: SignalAgentInput): Promise<AgentResponse<Signal[]>>;
}

// ============================================
// 2. EVENT EXTRACTION AGENT
// ============================================

export interface EventExtractionInput {
  raw_content: string;
  source: {
    name: string;
    url: string;
    published_at: string;
  };
  metadata?: {
    title?: string;
    author?: string;
    language?: string;
  };
}

export interface EventExtractionAgent {
  /**
   * Extract a structured event from raw content
   * Returns null if information is ambiguous or unverified
   */
  extractEvent(input: EventExtractionInput): Promise<AgentResponse<Event>>;
  
  /**
   * Extract multiple events from a batch of content
   */
  extractEvents(inputs: EventExtractionInput[]): Promise<AgentResponse<Event[]>>;
}

// ============================================
// 3. RECOMMENDATION AGENT
// ============================================

export interface RecommendationAgentInput {
  signals: Signal[];
  events: Event[];
  user_context?: {
    role?: string;
    company?: string;
    sector?: string;
  };
}

export interface RecommendationAgent {
  /**
   * Generate recommendations based on signals and events
   * Returns empty array if no signals exist
   */
  generateRecommendations(input: RecommendationAgentInput): Promise<AgentResponse<Recommendation[]>>;
}

// ============================================
// 4. ALERT DETECTION AGENT
// ============================================

export interface AlertDetectionInput {
  signals: Signal[];
  thresholds: {
    impact_threshold?: number; // 0-100
    confidence_threshold?: number; // 0-100
    severity_level?: 'moderate' | 'high' | 'critical';
  };
}

export interface AlertDetectionAgent {
  /**
   * Detect alerts when thresholds are exceeded
   * Returns null if no threshold is exceeded
   */
  detectAlerts(input: AlertDetectionInput): Promise<AgentResponse<Alert[]>>;
}

// ============================================
// 5. RESEARCH & ANALYSIS AGENT
// ============================================

export interface ResearchAgentInput {
  events: Event[];
  signals?: Signal[];
  topic?: string;
  time_horizon: 'medium' | 'long';
}

export interface ResearchAgent {
  /**
   * Generate long-form analysis from multiple events
   */
  generateAnalysis(input: ResearchAgentInput): Promise<AgentResponse<Analysis>>;
  
  /**
   * Generate multiple analyses for different topics
   */
  generateAnalyses(inputs: ResearchAgentInput[]): Promise<AgentResponse<Analysis[]>>;
}

// ============================================
// 6. QUALITY & VALIDATION AGENT
// ============================================

export interface QualityAgentInput {
  pipeline_logs: {
    events_processed: number;
    signals_generated: number;
    recommendations_active: number;
    alerts_triggered: number;
    errors: number;
    latency_ms: number[];
  };
  time_window: {
    start: string; // ISO-8601
    end: string; // ISO-8601
  };
}

export interface QualityAgent {
  /**
   * Assess system quality and reliability
   */
  assessQuality(input: QualityAgentInput): Promise<AgentResponse<Metric>>;
}
