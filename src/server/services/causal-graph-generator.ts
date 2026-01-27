/**
 * Causal Knowledge Graph Generator
 * 
 * Generates Palantir-grade causal graphs from events using AI prompts
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type {
  CausalKnowledgeGraph,
  GraphNode,
  CausalEdge,
  GraphGenerationOptions,
  EventNode,
  MechanismNode,
  EntityNode,
  ImpactNode,
  SignalNode,
} from '../../types/causal-graph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: '/Users/guerschon/nucigenlabs-landingpage/.env' });

const openaiApiKey = process.env.OPENAI_API_KEY;

let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({ apiKey: openaiApiKey });
}

/**
 * PROMPT 1: Extract causal structure from events
 * 
 * Structure: Event → Company → Signal → Concept → Opportunity
 */
const EXTRACTION_PROMPT = `You are an intelligence analyst building a causal knowledge graph.

Input:
- A set of real-world events (geopolitical, economic, regulatory, climate).
- Each event may have multiple sources with varying confidence.

Task:
Build a hierarchical causal graph following this structure:
1. **Event** (top level): The core initiating event (e.g., "US Sanctions")
   - Type: event
   - Severity: critical/high/medium/low
   
2. **Companies** (directly affected): Companies impacted by the event
   - Type: entity (entity_type: "company")
   - Examples: NVIDIA, TSMC, ASML
   
3. **Signals** (emergent patterns): Broader signals emerging from company impacts
   - Type: signal
   - Posture: bullish/bearish/watch
   - Examples: "Tech Decoupling", "China Retaliation"
   
4. **Concepts** (related themes): Related concepts or themes
   - Type: entity (entity_type: "sector" or "commodity")
   - Examples: "Rare Earth", "Supply Chain"
   
5. **Opportunities** (positive impacts): Potential opportunities arising
   - Type: impact (direction: "positive")
   - Examples: "American Rare Earths", "MP Materials"

Output a structured causal graph with:
- Nodes: Event, Entity (company/concept), Signal, Impact (opportunity)
- Hierarchical relationships: Event → Company → Signal → Concept → Opportunity
- Typed relationships with directionality (triggers, affects, results_in, generates)
- Confidence score (0–100) for each node and relationship.
- Short explanation for each causal link.

Focus on explainability over completeness.
Do NOT invent facts.
Prefer high-confidence, historically validated causal chains.

Return ONLY valid JSON in this exact format:
{
  "nodes": [
    {
      "id": "event-1",
      "type": "event",
      "label": "Event title",
      "event_type": "geopolitical",
      "title": "Event title",
      "date": "2026-01-22",
      "severity": "high",
      "confidence_score": 85,
      "source_count": 5,
      "historical_precedent": true,
      "description": "Event description"
    },
    {
      "id": "mechanism-1",
      "type": "mechanism",
      "label": "Mechanism description",
      "mechanism_type": "supply_disruption",
      "description": "How the event acts",
      "confidence_score": 80,
      "source_count": 3,
      "historical_precedent": true
    },
    {
      "id": "entity-1",
      "type": "entity",
      "label": "Entity name",
      "entity_type": "company",
      "name": "Entity name",
      "confidence_score": 90,
      "source_count": 4,
      "historical_precedent": false
    },
    {
      "id": "impact-1",
      "type": "impact",
      "label": "Impact description",
      "metric": "revenue",
      "direction": "negative",
      "magnitude": 75,
      "timeframe": "short",
      "confidence_score": 70,
      "source_count": 2,
      "historical_precedent": true,
      "description": "Impact details"
    },
    {
      "id": "signal-1",
      "type": "signal",
      "label": "Signal description",
      "posture": "bearish",
      "confidence": 75,
      "confidence_score": 75,
      "source_count": 3,
      "historical_precedent": true,
      "recommendation": "Watch for..."
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "event-1",
      "target": "mechanism-1",
      "relation_type": "triggers",
      "confidence_score": 85,
      "source_count": 4,
      "historical_precedent": true,
      "explanation": "Event triggers mechanism because...",
      "strength": 0.85
    }
  ]
}`;

