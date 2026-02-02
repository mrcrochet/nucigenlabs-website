/**
 * Graph Builder
 * 
 * Builds knowledge graph from entities and relationships
 */

import type { SearchResult } from './search-orchestrator';
import type { Relationship } from './relationship-extractor';
import type { Entity } from './entity-extractor';
import type { KnowledgeGraph } from './search-orchestrator';

/**
 * Build knowledge graph from results and relationships
 * Now includes temporal metadata (validFrom, validTo, confidence, sourceCount)
 */
export async function buildGraph(
  results: SearchResult[],
  relationships: Relationship[],
  previousGraph?: KnowledgeGraph
): Promise<KnowledgeGraph> {
  const now = new Date().toISOString();
  const nodes: KnowledgeGraph['nodes'] = [];
  const links: KnowledgeGraph['links'] = [];
  const nodeMap = new Map<string, KnowledgeGraph['nodes'][0]>();

  // Add nodes from results (events/articles) with temporal metadata
  for (const result of results) {
    const nodeId = result.id;
    if (!nodeMap.has(nodeId)) {
      // Check if node exists in previous graph
      const previousNode = previousGraph?.nodes.find(n => n.id === nodeId);
      
      nodeMap.set(nodeId, {
        id: nodeId,
        type: result.type === 'event' ? 'event' : 'event', // Treat articles as events for graph
        label: result.title,
        data: {
          ...result,
        },
        validFrom: previousNode?.validFrom || now, // Keep original validFrom if exists
        validTo: null, // Still valid
        confidence: calculateNodeConfidence(result),
        sourceCount: 1 + (previousNode?.sourceCount || 0), // Increment source count
      });
    } else {
      // Node already exists - update source count
      const existing = nodeMap.get(nodeId)!;
      existing.sourceCount = (existing.sourceCount || 1) + 1;
      existing.validTo = null; // Still valid
    }
  }

  // Add nodes from entities with temporal metadata
  for (const result of results) {
    for (const entity of result.entities) {
      const nodeId = entity.id;
      if (!nodeMap.has(nodeId)) {
        const previousNode = previousGraph?.nodes.find(n => n.id === nodeId);
        
        nodeMap.set(nodeId, {
          id: nodeId,
          type: entity.type,
          label: entity.name,
          data: {
            entity,
          },
          validFrom: previousNode?.validFrom || now,
          validTo: null,
          confidence: entity.confidence,
          sourceCount: 1 + (previousNode?.sourceCount || 0),
        });
      } else {
        // Entity already exists - update source count
        const existing = nodeMap.get(nodeId)!;
        existing.sourceCount = (existing.sourceCount || 1) + 1;
        existing.validTo = null;
      }
    }
  }

  // Add links from relationships
  for (const rel of relationships) {
    // Ensure both source and target nodes exist
    const sourceExists = nodeMap.has(rel.source);
    const targetExists = nodeMap.has(rel.target);

    if (sourceExists && targetExists) {
      // Check if link exists in previous graph
      const previousLink = previousGraph?.links.find(l => 
        l.source === rel.source && l.target === rel.target && l.type === rel.type
      );
      
      links.push({
        source: rel.source,
        target: rel.target,
        type: rel.type,
        strength: rel.strength,
        validFrom: previousLink?.validFrom || now,
        validTo: null,
        confidence: rel.confidence || rel.strength,
        sourceCount: 1 + (previousLink?.sourceCount || 0),
      });
    } else {
      // Try to find nodes by matching entity names or result IDs
      let sourceNode = nodeMap.get(rel.source);
      let targetNode = nodeMap.get(rel.target);

      if (!sourceNode) {
        // Try to find by entity name in results
        for (const result of results) {
          const matchingEntity = result.entities.find(e => 
            e.id === rel.source || e.name.toLowerCase() === rel.source.toLowerCase()
          );
          if (matchingEntity) {
            sourceNode = nodeMap.get(matchingEntity.id);
            break;
          }
          if (result.id === rel.source) {
            sourceNode = nodeMap.get(result.id);
            break;
          }
        }
      }

      if (!targetNode) {
        // Try to find by entity name in results
        for (const result of results) {
          const matchingEntity = result.entities.find(e => 
            e.id === rel.target || e.name.toLowerCase() === rel.target.toLowerCase()
          );
          if (matchingEntity) {
            targetNode = nodeMap.get(matchingEntity.id);
            break;
          }
          if (result.id === rel.target) {
            targetNode = nodeMap.get(result.id);
            break;
          }
        }
      }

      if (sourceNode && targetNode) {
        const previousLink = previousGraph?.links.find(l => 
          l.source === sourceNode.id && l.target === targetNode.id && l.type === rel.type
        );
        
        links.push({
          source: sourceNode.id,
          target: targetNode.id,
          type: rel.type,
          strength: rel.strength,
          validFrom: previousLink?.validFrom || now,
          validTo: null,
          confidence: rel.confidence || rel.strength,
          sourceCount: 1 + (previousLink?.sourceCount || 0),
        });
      }
    }
  }

  // Add implicit links: entities mentioned in same result are related
  for (const result of results) {
    const resultEntities = result.entities;
    for (let i = 0; i < resultEntities.length; i++) {
      for (let j = i + 1; j < resultEntities.length; j++) {
        const entity1 = resultEntities[i];
        const entity2 = resultEntities[j];
        
        const node1 = nodeMap.get(entity1.id);
        const node2 = nodeMap.get(entity2.id);
        
        if (node1 && node2) {
          // Check if link already exists
          const linkExists = links.some(l => 
            (l.source === node1.id && l.target === node2.id) ||
            (l.source === node2.id && l.target === node1.id)
          );

          if (!linkExists) {
            links.push({
              source: node1.id,
              target: node2.id,
              type: 'related_to',
              strength: 0.5, // Medium strength for co-occurrence
              validFrom: now,
              validTo: null,
              confidence: 0.5,
              sourceCount: 1,
            });
          }
        }
      }

      // Link result to its entities
      const resultNode = nodeMap.get(result.id);
      if (resultNode) {
        for (const entity of resultEntities) {
          const entityNode = nodeMap.get(entity.id);
          if (entityNode) {
            const linkExists = links.some(l => 
              (l.source === resultNode.id && l.target === entityNode.id) ||
              (l.source === entityNode.id && l.target === resultNode.id)
            );

            if (!linkExists) {
              links.push({
                source: resultNode.id,
                target: entityNode.id,
                type: 'related_to',
                strength: 0.7, // Higher strength for direct mention
                validFrom: now,
                validTo: null,
                confidence: 0.7,
                sourceCount: 1,
              });
            }
          }
        }
      }
    }
  }

  // Convert map to array
  nodes.push(...Array.from(nodeMap.values()));

  // Limit graph size for performance (top N nodes by degree/sourceCount, top M links)
  const limited = limitGraphSize({ nodes, links }, { maxNodes: 100, maxLinks: 200 });

  // Merge with previous graph if provided (close old relationships that no longer exist)
  if (previousGraph) {
    return mergeTemporalGraphs(previousGraph, limited);
  }

  return limited;
}

