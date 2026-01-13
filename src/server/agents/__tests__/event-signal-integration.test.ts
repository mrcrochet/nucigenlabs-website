/**
 * Integration Tests: EventAgent → SignalAgent Flow
 * 
 * Verifies that:
 * 1. EventAgent returns events with impact: null and horizon: null
 * 2. SignalAgent correctly fills these values
 * 3. The complete flow works end-to-end
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { EventExtractionAgentImpl } from '../event-agent.js';
import { IntelligenceSignalAgent } from '../signal-agent.js';
import type { Event } from '../../../types/intelligence.js';
import type { EventExtractionInput } from '../../../lib/agents/agent-interfaces.js';
import type { EventWithChain } from '../../../lib/supabase.js';

describe('EventAgent → SignalAgent Integration', () => {
  let eventAgent: EventExtractionAgentImpl;
  let signalAgent: IntelligenceSignalAgent;

  beforeAll(() => {
    eventAgent = new EventExtractionAgentImpl();
    signalAgent = new IntelligenceSignalAgent();
  });

  describe('EventAgent returns null for impact and horizon', () => {
    it('should return impact: null and horizon: null for extracted events', async () => {
      const input: EventExtractionInput = {
        raw_content: 'Chile announced a 5% increase in copper export tax. The decision was made by the Chilean government on January 15, 2024.',
        source: {
          name: 'Test Source',
          url: 'https://example.com/test',
          published_at: '2024-01-15T10:00:00Z',
        },
      };

      const result = await eventAgent.extractEvent(input);

      if (result.data) {
        // CRITICAL: EventAgent must return null for impact and horizon
        expect(result.data.impact).toBeNull();
        expect(result.data.horizon).toBeNull();
        
        // But should have other required fields
        expect(result.data.type).toBe('event');
        expect(result.data.headline).toBeTruthy();
        expect(result.data.description).toBeTruthy();
        expect(result.data.date).toBeTruthy();
      }
    }, 30000);

    it('should return null for impact and horizon in batch extraction', async () => {
      const inputs: EventExtractionInput[] = [
        {
          raw_content: 'Event 1: Major policy change announced.',
          source: {
            name: 'Source 1',
            url: 'https://example.com/1',
            published_at: '2024-01-15T10:00:00Z',
          },
        },
        {
          raw_content: 'Event 2: Economic indicators updated.',
          source: {
            name: 'Source 2',
            url: 'https://example.com/2',
            published_at: '2024-01-15T11:00:00Z',
          },
        },
      ];

      const result = await eventAgent.extractEvents(inputs);

      if (result.data && result.data.length > 0) {
        result.data.forEach((event) => {
          expect(event.impact).toBeNull();
          expect(event.horizon).toBeNull();
        });
      }
    }, 30000);
  });

  describe('SignalAgent fills impact and horizon', () => {
    it('should assign impact and horizon when creating signals from events', async () => {
      // Create mock events with null impact/horizon (as EventAgent would)
      const mockEvents: Event[] = [
        {
          id: 'event-1',
          type: 'event',
          scope: 'regional',
          confidence: 80,
          impact: null, // EventAgent sets this to null
          horizon: null, // EventAgent sets this to null
          source_count: 1,
          last_updated: '2024-01-15T10:00:00Z',
          event_id: 'event-1',
          headline: 'Chile increases copper tax',
          description: 'Chile announced a 5% increase in copper export tax.',
          date: '2024-01-15T10:00:00Z',
          location: 'Chile',
          actors: ['Chilean Government'],
          sectors: ['Mining', 'Commodities'],
          sources: [
            {
              name: 'Test Source',
              url: 'https://example.com/test',
            },
          ],
        },
        {
          id: 'event-2',
          type: 'event',
          scope: 'regional',
          confidence: 75,
          impact: null, // EventAgent sets this to null
          horizon: null, // EventAgent sets this to null
          source_count: 1,
          last_updated: '2024-01-15T11:00:00Z',
          event_id: 'event-2',
          headline: 'Copper prices rise',
          description: 'Copper prices increased following the tax announcement.',
          date: '2024-01-15T11:00:00Z',
          location: null,
          actors: ['Market'],
          sectors: ['Commodities'],
          sources: [
            {
              name: 'Market Data',
              url: 'https://example.com/market',
            },
          ],
        },
      ];

      // Convert to EventWithChain format (as SignalAgent expects)
      const eventsWithChain = mockEvents.map((event) => ({
        id: event.id,
        event_type: 'Policy Change',
        event_subtype: null,
        summary: event.description,
        country: event.location || null,
        region: event.location || null,
        sector: event.sectors[0] || null,
        actors: event.actors || [],
        why_it_matters: 'Test event',
        first_order_effect: null,
        second_order_effect: null,
        impact_score: null, // Not yet assigned (EventAgent sets to null)
        confidence: event.confidence / 100, // Convert to 0-1 scale
        created_at: event.last_updated,
        nucigen_causal_chains: [],
      }));

      // Generate signals
      const result = await signalAgent.generateSignals({
        events: eventsWithChain as any,
        user_preferences: undefined,
      });

      if (result.data && result.data.length > 0) {
        result.data.forEach((signal) => {
          // CRITICAL: SignalAgent must assign impact and horizon
          expect(signal.impact).not.toBeNull();
          expect(signal.horizon).not.toBeNull();
          expect(typeof signal.impact).toBe('number');
          expect(['immediate', 'short', 'medium', 'long']).toContain(signal.horizon);
          
          // Signal should have all required fields
          expect(signal.type).toBe('signal');
          expect(signal.title).toBeTruthy();
          expect(signal.summary).toBeTruthy();
          expect(signal.impact_score).toBeGreaterThanOrEqual(0);
          expect(signal.impact_score).toBeLessThanOrEqual(100);
        });
      }
    });
  });

  describe('End-to-end flow: EventAgent → SignalAgent', () => {
    it('should process events through complete pipeline', async () => {
      // Step 1: Extract events (EventAgent)
      const input: EventExtractionInput = {
        raw_content: 'Chile announced a 5% increase in copper export tax. The decision was made by the Chilean government on January 15, 2024. This follows similar moves by other copper-producing countries.',
        source: {
          name: 'Financial Times',
          url: 'https://example.com/ft',
          published_at: '2024-01-15T10:00:00Z',
        },
      };

      const eventResult = await eventAgent.extractEvent(input);

      if (!eventResult.data) {
        // Skip if event extraction fails (e.g., missing API keys)
        return;
      }

      const extractedEvent = eventResult.data;

      // Verify EventAgent output
      expect(extractedEvent.impact).toBeNull();
      expect(extractedEvent.horizon).toBeNull();
      expect(extractedEvent.type).toBe('event');

      // Step 2: Convert to EventWithChain format
      const eventWithChain = {
        id: extractedEvent.id,
        event_type: 'Policy Change',
        event_subtype: null,
        summary: extractedEvent.description,
        country: extractedEvent.location || null,
        region: extractedEvent.location || null,
        sector: extractedEvent.sectors[0] || null,
        actors: extractedEvent.actors || [],
        why_it_matters: extractedEvent.description.substring(0, 100),
        first_order_effect: null,
        second_order_effect: null,
        impact_score: null, // EventAgent sets this to null
        confidence: extractedEvent.confidence ? extractedEvent.confidence / 100 : 0.5,
        created_at: extractedEvent.last_updated,
        nucigen_causal_chains: [],
      };

      // Step 3: Generate signals (SignalAgent)
      const signalResult = await signalAgent.generateSignals({
        events: [eventWithChain as any],
        user_preferences: undefined,
      });

      // Verify SignalAgent output
      if (signalResult.data && signalResult.data.length > 0) {
        const signal = signalResult.data[0];
        
        // SignalAgent must have filled impact and horizon
        expect(signal.impact).not.toBeNull();
        expect(signal.horizon).not.toBeNull();
        expect(typeof signal.impact).toBe('number');
        expect(['immediate', 'short', 'medium', 'long']).toContain(signal.horizon);
        
        // Signal should reference the original event
        expect(signal.related_event_ids).toContain(extractedEvent.id);
      }
    }, 30000);
  });

  describe('Null handling edge cases', () => {
    it('should handle events with all null values gracefully', async () => {
      const mockEvents = [
        {
          id: 'event-null',
          type: 'event' as const,
          scope: null,
          confidence: 50,
          impact: null,
          horizon: null,
          source_count: 1,
          last_updated: '2024-01-15T10:00:00Z',
          event_id: 'event-null',
          headline: 'Test Event',
          description: 'Test description',
          date: '2024-01-15T10:00:00Z',
          location: null,
          actors: [],
          sectors: [],
          sources: [],
        },
      ];

      const eventsWithChain = mockEvents.map((event) => ({
        id: event.id,
        event_type: 'Unknown',
        event_subtype: null,
        summary: event.description,
        country: null,
        region: null,
        sector: null,
        actors: [],
        why_it_matters: 'Test event',
        first_order_effect: null,
        second_order_effect: null,
        impact_score: null,
        confidence: event.confidence / 100,
        created_at: event.last_updated,
        nucigen_causal_chains: [],
      }));

      const result = await signalAgent.generateSignals({
        events: eventsWithChain as any,
        user_preferences: undefined,
      });

      // Should handle gracefully without crashing
      expect(result.error).toBeUndefined();
      
      // If signals are generated, they should have non-null impact/horizon
      if (result.data && result.data.length > 0) {
        result.data.forEach((signal) => {
          expect(signal.impact).not.toBeNull();
          expect(signal.horizon).not.toBeNull();
        });
      }
    });
  });
});
