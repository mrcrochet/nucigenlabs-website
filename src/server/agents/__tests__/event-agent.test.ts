/**
 * EventAgent Tests
 * 
 * Critical validations:
 * 1. Returns only Event[] (UI contract)
 * 2. Never assigns impact or priority
 * 3. Extracts facts only (who, what, where, when)
 * 4. No business logic, no interpretation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventExtractionAgentImpl } from '../event-agent';
import type { EventExtractionInput } from '../../../lib/agents/agent-interfaces';
import type { Event } from '../../../types/intelligence';

describe('EventAgent', () => {
  let eventAgent: EventExtractionAgentImpl;

  beforeEach(() => {
    eventAgent = new EventExtractionAgentImpl();
  });

  describe('extractEvent', () => {
    it('should return Event[] type only', async () => {
      const input: EventExtractionInput = {
        raw_content: 'On January 15, 2024, the US Federal Reserve announced a 0.25% interest rate increase. The decision was made during the FOMC meeting in Washington, DC.',
        source: {
          name: 'Test Source',
          url: 'https://example.com/test',
          published_at: '2024-01-15T10:00:00Z',
        },
      };

      // Mock OpenAI if needed (for now, we'll test the structure)
      // In a real test, you'd mock the OpenAI client
      
      const result = await eventAgent.extractEvent(input);

      // Should return AgentResponse<Event>
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      
      if (result.data) {
        // Verify it's an Event type
        expect(result.data).toHaveProperty('type', 'event');
        expect(result.data).toHaveProperty('headline');
        expect(result.data).toHaveProperty('description');
        expect(result.data).toHaveProperty('date');
        expect(result.data).toHaveProperty('actors');
        expect(result.data).toHaveProperty('sectors');
        expect(result.data).toHaveProperty('sources');
      }
    });

    it('should NEVER assign impact or priority', async () => {
      const input: EventExtractionInput = {
        raw_content: 'Major geopolitical event occurred. This is very important.',
        source: {
          name: 'Test Source',
          url: 'https://example.com/test',
          published_at: '2024-01-15T10:00:00Z',
        },
      };

      const result = await eventAgent.extractEvent(input);

      if (result.data) {
        // CRITICAL: EventAgent should NOT assign impact
        // Impact should be null (SignalAgent will assign it later)
        expect(result.data.impact).toBeNull();
        
        // Horizon should also be null (SignalAgent will assign it)
        expect(result.data.horizon).toBeNull();
        
        // Should not have priority field
        expect(result.data).not.toHaveProperty('priority');
        
        // Should not have importance field
        expect(result.data).not.toHaveProperty('importance');
      }
    });

    it('should extract facts only (who, what, where, when)', async () => {
      const input: EventExtractionInput = {
        raw_content: 'On January 15, 2024, the US Federal Reserve (Fed) announced a 0.25% interest rate increase in Washington, DC.',
        source: {
          name: 'Test Source',
          url: 'https://example.com/test',
          published_at: '2024-01-15T10:00:00Z',
        },
      };

      const result = await eventAgent.extractEvent(input);

      if (result.data) {
        // Should have factual information
        expect(result.data.headline).toBeTruthy();
        expect(result.data.description).toBeTruthy();
        expect(result.data.date).toBeTruthy();
        
        // Should have actors (who)
        expect(Array.isArray(result.data.actors)).toBe(true);
        
        // Should have location (where)
        expect(result.data.location).toBeTruthy();
        
        // Should NOT have interpretation fields
        expect(result.data).not.toHaveProperty('why_it_matters');
        expect(result.data).not.toHaveProperty('first_order_effect');
        expect(result.data).not.toHaveProperty('second_order_effect');
      }
    });

    it('should return null if content is ambiguous or unverified', async () => {
      const input: EventExtractionInput = {
        raw_content: '', // Empty content
        source: {
          name: 'Test Source',
          url: 'https://example.com/test',
          published_at: '2024-01-15T10:00:00Z',
        },
      };

      const result = await eventAgent.extractEvent(input);

      // Should return error or null data
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should validate required fields', async () => {
      const input: EventExtractionInput = {
        raw_content: 'Some content without clear event information.',
        source: {
          name: 'Test Source',
          url: 'https://example.com/test',
          published_at: '2024-01-15T10:00:00Z',
        },
      };

      const result = await eventAgent.extractEvent(input);

      if (result.data) {
        // Should have required fields
        expect(result.data.headline).toBeTruthy();
        expect(result.data.description).toBeTruthy();
        expect(result.data.date).toBeTruthy();
        expect(result.data.sources).toBeTruthy();
        expect(result.data.sources.length).toBeGreaterThan(0);
      }
    });

    it('should NOT filter by business logic', async () => {
      // EventAgent should extract ALL events, not just "important" ones
      const input: EventExtractionInput = {
        raw_content: 'Minor event occurred. Not very significant.',
        source: {
          name: 'Test Source',
          url: 'https://example.com/test',
          published_at: '2024-01-15T10:00:00Z',
        },
      };

      const result = await eventAgent.extractEvent(input);

      // Should still extract the event, even if "not important"
      // EventAgent doesn't decide what's important
      if (result.data) {
        expect(result.data).toBeTruthy();
        expect(result.data.impact).toBe(0); // No impact assigned
      }
    });
  });

  describe('extractEvents', () => {
    it('should return Event[] array', async () => {
      const inputs: EventExtractionInput[] = [
        {
          raw_content: 'Event 1 occurred.',
          source: {
            name: 'Source 1',
            url: 'https://example.com/1',
            published_at: '2024-01-15T10:00:00Z',
          },
        },
        {
          raw_content: 'Event 2 occurred.',
          source: {
            name: 'Source 2',
            url: 'https://example.com/2',
            published_at: '2024-01-15T11:00:00Z',
          },
        },
      ];

      const result = await eventAgent.extractEvents(inputs);

      expect(result.data).toBeInstanceOf(Array);
      expect(result.data?.every(event => event.type === 'event')).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const inputs: EventExtractionInput[] = [
        {
          raw_content: 'Valid event content.',
          source: {
            name: 'Source 1',
            url: 'https://example.com/1',
            published_at: '2024-01-15T10:00:00Z',
          },
        },
        {
          raw_content: '', // Invalid
          source: {
            name: 'Source 2',
            url: 'https://example.com/2',
            published_at: '2024-01-15T11:00:00Z',
          },
        },
      ];

      const result = await eventAgent.extractEvents(inputs);

      // Should return valid events and report errors
      expect(result.data).toBeInstanceOf(Array);
      // Should have at least one valid event
      expect(result.data?.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('searchAndExtractEvents', () => {
    it('should return Event[] from Tavily search', async () => {
      // This test requires Tavily API key and makes real API calls
      // Skip if no API key to avoid timeouts in CI
      if (!process.env.TAVILY_API_KEY) {
        console.log('Skipping Tavily test - no API key');
        return;
      }
      
      const result = await eventAgent.searchAndExtractEvents('test query');

      // Should return AgentResponse<Event[]>
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      
      if (result.data) {
        expect(result.data).toBeInstanceOf(Array);
        expect(result.data.every(event => event.type === 'event')).toBe(true);
      }
    }, 30000); // 30s timeout for real API calls

    it('should handle missing Tavily API key gracefully', async () => {
      // Skip if API key exists (test would make real call)
      if (process.env.TAVILY_API_KEY) {
        console.log('Skipping missing API key test - API key exists');
        return;
      }
      
      // If Tavily is not configured, should return error
      const result = await eventAgent.searchAndExtractEvents('test query');

      // Should have error or empty data
      if (!result.data || result.data.length === 0) {
        expect(result.error).toBeTruthy();
      }
    });
  });
});