const DEFAULT_MAX_NODES = 100;
const DEFAULT_MAX_LINKS = 200;

/**
 * Limit graph to top N nodes (by degree + sourceCount) and top M links between them.
 * Keeps the graph readable and performant.
 */
function limitGraphSize(
  graph: { nodes: KnowledgeGraph['nodes']; links: KnowledgeGraph['links'] },
  opts: { maxNodes?: number; maxLinks?: number } = {}
): { nodes: KnowledgeGraph['nodes']; links: KnowledgeGraph['links'] } {
  const maxNodes = opts.maxNodes ?? DEFAULT_MAX_NODES;
  const maxLinks = opts.maxLinks ?? DEFAULT_MAX_LINKS;
  if (graph.nodes.length <= maxNodes && graph.links.length <= maxLinks) {
    return graph;
  }

  const degree = new Map<string, number>();
  for (const n of graph.nodes) degree.set(n.id, 0);
  for (const l of graph.links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }

  const score = (n: KnowledgeGraph['nodes'][0]) =>
    (degree.get(n.id) ?? 0) * 2 + (n.sourceCount ?? 0) + (n.confidence ?? 0.5) * 5;
  const sorted = [...graph.nodes].sort((a, b) => score(b) - score(a));
  const topNodes = sorted.slice(0, maxNodes);
  const topIds = new Set(topNodes.map((n) => n.id));

  const topLinks = graph.links.filter(
    (l) => topIds.has(l.source) && topIds.has(l.target)
  ).slice(0, maxLinks);

  return { nodes: topNodes, links: topLinks };
}

