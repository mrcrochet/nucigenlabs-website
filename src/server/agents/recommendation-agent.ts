/**
 * Recommendation Agent
 * 
 * REAL AGENT IMPLEMENTATION (STUB - To be implemented)
 * 
 * Responsibilities:
 * - Generate recommendations based on signals and events
 * - Uses ONLY Signal[] + Event[] (never calls external APIs)
 * - Returns Recommendation[] (UI contract)
 * 
 * CRITICAL RULES:
 * 1. NEVER calls Tavily, Firecrawl, or any external API
 * 2. ONLY consumes Signal[] and Event[] from other agents
 * 3. Does NOT extract events - that's EventAgent's job
 * 4. Does NOT synthesize signals - that's SignalAgent's job
 * 5. ONLY generates actionable recommendations
 * 
 * Input: Signal[] + Event[]
 * Output: Recommendation[]
 * 
 * @todo Implement generateRecommendations() method
 */

import type {
  RecommendationAgent,
  RecommendationAgentInput,
  AgentResponse,
} from '../../lib/agents/agent-interfaces';
import type { Recommendation } from '../../types/intelligence';

export class RecommendationAgentImpl implements RecommendationAgent {
  /**
   * Generate recommendations based on signals and events
   * Returns empty array if no signals exist
   */
  async generateRecommendations(input: RecommendationAgentInput): Promise<AgentResponse<Recommendation[]>> {
    // TODO: Implement recommendation generation logic
    // Rules:
    // - Use ONLY input.signals and input.events
    // - Do NOT call any external APIs
    // - Return Recommendation[] only
    
    return {
      data: [],
      error: 'Not yet implemented',
      metadata: {
        processing_time_ms: 0,
      },
    };
  }
}

// Export singleton instance
export const recommendationAgent = new RecommendationAgentImpl();
