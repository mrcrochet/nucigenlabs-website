/**
 * Intelligence Cluster Agent
 * 
 * Detects thematic patterns across events and creates clusters
 * 
 * PROMPT: Event Clustering
 * 
 * Role: Group events into thematic clusters with reasoning
 */

import { callOpenAI } from '../services/openai-optimizer';
import type { EventWithChain } from '../../lib/supabase';

export interface EventCluster {
  cluster_name: string;
  events: string[]; // event IDs
  reasoning: string;
  strength: number; // 1-10
}

export interface IntelligenceClusterInput {
  events: EventWithChain[];
  maxClusters?: number;
}

export class IntelligenceClusterAgent {
  /**
   * Cluster events into thematic groups
   */
  async clusterEvents(input: IntelligenceClusterInput): Promise<EventCluster[]> {
    const { events, maxClusters = 10 } = input;

    if (!events || events.length === 0) {
      return [];
    }

    // Format events for prompt
    const eventsJson = JSON.stringify(
      events.map((e, idx) => ({
        id: e.id,
        title: e.summary || e.title,
        sector: e.sector,
        region: e.region,
        event_type: e.event_type,
        timestamp: e.created_at,
      })),
      null,
      2
    );

    const systemPrompt = `You detect thematic patterns across events.
You do not speculate.`;

    const userPrompt = `Here is a list of recent events:
${eventsJson}

Group these events into thematic clusters if relevant.
Each cluster must be justified.
Maximum ${maxClusters} clusters.

Output format (JSON only):
{
  "clusters": [
    {
      "cluster_name": "...",
      "events": ["event_id1", "event_id2"],
      "reasoning": "why these events are related",
      "strength": 1-10
    }
  ]
}`;

    try {
      const response = await callOpenAI({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return parsed.clusters || [];
    } catch (error: any) {
      console.error('[IntelligenceClusterAgent] Error:', error);
      return [];
    }
  }

  /**
   * Explain relationship between entities
   */
  async explainRelationship(
    entityA: string,
    entityB: string,
    contextEvents: EventWithChain[]
  ): Promise<string> {
    const eventsJson = JSON.stringify(
      contextEvents.map(e => ({
        title: e.summary || e.title,
        sector: e.sector,
        region: e.region,
      })),
      null,
      2
    );

    const systemPrompt = `You explain relationships between entities using real-world logic.`;

    const userPrompt = `Entity A: ${entityA}
Entity B: ${entityB}
Context events:
${eventsJson}

Explain why these entities are connected in this context.
Max 60 words.`;

    try {
      const response = await callOpenAI({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 150,
      });

      return response.choices[0]?.message?.content || 'Relationship unclear.';
    } catch (error: any) {
      console.error('[IntelligenceClusterAgent] Relationship explanation error:', error);
      return 'Unable to explain relationship.';
    }
  }
}
