/**
 * Causal Knowledge Graph Component
 * 
 * Palantir-grade interactive causal graph visualization using Cytoscape.js
 * Transforms events into actionable reasoning
 */

import { useEffect, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape, { type Core } from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';
import dagre from 'cytoscape-dagre';
import { X, ExternalLink, ZoomIn, ZoomOut, RotateCw, Download, Info } from 'lucide-react';
import type { CausalKnowledgeGraph, GraphNode, CausalEdge } from '../../types/causal-graph';

// Register layout extensions
Cytoscape.use(coseBilkent);
Cytoscape.use(dagre);

interface CausalKnowledgeGraphProps {
  graph: CausalKnowledgeGraph | null;
  query?: string;
  depth?: number;
  onNodeClick?: (nodeId: string, node: GraphNode) => void;
  onNodeExplore?: (nodeId: string, node: GraphNode) => void;
  height?: number;
  loading?: boolean;
}

export default function CausalKnowledgeGraph({
  graph,
  query,
  depth = 2,
  onNodeClick,
  onNodeExplore,
  height = 600,
  loading = false,
}: CausalKnowledgeGraphProps) {
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [subgraphContext, setSubgraphContext] = useState<{
    explanation: string;
    followup_questions: string[];
  } | null>(null);
  const [loadingSubgraph, setLoadingSubgraph] = useState(false);

  // Convert graph to Cytoscape elements
  const elements = graph
    ? [
        ...graph.nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            ...(node.type === 'event' && {
              event_type: (node as any).event_type,
              severity: (node as any).severity,
            }),
            ...(node.type === 'signal' && {
              posture: (node as any).posture,
            }),
            ...(node.type === 'entity' && {
              entity_type: (node as any).entity_type,
            }),
            confidence_score: node.confidence_score,
            source_count: node.source_count,
            historical_precedent: node.historical_precedent,
            ...node.metadata,
          },
        })),
        ...graph.edges.map((edge) => ({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            relation_type: edge.relation_type,
            confidence_score: edge.confidence_score,
            strength: edge.strength,
            explanation: edge.explanation,
            label: edge.explanation || edge.relation_type,
          },
        })),
      ]
    : [];

  // Cytoscape stylesheet - Palantir-style dark theme
  const stylesheet: any[] = [
    // Base node styles
    {
      selector: 'node',
      style: {
        'background-color': (ele) => getNodeColor(ele.data('type'), ele.data('severity'), ele.data('posture')),
        'label': 'data(label)',
        'color': '#ffffff',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '11px',
        'font-weight': '600',
        'text-outline-width': 2,
        'text-outline-color': '#000000',
        'width': (ele) => {
          const baseSize = 35;
          const confidence = ele.data('confidence_score') || 70;
          return baseSize + (confidence / 100) * 20;
        },
        'height': (ele) => {
          const baseSize = 35;
          const confidence = ele.data('confidence_score') || 70;
          return baseSize + (confidence / 100) * 20;
        },
        'border-width': 2,
        'border-color': '#ffffff',
        'text-wrap': 'wrap',
        'text-max-width': '120px',
      },
    },
    // Event nodes - rounded rectangle
    {
      selector: 'node[type="event"]',
      style: {
        'shape': 'round-rectangle',
        'background-opacity': 0.9,
      },
    },
    // Mechanism nodes - hexagon
    {
      selector: 'node[type="mechanism"]',
      style: {
        'shape': 'round-hexagon',
        'background-color': '#8b5cf6', // Purple
      },
    },
    // Entity nodes - shape depends on entity_type
    {
      selector: 'node[type="entity"]',
      style: {
        'shape': (ele) => {
          const entityType = ele.data('entity_type');
          if (entityType === 'company') return 'ellipse'; // Circle for companies
          if (entityType === 'sector' || entityType === 'commodity') return 'round-tag'; // Tag for concepts
          return 'round-octagon'; // Octagon for other entities
        },
        'background-color': (ele) => {
          const entityType = ele.data('entity_type');
          if (entityType === 'company') return '#3b82f6'; // Blue for companies
          if (entityType === 'country') return '#8b5cf6'; // Purple for countries
          if (entityType === 'sector' || entityType === 'commodity') return '#eab308'; // Yellow for concepts
          return '#64748b'; // Gray for other entities
        },
      },
    },
    // Impact nodes - diamond
    {
      selector: 'node[type="impact"]',
      style: {
        'shape': 'round-rectangle',
        'background-color': (ele) => {
          const direction = ele.data('direction');
          if (direction === 'positive') return '#22c55e'; // Green for opportunities
          return '#f59e0b'; // Amber for negative impacts
        },
      },
    },
    // Signal nodes - star
    {
      selector: 'node[type="signal"]',
      style: {
        'shape': 'star',
        'background-color': (ele) => {
          const posture = ele.data('posture');
          if (posture === 'bullish') return '#22c55e'; // Green
          if (posture === 'bearish') return '#ef4444'; // Red
          return '#eab308'; // Yellow for watch
        },
      },
    },
    // Selected node
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#3b82f6',
        'background-color': '#1e40af',
        'z-index': 999,
      },
    },
    // Highlighted nodes
    {
      selector: '.highlighted',
      style: {
        'opacity': 1,
        'z-index': 998,
      },
    },
    // Faded nodes
    {
      selector: '.faded',
      style: {
        'opacity': 0.2,
      },
    },
    // Edge styles
    {
      selector: 'edge',
      style: {
        'width': (ele) => 2 + (ele.data('strength') || 0.7) * 4,
        'line-color': (ele) => getEdgeColor(ele.data('relation_type')),
        'target-arrow-color': (ele) => getEdgeColor(ele.data('relation_type')),
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'opacity': 0.7,
        'label': 'data(label)',
        'text-rotation': 'autorotate',
        'text-margin-y': -10,
        'font-size': '9px',
        'color': '#94a3b8',
        'text-outline-width': 1,
        'text-outline-color': '#000000',
      },
    },
    // Highlighted edges
    {
      selector: 'edge.highlighted',
      style: {
        'opacity': 1,
        'width': (ele) => 4 + (ele.data('strength') || 0.7) * 4,
        'z-index': 997,
      },
    },
  ];

  // Layout configuration - Use hierarchical layout for causal structure
  const layout = {
    name: 'dagre',
    rankDir: 'TB', // Top to bottom (hierarchical)
    nodeSep: 50,
    edgeSep: 20,
    rankSep: 100,
    animate: true,
    animationDuration: 1000,
    quality: 'default',
    nodeDimensionsIncludeLabels: true,
  };

  // Handle node click
  const handleNodeTap = async (event: any) => {
    const node = event.target;
    if (node.isNode()) {
      const nodeData = node.data();
      const graphNode = graph?.nodes.find((n) => n.id === nodeData.id);

      if (graphNode) {
        setSelectedNode(graphNode);
        onNodeClick?.(nodeData.id, graphNode);

        // Highlight connected nodes
        const cy = cyRef.current;
        if (cy) {
          cy.elements().removeClass('highlighted faded');

          const connectedEdges = node.connectedEdges();
          const connectedNodes = connectedEdges.connectedNodes();

          node.addClass('highlighted');
          connectedNodes.addClass('highlighted');
          connectedEdges.addClass('highlighted');

          cy.elements()
            .not(node)
            .not(connectedNodes)
            .not(connectedEdges)
            .addClass('faded');

          // Generate subgraph context
          setLoadingSubgraph(true);
          try {
            const response = await fetch('/api/knowledge-graph/subgraph', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                node_id: nodeData.id,
                node_type: nodeData.type,
                full_graph: graph,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              setSubgraphContext({
                explanation: data.explanation,
                followup_questions: data.followup_questions || [],
              });
            }
          } catch (error) {
            console.error('Error loading subgraph context:', error);
          } finally {
            setLoadingSubgraph(false);
          }
        }
      }
    }
  };

  // Handle background click
  const handleBackgroundTap = () => {
    const cy = cyRef.current;
    if (cy) {
      cy.elements().removeClass('highlighted faded');
      setSelectedNode(null);
      setSubgraphContext(null);
    }
  };

  // Export graph as PNG
  const exportGraph = () => {
    const cy = cyRef.current;
    if (cy) {
      const png = cy.png({ full: true, scale: 2, bg: '#000000' });
      const link = document.createElement('a');
      link.href = png;
      link.download = `causal-graph-${Date.now()}.png`;
      link.click();
    }
  };

  // Reset view
  const resetView = () => {
    const cy = cyRef.current;
    if (cy) {
      cy.fit();
      cy.center();
    }
  };

  // Zoom controls
  const zoomIn = () => {
    const cy = cyRef.current;
    if (cy) {
      cy.zoom(cy.zoom() * 1.2);
    }
  };

  const zoomOut = () => {
    const cy = cyRef.current;
    if (cy) {
      cy.zoom(cy.zoom() * 0.8);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-white">Generating causal knowledge graph...</div>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-gray-400">
        <div className="text-center">
          <p className="mb-2">No causal graph available</p>
          <p className="text-sm">Generate a graph from search results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black" style={{ height: `${height}px` }}>
      {/* Graph Canvas */}
      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%', background: '#000000' }}
        stylesheet={stylesheet}
        layout={layout}
        cy={(cy) => {
          cyRef.current = cy;
          cy.on('tap', 'node', handleNodeTap);
          cy.on('tap', handleBackgroundTap);
        }}
      />

      {/* Controls */}
      <div className="absolute top-4 left-4 space-y-2 z-10">
        <button
          onClick={resetView}
          className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-800 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          title="Reset View"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={zoomIn}
          className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-800 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-800 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={exportGraph}
          className="flex items-center gap-2 px-3 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-800 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
          title="Export as PNG"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-lg p-4 z-10 max-w-xs">
        <h3 className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Node Types</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-gray-300">Event (Critical)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-gray-300">Event (Strategic)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
            <span className="text-gray-300">Mechanism</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-gray-300">Signal (Bullish)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-gray-300">Signal (Bearish)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-500"></div>
            <span className="text-gray-300">Entity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
            <span className="text-gray-300">Impact</span>
          </div>
        </div>
        {graph.metadata && (
          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-400">
            <div>Nodes: {graph.metadata.total_nodes}</div>
            <div>Edges: {graph.metadata.total_edges}</div>
            <div>Confidence: {graph.metadata.confidence_avg}%</div>
          </div>
        )}
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-lg p-6 max-w-2xl z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{selectedNode.label}</h3>
              <p className="text-sm text-gray-400 capitalize">{selectedNode.type}</p>
            </div>
            <button
              onClick={() => {
                setSelectedNode(null);
                setSubgraphContext(null);
                const cy = cyRef.current;
                if (cy) {
                  cy.elements().removeClass('highlighted faded');
                }
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Node-specific details */}
          <div className="space-y-3 mb-4">
            {selectedNode.type === 'event' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Event Type:</span>
                  <span className="text-white font-semibold capitalize">{(selectedNode as any).event_type}</span>
                </div>
                {(selectedNode as any).severity && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Severity:</span>
                    <span className="text-white font-semibold capitalize">{(selectedNode as any).severity}</span>
                  </div>
                )}
              </>
            )}
            {selectedNode.type === 'signal' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Posture:</span>
                <span className={`font-semibold capitalize ${
                  (selectedNode as any).posture === 'bullish' ? 'text-green-400' :
                  (selectedNode as any).posture === 'bearish' ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {(selectedNode as any).posture}
                </span>
              </div>
            )}
            {selectedNode.type === 'entity' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Entity Type:</span>
                <span className="text-white font-semibold capitalize">{(selectedNode as any).entity_type}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Confidence:</span>
              <span className="text-white font-semibold">{selectedNode.confidence_score}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Sources:</span>
              <span className="text-white">{selectedNode.source_count}</span>
            </div>
            {selectedNode.historical_precedent && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Info className="w-4 h-4" />
                <span>Historical precedent available</span>
              </div>
            )}
          </div>

          {/* Subgraph Context */}
          {loadingSubgraph ? (
            <div className="text-sm text-gray-400">Loading context...</div>
          ) : subgraphContext ? (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <h4 className="text-sm font-semibold text-white mb-2">Context</h4>
              <p className="text-sm text-gray-300 mb-3">{subgraphContext.explanation}</p>
              {subgraphContext.followup_questions.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Follow-up Questions</h5>
                  <ul className="space-y-1">
                    {subgraphContext.followup_questions.map((q, idx) => (
                      <li key={idx} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800">
            {onNodeExplore && (
              <button
                onClick={() => onNodeExplore(selectedNode.id, selectedNode)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Explore Deeper
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getNodeColor(
  type: string,
  severity?: string,
  posture?: string
): string {
  if (type === 'event') {
    if (severity === 'critical') return '#ef4444'; // Red
    if (severity === 'high') return '#f97316'; // Orange
    return '#3b82f6'; // Blue
  }
  if (type === 'mechanism') return '#8b5cf6'; // Purple
  if (type === 'signal') {
    if (posture === 'bullish') return '#22c55e'; // Green
    if (posture === 'bearish') return '#ef4444'; // Red
    return '#eab308'; // Yellow for watch
  }
  if (type === 'entity') return '#64748b'; // Gray
  if (type === 'impact') return '#f59e0b'; // Amber
  return '#64748b';
}

function getEdgeColor(relationType: string): string {
  if (relationType === 'triggers' || relationType === 'causes') return '#ef4444'; // Red
  if (relationType === 'affects' || relationType === 'impacts') return '#f97316'; // Orange
  if (relationType === 'results_in' || relationType === 'generates') return '#a855f7'; // Purple
  return '#64748b'; // Gray for other relations
}
