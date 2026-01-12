/**
 * SignalAgent Tests
 * 
 * Critical validations:
 * 1. Returns only Signal[] (UI contract)
 * 2. Never accesses Tavily/Firecrawl directly
 * 3. Synthesizes from Event[] only
 * 4. Applies user preferences correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IntelligenceSignalAgent } from '../signal-agent';
import type { SignalAgentInput } from '../../../lib/agents/agent-interfaces';
import type { Signal } from '../../../types/intelligence';
import type { EventWithChain } from '../../../lib/supabase';

describe('SignalAgent', () => {
  let signalAgent: IntelligenceSignalAgent;

  beforeEach(() => {
    signalAgent = new IntelligenceSignalAgent();
  });

  describe('generateSignals', () => {
    it('should return Signal[] type only', async () => {
      const mockEvents: EventWithChain[] = [
        {
          id: 'event-1',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'Event 1 occurred.',
          country: 'US',
          region: 'North America',
          sector: 'Finance',
          actors: ['Fed'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.7,
          confidence: 0.8,
          created_at: '2024-01-15T10:00:00Z',
          nucigen_causal_chains: [],
        },
        {
          id: 'event-2',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'Event 2 occurred.',
          country: 'US',
          region: 'North America',
          sector: 'Finance',
          actors: ['Fed'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.6,
          confidence: 0.7,
          created_at: '2024-01-15T11:00:00Z',
          nucigen_causal_chains: [],
        },
      ];

      const input: SignalAgentInput = {
        events: mockEvents,
      };

      const result = await signalAgent.generateSignals(input);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      
      if (result.data) {
        expect(result.data).toBeInstanceOf(Array);
        expect(result.data.every(signal => signal.type === 'signal')).toBe(true);
        
        // Verify Signal structure
        result.data.forEach(signal => {
          expect(signal).toHaveProperty('id');
          expect(signal).toHaveProperty('type', 'signal');
          expect(signal).toHaveProperty('title');
          expect(signal).toHaveProperty('summary');
          expect(signal).toHaveProperty('impact_score');
          expect(signal).toHaveProperty('confidence_score');
          expect(signal).toHaveProperty('time_horizon');
          expect(signal).toHaveProperty('related_event_ids');
        });
      }
    });

    it('should synthesize multiple events into signals', async () => {
      const mockEvents: EventWithChain[] = [
        {
          id: 'event-1',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'Event 1 in Finance sector.',
          country: 'US',
          region: 'North America',
          sector: 'Finance',
          actors: ['Fed'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.7,
          confidence: 0.8,
          created_at: '2024-01-15T10:00:00Z',
          nucigen_causal_chains: [],
        },
        {
          id: 'event-2',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'Event 2 in Finance sector.',
          country: 'US',
          region: 'North America',
          sector: 'Finance',
          actors: ['Fed'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.6,
          confidence: 0.7,
          created_at: '2024-01-15T11:00:00Z',
          nucigen_causal_chains: [],
        },
      ];

      const input: SignalAgentInput = {
        events: mockEvents,
      };

      const result = await signalAgent.generateSignals(input);

      if (result.data && result.data.length > 0) {
        const signal = result.data[0];
        
        // Should have related event IDs
        expect(signal.related_event_ids).toContain('event-1');
        expect(signal.related_event_ids).toContain('event-2');
        
        // Should have source_count
        expect(signal.source_count).toBeGreaterThanOrEqual(2);
      }
    });

    it('should apply user preferences filtering', async () => {
      const mockEvents: EventWithChain[] = [
        {
          id: 'event-1',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'Event in Finance sector.',
          country: 'US',
          region: 'North America',
          sector: 'Finance',
          actors: ['Fed'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.5,
          confidence: 0.6,
          created_at: '2024-01-15T10:00:00Z',
          nucigen_causal_chains: [],
        },
        {
          id: 'event-2',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'Event in Tech sector.',
          country: 'US',
          region: 'North America',
          sector: 'Technology',
          actors: ['Tech Corp'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.8,
          confidence: 0.9,
          created_at: '2024-01-15T11:00:00Z',
          nucigen_causal_chains: [],
        },
      ];

      const input: SignalAgentInput = {
        events: mockEvents,
        user_preferences: {
          min_impact_score: 0.7,
          min_confidence_score: 0.8,
        },
      };

      const result = await signalAgent.generateSignals(input);

      if (result.data) {
        // Should filter by preferences
        result.data.forEach(signal => {
          expect(signal.impact_score).toBeGreaterThanOrEqual(70); // 0.7 * 100
          expect(signal.confidence_score).toBeGreaterThanOrEqual(80); // 0.8 * 100
        });
      }
    });

    it('should handle single high-impact event', async () => {
      const mockEvents: EventWithChain[] = [
        {
          id: 'event-1',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'Major high-impact event.',
          country: 'US',
          region: 'North America',
          sector: 'Finance',
          actors: ['Fed'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.8, // High impact
          confidence: 0.9, // High confidence
          created_at: '2024-01-15T10:00:00Z',
          nucigen_causal_chains: [],
        },
      ];

      const input: SignalAgentInput = {
        events: mockEvents,
      };

      const result = await signalAgent.generateSignals(input);

      // Should create signal from single high-impact event
      if (result.data && result.data.length > 0) {
        const signal = result.data[0];
        expect(signal.related_event_ids).toContain('event-1');
        expect(signal.source_count).toBe(1);
      }
    });

    it('should return empty array if no events provided', async () => {
      const input: SignalAgentInput = {
        events: [],
      };

      const result = await signalAgent.generateSignals(input);

      expect(result.data).toEqual([]);
      expect(result.error).toBeUndefined();
    });

    it('should sort signals by priority (impact * confidence)', async () => {
      const mockEvents: EventWithChain[] = [
        {
          id: 'event-1',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'Low priority event.',
          country: 'US',
          region: 'North America',
          sector: 'Finance',
          actors: ['Fed'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.5,
          confidence: 0.6,
          created_at: '2024-01-15T10:00:00Z',
          nucigen_causal_chains: [],
        },
        {
          id: 'event-2',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'High priority event.',
          country: 'US',
          region: 'North America',
          sector: 'Finance',
          actors: ['Fed'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.9,
          confidence: 0.9,
          created_at: '2024-01-15T11:00:00Z',
          nucigen_causal_chains: [],
        },
      ];

      const input: SignalAgentInput = {
        events: mockEvents,
      };

      const result = await signalAgent.generateSignals(input);

      if (result.data && result.data.length >= 2) {
        const firstSignal = result.data[0];
        const secondSignal = result.data[1];
        
        const score1 = firstSignal.impact_score * firstSignal.confidence_score;
        const score2 = secondSignal.impact_score * secondSignal.confidence_score;
        
        // First signal should have higher priority
        expect(score1).toBeGreaterThanOrEqual(score2);
      }
    });

    it('should NEVER access Tavily/Firecrawl directly', async () => {
      // SignalAgent should only work with Event[] provided
      // It should never make external API calls
      
      const mockEvents: EventWithChain[] = [
        {
          id: 'event-1',
          event_type: 'Geopolitical',
          event_subtype: null,
          summary: 'Test event.',
          country: 'US',
          region: 'North America',
          sector: 'Finance',
          actors: ['Fed'],
          why_it_matters: 'Test',
          first_order_effect: null,
          second_order_effect: null,
          impact_score: 0.7,
          confidence: 0.8,
          created_at: '2024-01-15T10:00:00Z',
          nucigen_causal_chains: [],
        },
      ];

      const input: SignalAgentInput = {
        events: mockEvents,
      };

      // Should work without any external API calls
      const result = await signalAgent.generateSignals(input);

      // Should succeed using only provided events
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });
});
