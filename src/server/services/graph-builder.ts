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
 */
export async function buildGraph(
  results: SearchResult[],
  relationships: Relationship[]
): Promise<KnowledgeGraph> {
  const nodes: KnowledgeGraph['nodes'] = [];
  const links: KnowledgeGraph['links'] = [];
  const nodeMap = new Map<string, KnowledgeGraph['nodes'][0]>();

  // Add nodes from results (events/articles)
  for (const result of results) {
    const nodeId = result.id;
    if (!nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, {
        id: nodeId,
        type: result.type === 'event' ? 'event' : 'event', // Treat articles as events for graph
        label: result.title,
        data: {
          ...result,
        },
      });
    }
  }

  // Add nodes from entities
  for (const result of results) {
    for (const entity of result.entities) {
      const nodeId = entity.id;
      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, {
          id: nodeId,
          type: entity.type,
          label: entity.name,
          data: {
            entity,
          },
        });
      }
    }
  }

  // Add links from relationships
  for (const rel of relationships) {
    // Ensure both source and target nodes exist
    const sourceExists = nodeMap.has(rel.source);
    const targetExists = nodeMap.has(rel.target);

    if (sourceExists && targetExists) {
      links.push({
        source: rel.source,
        target: rel.target,
        type: rel.type,
        strength: rel.strength,
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
        links.push({
          source: sourceNode.id,
          target: targetNode.id,
          type: rel.type,
          strength: rel.strength,
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
              });
            }
          }
        }
      }
    }
  }

  // Convert map to array
  nodes.push(...Array.from(nodeMap.values()));

  return {
    nodes,
    links,
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