/**
 * Generate causal graph from search results or events
 */
export async function generateCausalGraph(
  events: any[], // Search results or events from database
  options: GraphGenerationOptions = {}
): Promise<CausalKnowledgeGraph> {
  if (!openai) {
    throw new Error('OpenAI API key is not configured. Cannot generate causal graph.');
  }

  const {
    depth = 2,
    min_confidence = 60,
    include_historical_precedents = true,
  } = options;

  // Prepare input for AI
  const eventsText = events
    .slice(0, 10) // Limit to top 10 events
    .map((event, idx) => {
      return `
Event ${idx + 1}:
- Title: ${event.title || event.name || 'Unknown'}
- Date: ${event.publishedAt || event.date || 'Unknown'}
- Type: ${event.type || event.category || 'Unknown'}
- Summary: ${event.summary || event.description || event.content?.substring(0, 200) || 'No summary'}
- Entities: ${(event.entities || []).map((e: any) => e.name || e).join(', ') || 'None'}
- Tier: ${event.tier || 'Background'}
- Confidence: ${event.relevanceScore ? Math.round(event.relevanceScore * 100) : 50}%
`;
    })
    .join('\n');

  const prompt = `${EXTRACTION_PROMPT}

Input Events:
${eventsText}

Generate the causal knowledge graph. Focus on high-confidence, explainable causal chains.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precision causal analysis system. Return ONLY valid JSON, no other text. Be deterministic and factual.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2, // Low temperature for consistency
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let graphData: any;

    try {
      graphData = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        graphData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Validate and normalize the graph structure
    const nodes: GraphNode[] = (graphData.nodes || []).map((node: any) => {
      // Ensure required fields
      return {
        ...node,
        confidence_score: node.confidence_score || 70,
        source_count: node.source_count || 1,
        historical_precedent: node.historical_precedent !== undefined ? node.historical_precedent : false,
      };
    }).filter((node: any) => {
      // Filter by confidence threshold
      return node.confidence_score >= min_confidence;
    });

    const edges: CausalEdge[] = (graphData.edges || []).map((edge: any) => {
      return {
        ...edge,
        confidence_score: edge.confidence_score || 70,
        source_count: edge.source_count || 1,
        historical_precedent: edge.historical_precedent !== undefined ? edge.historical_precedent : false,
        strength: edge.strength || (edge.confidence_score / 100) || 0.7,
      };
    }).filter((edge: any) => {
      // Filter by confidence and ensure both nodes exist
      return edge.confidence_score >= min_confidence &&
             nodes.some(n => n.id === edge.source) &&
             nodes.some(n => n.id === edge.target);
    });

    // Filter historical precedents if needed
    const filteredNodes = include_historical_precedents
      ? nodes
      : nodes.filter(n => !n.historical_precedent);

    const filteredEdges = include_historical_precedents
      ? edges
      : edges.filter(e => !e.historical_precedent);

    // Calculate metadata
    const confidenceAvg = filteredNodes.length > 0
      ? filteredNodes.reduce((sum, n) => sum + n.confidence_score, 0) / filteredNodes.length
      : 0;

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: {
        generated_at: new Date().toISOString(),
        query: options.query,
        depth,
        total_nodes: filteredNodes.length,
        total_edges: filteredEdges.length,
        confidence_avg: Math.round(confidenceAvg),
      },
    };
  } catch (error: any) {
    console.error('[CausalGraphGenerator] Error generating graph:', error);
    throw new Error(`Failed to generate causal graph: ${error.message}`);
  }
}

/**
 * PROMPT 2: Generate contextual subgraph (for interactive exploration)
 */
const SUBGRAPH_PROMPT = `You are an intelligence reasoning engine.

Context:
- The user selected the node: {{NODE_NAME}} ({{NODE_TYPE}})

Task:
1. Identify the most relevant causal subgraph centered on this node.
2. Filter out low-confidence or weakly connected nodes.
3. Prioritize:
   - Direct causes
   - Direct consequences
   - High-impact propagation paths
4. Explain why this node is central in the current context.

Output:
- A reduced causal graph (nodes + edges)
- A short analyst-style explanation: "This node matters because..."
- A list of 2–3 follow-up analytical questions the user should explore next.

Optimize for clarity and decision support.

Return ONLY valid JSON in this format:
{
  "subgraph": {
    "nodes": [...],
    "edges": [...]
  },
  "explanation": "This node matters because...",
  "followup_questions": ["Question 1", "Question 2", "Question 3"]
}`;

/**
 * Generate contextual subgraph around a selected node
 */
export async function generateSubgraph(
  nodeId: string,
  nodeType: string,
  fullGraph: CausalKnowledgeGraph
): Promise<{
  subgraph: CausalKnowledgeGraph;
  explanation: string;
  followup_questions: string[];
}> {
  if (!openai) {
    // Fallback: return direct connections
    const node = fullGraph.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found in graph`);
    }

    const connectedEdges = fullGraph.edges.filter(
      e => e.source === nodeId || e.target === nodeId
    );
    const connectedNodeIds = new Set<string>();
    connectedEdges.forEach(e => {
      connectedNodeIds.add(e.source);
      connectedNodeIds.add(e.target);
    });

    const subgraphNodes = fullGraph.nodes.filter(n => connectedNodeIds.has(n.id));
    const subgraphEdges = fullGraph.edges.filter(
      e => connectedNodeIds.has(e.source) && connectedNodeIds.has(e.target)
    );

    return {
      subgraph: {
        nodes: subgraphNodes,
        edges: subgraphEdges,
        metadata: {
          generated_at: new Date().toISOString(),
          depth: 1,
          total_nodes: subgraphNodes.length,
          total_edges: subgraphEdges.length,
          confidence_avg: 0,
        },
      },
      explanation: `This ${nodeType} is connected to ${subgraphNodes.length - 1} related nodes through ${subgraphEdges.length} causal relationships.`,
      followup_questions: [
        `What are the upstream causes of this ${nodeType}?`,
        `What downstream impacts does this ${nodeType} generate?`,
        `Which entities are most exposed to this ${nodeType}?`,
      ],
    };
  }

  const node = fullGraph.nodes.find(n => n.id === nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found in graph`);
  }

  const prompt = SUBGRAPH_PROMPT
    .replace('{{NODE_NAME}}', node.label)
    .replace('{{NODE_TYPE}}', node.type);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precision causal analysis system. Return ONLY valid JSON, no other text.',
        },
        {
          role: 'user',
          content: `${prompt}

Full Graph Context:
${JSON.stringify(fullGraph, null, 2)}

Generate the contextual subgraph.`,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    let result: any;

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    return {
      subgraph: result.subgraph || {
        nodes: [],
        edges: [],
        metadata: {
          generated_at: new Date().toISOString(),
          depth: 1,
          total_nodes: 0,
          total_edges: 0,
          confidence_avg: 0,
        },
      },
      explanation: result.explanation || `This ${nodeType} is central to the causal structure.`,
      followup_questions: result.followup_questions || [],
    };
  } catch (error: any) {
    console.error('[CausalGraphGenerator] Error generating subgraph:', error);
    // Return fallback
    return {
      subgraph: {
        nodes: [node],
        edges: [],
        metadata: {
          generated_at: new Date().toISOString(),
          depth: 1,
          total_nodes: 1,
          total_edges: 0,
          confidence_avg: node.confidence_score,
        },
      },
      explanation: `This ${nodeType} is part of the causal knowledge graph.`,
      followup_questions: [],
    };
  }
}
