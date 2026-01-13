/**
 * Deep Research Agent
 * 
 * Similar to ChatGPT's Deep Research feature
 * Orchestrates multiple agents in parallel to generate comprehensive analysis in seconds
 * 
 * Architecture:
 * - Parallel execution of multiple research tasks
 * - Fast synthesis of results
 * - Comprehensive analysis generation
 */

import type { AgentResponse } from '../../lib/agents/agent-interfaces';
import type { Event, Analysis } from '../../types/intelligence';
import { EventExtractionAgentImpl } from './event-agent';
import OpenAI from 'openai';
import { tavily } from '@tavily/core';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

// Initialize clients
let openaiClient: OpenAI | null = null;
let tavilyClient: ReturnType<typeof tavily> | null = null;
let supabaseClient: ReturnType<typeof createClient> | null = null;

const openaiApiKey = process.env.OPENAI_API_KEY;
const tavilyApiKey = process.env.TAVILY_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (openaiApiKey) {
  openaiClient = new OpenAI({ apiKey: openaiApiKey });
}

if (tavilyApiKey) {
  tavilyClient = tavily({ apiKey: tavilyApiKey });
}

if (supabaseUrl && supabaseServiceKey) {
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
}

export interface DeepResearchInput {
  query: string;
  focus_areas?: string[];
  time_horizon?: 'short' | 'medium' | 'long';
  max_sources?: number;
}

export interface DeepResearchResult {
  analysis: Analysis;
  events: Event[];
  sources: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
  processing_time_ms: number;
  agents_used: string[];
}