/**
 * Calculate node confidence based on result quality
 */
function calculateNodeConfidence(result: SearchResult): number {
  // Combine source score, relevance score, and impact score
  const sourceScore = result.sourceScore || 0.5;
  const relevanceScore = result.relevanceScore || 0.5;
  const impactScore = result.impactScore || 0.5;
  
  // Weighted average
  return (sourceScore * 0.4 + relevanceScore * 0.3 + impactScore * 0.3);
}

/**
 * Merge temporal graphs - close old relationships that no longer exist
 */
function mergeTemporalGraphs(
  previous: KnowledgeGraph,
  current: KnowledgeGraph
): KnowledgeGraph {
  const now = new Date().toISOString();
  
  // Track current link keys
  const currentLinkKeys = new Set(
    current.links.map(l => `${l.source}-${l.target}-${l.type}`)
  );
  
  // Close previous links that no longer exist
  const closedLinks = previous.links
    .filter(l => {
      const key = `${l.source}-${l.target}-${l.type}`;
      return !currentLinkKeys.has(key);
    })
    .map(l => ({
      ...l,
      validTo: now, // Mark as closed
    }));
  
  // Merge nodes (keep previous nodes that still exist, add new ones)
  const nodeMap = new Map<string, KnowledgeGraph['nodes'][0]>();
  
  // Add previous nodes (they may still be valid)
  for (const node of previous.nodes) {
    nodeMap.set(node.id, node);
  }
  
  // Update/add current nodes
  for (const node of current.nodes) {
    const existing = nodeMap.get(node.id);
    if (existing) {
      // Update existing node
      nodeMap.set(node.id, {
        ...existing,
        ...node,
        validFrom: existing.validFrom || node.validFrom, // Keep original validFrom
        validTo: null, // Still valid
        sourceCount: (existing.sourceCount || 0) + (node.sourceCount || 1), // Accumulate
      });
    } else {
      // New node
      nodeMap.set(node.id, node);
    }
  }
  
  // Combine all links (closed + current)
  return {
    nodes: Array.from(nodeMap.values()),
    links: [...closedLinks, ...current.links],
  };
}

/**
 * Merge two graphs
 */
export function mergeGraphs(graph1: KnowledgeGraph, graph2: KnowledgeGraph): KnowledgeGraph {
  const nodeMap = new Map<string, KnowledgeGraph['nodes'][0]>();
  const links: KnowledgeGraph['links'] = [];
  const linkSet = new Set<string>();

  // Add nodes from graph1
  for (const node of graph1.nodes) {
    nodeMap.set(node.id, node);
  }

  // Add nodes from graph2 (merge if exists)
  for (const node of graph2.nodes) {
    if (nodeMap.has(node.id)) {
      // Merge data
      const existing = nodeMap.get(node.id)!;
      nodeMap.set(node.id, {
        ...existing,
        data: {
          ...existing.data,
          ...node.data,
        },
      });
    } else {
      nodeMap.set(node.id, node);
    }
  }

  // Add links from graph1
  for (const link of graph1.links) {
    const key = `${link.source}-${link.target}-${link.type}`;
    if (!linkSet.has(key)) {
      links.push(link);
      linkSet.add(key);
    }
  }

  // Add links from graph2
  for (const link of graph2.links) {
    const key = `${link.source}-${link.target}-${link.type}`;
    if (!linkSet.has(key)) {
      // Check if both nodes exist
      if (nodeMap.has(link.source) && nodeMap.has(link.target)) {
        links.push(link);
        linkSet.add(key);
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  };
}