export class DeepResearchAgent {
  /**
   * Conduct deep research on a topic
   * Uses parallel agents to collect, analyze, and synthesize information quickly
   */
  async conductResearch(input: DeepResearchInput): Promise<AgentResponse<DeepResearchResult>> {
    const startTime = Date.now();
    const agentsUsed: string[] = [];

    try {
      if (!input.query || !input.query.trim()) {
        return {
          data: null,
          error: 'Query is required',
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      if (!openaiClient || !tavilyClient) {
        return {
          data: null,
          error: 'API keys not configured (OpenAI or Tavily)',
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      console.log(`[DeepResearch] Starting research on: "${input.query}"`);

      // Step 1: Parallel information collection
      const [searchResults, relatedEvents, historicalContext] = await Promise.all([
        this.collectInformation(input.query, input.max_sources || 10),
        this.findRelatedEvents(input.query),
        this.getHistoricalContext(input.query),
      ]);

      agentsUsed.push('InformationCollector', 'EventFinder', 'HistoricalContext');

      // Step 2: Parallel analysis tasks
      const [eventExtraction, trendAnalysis, impactAssessment] = await Promise.all([
        this.extractEventsFromSources(searchResults),
        this.analyzeTrends(searchResults, relatedEvents),
        this.assessImpact(relatedEvents, input.focus_areas),
      ]);

      agentsUsed.push('EventExtractor', 'TrendAnalyzer', 'ImpactAssessor');

      // Step 3: Synthesize all information into comprehensive analysis
      const analysis = await this.synthesizeAnalysis({
        query: input.query,
        searchResults,
        events: eventExtraction,
        relatedEvents,
        historicalContext,
        trends: trendAnalysis,
        impact: impactAssessment,
        time_horizon: input.time_horizon || 'medium',
      });

      agentsUsed.push('SynthesisEngine');

      const processingTime = Date.now() - startTime;
      console.log(`[DeepResearch] Research completed in ${processingTime}ms`);

      return {
        data: {
          analysis,
          events: eventExtraction,
          sources: searchResults.map((r, idx) => ({
            title: r.title || `Source ${idx + 1}`,
            url: r.url,
            relevance: r.relevance || 0.5,
          })),
          processing_time_ms: processingTime,
          agents_used: agentsUsed,
        },
        metadata: {
          processing_time_ms: processingTime,
          confidence: analysis.confidence / 100,
        },
      };
    } catch (error: any) {
      console.error('[DeepResearch] Error:', error);
      return {
        data: null,
        error: error.message || 'Failed to conduct research',
        metadata: {
          processing_time_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Collect information from multiple sources in parallel
   */
  private async collectInformation(query: string, maxSources: number) {
    if (!tavilyClient) throw new Error('Tavily client not initialized');

    // Use Tavily to search for relevant information
    const searchResults = await tavilyClient.search(query, {
      maxResults: maxSources,
      searchDepth: 'advanced', // Deep search mode
      includeAnswer: true,
      includeRawContent: true,
    });

    return (searchResults.results || []).map((result: any) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      relevance: result.score || 0.5,
      published_at: result.published_date || new Date().toISOString(),
    }));
  }

  /**
   * Find related events from database
   */
  private async findRelatedEvents(query: string): Promise<Event[]> {
    if (!supabaseClient) return [];

    try {
      // Search for events related to the query
      const { data } = await supabaseClient.rpc('search_nucigen_events', {
        search_query: query,
        sector_filter: null,
        region_filter: null,
        event_type_filter: null,
        time_horizon_filter: null,
        limit_count: 10,
        offset_count: 0,
      });

      // Convert to Event format (simplified - would need proper adapter)
      return (data || []).slice(0, 5).map((e: any) => ({
        id: e.id,
        type: 'event' as const,
        scope: e.region ? 'regional' : 'global',
        confidence: Math.round((e.confidence || 0) * 100),
        impact: Math.round((e.impact_score || 0) * 100),
        horizon: 'medium' as const,
        source_count: 1,
        last_updated: e.created_at,
        event_id: e.id,
        headline: e.summary,
        description: e.summary,
        date: e.created_at,
        location: e.country || e.region || null,
        actors: e.actors || [],
        sectors: e.sector ? [e.sector] : [],
        sources: [],
      }));
    } catch (error) {
      console.error('[DeepResearch] Error finding related events:', error);
      return [];
    }
  }

  /**
   * Get historical context for the query
   */
  private async getHistoricalContext(query: string): Promise<string> {
    if (!tavilyClient || !openaiClient) return '';

    try {
      // Search for historical information
      const historicalQuery = `historical context background ${query}`;
      const searchResults = await tavilyClient.search(historicalQuery, {
        maxResults: 5,
        searchDepth: 'basic',
        includeAnswer: false,
        includeRawContent: true,
      });

      const historicalContent = (searchResults.results || [])
        .map((r: any) => r.content)
        .join('\n\n')
        .substring(0, 5000);

      // Summarize historical context
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a historical context analyzer. Provide a concise 2-3 sentence summary of historical context.',
          },
          {
            role: 'user',
            content: `Summarize the historical context for: ${query}\n\nInformation:\n${historicalContent}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('[DeepResearch] Error getting historical context:', error);
      return '';
    }
  }

  /**
   * Extract events from search results in parallel
   */
  private async extractEventsFromSources(searchResults: any[]): Promise<Event[]> {
    if (!openaiClient) return [];

    const eventAgent = new EventExtractionAgentImpl();
    const extractionPromises = searchResults.slice(0, 5).map((result) =>
      eventAgent.extractEvent({
        raw_content: result.content || '',
        source: {
          name: result.title || 'Unknown',
          url: result.url || '',
          published_at: result.published_at || new Date().toISOString(),
        },
      }).catch(() => null)
    );

    const results = await Promise.all(extractionPromises);
    return results.filter((r): r is Event => r !== null && r.data !== null).map((r) => r.data!);
  }

  /**
   * Analyze trends from search results and events
   */
  private async analyzeTrends(searchResults: any[], events: Event[]): Promise<string[]> {
    if (!openaiClient) return [];

    try {
      const content = searchResults
        .map((r) => r.content)
        .join('\n\n')
        .substring(0, 8000);

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a trend analyzer. Identify 3-5 key trends from the information provided. Return as a JSON array of strings.',
          },
          {
            role: 'user',
            content: `Analyze trends for: ${searchResults[0]?.title || 'topic'}\n\nInformation:\n${content}\n\nEvents: ${events.length}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.5,
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return response.trends || [];
    } catch (error) {
      console.error('[DeepResearch] Error analyzing trends:', error);
      return [];
    }
  }

  /**
   * Assess impact of events
   */
  private async assessImpact(events: Event[], focusAreas?: string[]): Promise<string[]> {
    if (!openaiClient || events.length === 0) return [];

    try {
      const eventsSummary = events
        .map((e) => `${e.headline}: ${e.description}`)
        .join('\n')
        .substring(0, 3000);

      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an impact assessor. Identify 3-5 key implications from the events. Return as a JSON array of strings.',
          },
          {
            role: 'user',
            content: `Assess impact${focusAreas ? ` for: ${focusAreas.join(', ')}` : ''}\n\nEvents:\n${eventsSummary}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500,
        temperature: 0.5,
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return response.implications || [];
    } catch (error) {
      console.error('[DeepResearch] Error assessing impact:', error);
      return [];
    }
  }

  /**
   * Synthesize all information into comprehensive analysis
   */
  private async synthesizeAnalysis(input: {
    query: string;
    searchResults: any[];
    events: Event[];
    relatedEvents: Event[];
    historicalContext: string;
    trends: string[];
    impact: string[];
    time_horizon: 'short' | 'medium' | 'long';
  }): Promise<Analysis> {
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized');
    }

    const allContent = input.searchResults
      .map((r) => r.content)
      .join('\n\n')
      .substring(0, 12000);

    const eventsSummary = [...input.events, ...input.relatedEvents]
      .map((e) => `- ${e.headline}`)
      .join('\n')
      .substring(0, 2000);

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a deep research analyst. Generate a comprehensive analysis that synthesizes all available information.

CRITICAL RULES:
1. Executive summary must be 3-5 sentences, clear and actionable
2. Key trends must be 3-5 specific, data-driven trends
3. Implications must be 3-5 concrete implications for decision-makers
4. Be factual, analytical, and strategic
5. Focus on ${input.time_horizon}-term perspective

Return ONLY valid JSON matching this schema:
{
  "title": "string (max 100 chars)",
  "executive_summary": "string (3-5 sentences)",
  "key_trends": ["string", "string", ...],
  "implications": ["string", "string", ...]
}`,
        },
        {
          role: 'user',
          content: `Generate comprehensive analysis for: ${input.query}

Historical Context:
${input.historicalContext}

Key Trends Identified:
${input.trends.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Impact Assessment:
${input.impact.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

Related Events:
${eventsSummary}

Source Information:
${allContent.substring(0, 10000)}

Generate the analysis now.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Calculate confidence based on sources and events
    const sourceCount = input.searchResults.length;
    const eventCount = input.events.length + input.relatedEvents.length;
    const confidence = Math.min(100, Math.round((sourceCount * 10 + eventCount * 15)));

    return {
      id: `analysis-${Date.now()}`,
      type: 'analysis',
      scope: 'global',
      confidence,
      impact: Math.round((input.impact.length / 5) * 100),
      horizon: input.time_horizon,
      source_count: sourceCount + eventCount,
      last_updated: new Date().toISOString(),
      title: response.title || `Analysis: ${input.query}`,
      executive_summary: response.executive_summary || '',
      key_trends: response.key_trends || input.trends,
      implications: response.implications || input.impact,
      time_horizon: input.time_horizon,
      referenced_event_ids: [...input.events, ...input.relatedEvents].map((e) => e.id),
    };
  }
}

// Export singleton instance
export const deepResearchAgent = new DeepResearchAgent();
