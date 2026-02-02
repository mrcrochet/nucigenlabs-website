/**
 * Knowledge Graph
 *
 * D3.js force-directed graph visualization with fullscreen support
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { Maximize2, Minimize2, PanelRightOpen, ZoomOut, Download, Image } from 'lucide-react';
import type { KnowledgeGraph as KnowledgeGraphType, GraphNode } from '../../types/search';
import type { SearchMode } from '../../types/search';

const LABEL_MAX_LEN_NORMAL = 15;
const LABEL_MAX_LEN_FULLSCREEN = 30;

const NODE_TYPES = ['event', 'article', 'document', 'country', 'company', 'commodity', 'organization', 'person'] as const;
const NODE_SIZE_MIN = 6;
const NODE_SIZE_MAX = 20;
const LINK_TYPES = ['causes', 'precedes', 'related_to', 'operates_in', 'exposes_to', 'impacts'] as const;

interface KnowledgeGraphProps {
  graph: KnowledgeGraphType;
  query?: string;
  searchMode?: SearchMode | null;
  initialFocusNodeId?: string | null;
  onNodeClick?: (nodeId: string, node?: GraphNode) => void;
  onNodeExplore?: (nodeId: string, nodeLabel: string) => void;
  onNodeContextMenu?: (nodeId: string, node: GraphNode, event?: { clientX: number; clientY: number }) => void;
  height?: number;
}

type ZoomRef = { zoom: d3.ZoomBehavior<SVGSVGElement, unknown>; svg: d3.Selection<SVGSVGElement, unknown, null, undefined> };

function renderGraph(
  svgEl: SVGSVGElement,
  containerEl: HTMLDivElement,
  opts: {
    isFullscreen: boolean;
    height: number;
    graph: KnowledgeGraphType;
    onNodeClick?: (nodeId: string, node?: GraphNode) => void;
    onNodeExplore?: (nodeId: string, nodeLabel: string) => void;
    onNodeContextMenu?: (nodeId: string, node: GraphNode, position: { x: number; y: number }) => void;
    zoomRef?: React.MutableRefObject<ZoomRef | null>;
    focusedNodeId?: string | null;
    neighborIds?: Set<string>;
    searchMatchedIds?: Set<string>;
  }
): () => void {
  const { isFullscreen, height, graph, onNodeClick, onNodeExplore, onNodeContextMenu, zoomRef, focusedNodeId, neighborIds, searchMatchedIds } = opts;
  const focusSet = focusedNodeId != null && neighborIds ? new Set([focusedNodeId, ...neighborIds]) : null;
  const hasSearchHighlight = searchMatchedIds != null && searchMatchedIds.size > 0;
  const width = containerEl.clientWidth;
  const graphHeight = isFullscreen ? window.innerHeight - 80 : height;
  const labelMaxLen = isFullscreen ? LABEL_MAX_LEN_FULLSCREEN : LABEL_MAX_LEN_NORMAL;

  d3.select(svgEl).selectAll('*').remove();

  const svg = d3.select(svgEl).attr('width', width).attr('height', graphHeight);
  // Arrow marker for directional links
  const defs = svg.append('defs');
  defs.append('marker')
    .attr('id', 'arrowhead')
    .attr('markerWidth', 10)
    .attr('markerHeight', 7)
    .attr('refX', 9)
    .attr('refY', 3.5)
    .attr('orient', 'auto')
    .append('polygon')
    .attr('points', '0 0, 10 3.5, 0 7')
    .attr('fill', '#94a3b8');
  const g = svg.append('g');

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);
  if (isFullscreen && zoomRef) zoomRef.current = { zoom, svg };

  const SIMULATION_MAX_TICKS = 300;
  const simulation = d3.forceSimulation(graph.nodes as d3.SimulationNodeDatum & { id: string; x?: number; y?: number }[])
    .force('link', d3.forceLink(graph.links).id((d: any) => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, graphHeight / 2))
    .force('collision', d3.forceCollide().radius((d: any) => getNodeSizeFromData(d) + 8));
  let tickCount = 0;
  simulation.on('tick', () => {
    tickCount += 1;
    if (tickCount >= SIMULATION_MAX_TICKS) simulation.stop();
  });

  const link = g.append('g')
    .selectAll('line')
    .data(graph.links)
    .enter()
    .append('line')
    .attr('stroke', (d: any) => getLinkColor(d.type))
    .attr('stroke-opacity', (d: any) => {
      const obsolete = d.validTo != null;
      const conf = d.confidence ?? 0.5;
      return obsolete ? 0.25 : Math.min(1, 0.4 + 0.6 * conf);
    })
    .attr('stroke-width', (d: any) => {
      const conf = d.confidence ?? 0.5;
      const sc = d.sourceCount ?? 1;
      return Math.max(1, (d.strength * 2) * (0.7 + 0.3 * conf) * Math.min(1.5, 0.7 + 0.3 * Math.log10(1 + sc)));
    })
    .attr('marker-end', (d: any) => (isDirectionalLinkType(d.type) ? 'url(#arrowhead)' : null));

  const node = g.append('g')
    .selectAll('circle')
    .data(graph.nodes)
    .enter()
    .append('circle')
    .attr('r', (d: any) => getNodeSizeFromData(d))
    .attr('fill', (d: any) => getNodeColor(d.type))
    .attr('fill-opacity', (d: any) => {
      const obsolete = d.validTo != null;
      const conf = d.confidence ?? 0.5;
      return obsolete ? 0.35 : (0.6 + 0.4 * conf);
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .call(drag(simulation) as any)
    .on('click', (event: any, d: any) => {
      event.stopPropagation();
      if (event.ctrlKey || event.metaKey) {
        onNodeExplore?.(d.id, d.label);
      } else {
        onNodeClick?.(d.id, d);
      }
    })
    .on('dblclick', (event: any, d: any) => {
      event.stopPropagation();
      onNodeExplore?.(d.id, d.label);
    })
    .on('contextmenu', (event: any, d: any) => {
      event.preventDefault();
      event.stopPropagation();
      onNodeContextMenu?.(d.id, d, { clientX: event.clientX, clientY: event.clientY });
    });

  const label = g.append('g')
    .selectAll('text')
    .data(graph.nodes)
    .enter()
    .append('text')
    .text((d: any) => (d.label.length > labelMaxLen ? d.label.substring(0, labelMaxLen) + '...' : d.label))
    .attr('font-size', '10px')
    .attr('fill', '#fff')
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => getNodeSizeFromData(d) + 12)
    .attr('opacity', (d: any) => {
      if (focusSet) return focusSet.has(d.id) ? 1 : 0.15;
      if (hasSearchHighlight) return searchMatchedIds!.has(d.id) ? 1 : 0.2;
      return 1;
    });

  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'kg-tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background', 'rgba(0, 0, 0, 0.8)')
    .style('color', '#fff')
    .style('padding', '8px')
    .style('border-radius', '4px')
    .style('pointer-events', 'none')
    .style('font-size', '12px')
    .style('z-index', '10001');

  node
    .on('mouseover', (event: any, d: any) => {
      tooltip.transition().duration(200).style('opacity', 1);
      const validRange = d.validFrom
        ? `Valide de ${d.validFrom.slice(0, 10)} à ${d.validTo ? d.validTo.slice(0, 10) : 'présent'}`
        : '';
      tooltip.html(
        `${d.label}<br/><span style="color:#94a3b8">${d.type}</span>${validRange ? `<br/><span style="color:#64748b;font-size:10px">${validRange}</span>` : ''}`
      )
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', () => tooltip.transition().duration(200).style('opacity', 0));

  link
    .on('mouseover', (event: any, d: any) => {
      tooltip.transition().duration(200).style('opacity', 1);
      const validRange = d.validFrom
        ? `Valide de ${d.validFrom.slice(0, 10)} à ${d.validTo ? d.validTo.slice(0, 10) : 'présent'}`
        : '';
      tooltip.html(
        `<span style="color:#94a3b8">${String(d.type).replace('_', ' ')}</span>${d.strength != null ? `<br/>strength: ${d.strength}` : ''}${validRange ? `<br/><span style="color:#64748b;font-size:10px">${validRange}</span>` : ''}`
      )
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', () => tooltip.transition().duration(200).style('opacity', 0));

  simulation.on('tick', () => {
    tickCount += 1;
    if (tickCount >= SIMULATION_MAX_TICKS) simulation.stop();
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => {
        const sx = d.source.x;
        const sy = d.source.y;
        const tx = d.target.x;
        const ty = d.target.y;
        const len = Math.hypot(tx - sx, ty - sy);
        if (len === 0) return tx;
        const r = getNodeSizeFromData(d.target);
        if (len <= r) return tx;
        return sx + ((tx - sx) * (len - r)) / len;
      })
      .attr('y2', (d: any) => {
        const sx = d.source.x;
        const sy = d.source.y;
        const tx = d.target.x;
        const ty = d.target.y;
        const len = Math.hypot(tx - sx, ty - sy);
        if (len === 0) return ty;
        const r = getNodeSizeFromData(d.target);
        if (len <= r) return ty;
        return sy + ((ty - sy) * (len - r)) / len;
      });
    node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
    label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
  });

  return () => {
    simulation.stop();
    tooltip.remove();
  };
}

export default function KnowledgeGraph({ graph, query, searchMode, initialFocusNodeId, onNodeClick, onNodeExplore, onNodeContextMenu, height = 600 }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const fullscreenSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenZoomRef = useRef<ZoomRef | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const maximizeButtonRef = useRef<HTMLButtonElement>(null);
  const exitFullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [linkTypesFilter, setLinkTypesFilter] = useState<Set<string>>(() => new Set(LINK_TYPES));
  const [nodeTypesFilter, setNodeTypesFilter] = useState<Set<string>>(() => new Set(NODE_TYPES));
  const [searchInGraph, setSearchInGraph] = useState('');
  const [searchInGraphDebounced, setSearchInGraphDebounced] = useState('');
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(initialFocusNodeId ?? null);
  const [selectedNodeIdInGraph, setSelectedNodeIdInGraph] = useState<string | null>(null);

  useEffect(() => {
    if (initialFocusNodeId && graph.nodes.some((n) => n.id === initialFocusNodeId)) {
      setFocusedNodeId(initialFocusNodeId);
    }
  }, [initialFocusNodeId, graph.nodes]);

  useEffect(() => {
    const t = setTimeout(() => setSearchInGraphDebounced(searchInGraph), 300);
    return () => clearTimeout(t);
  }, [searchInGraph]);

  const toggleLinkType = useCallback((type: string) => {
    setLinkTypesFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const toggleNodeType = useCallback((type: string) => {
    setNodeTypesFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const filteredGraph = useMemo(() => {
    if (!graph.nodes.length) return graph;
    const nodesFiltered = graph.nodes.filter((n) => nodeTypesFilter.has(n.type));
    const nodeIds = new Set(nodesFiltered.map((n) => n.id));
    const linksFiltered = graph.links.filter(
      (l) => linkTypesFilter.has(l.type) && nodeIds.has(l.source) && nodeIds.has(l.target)
    );
    return { nodes: nodesFiltered, links: linksFiltered };
  }, [graph, linkTypesFilter, nodeTypesFilter]);

  const neighborIds = useMemo(() => {
    if (!focusedNodeId || !graphWithDegree.links.length) return new Set<string>();
    const s = new Set<string>();
    for (const l of graphWithDegree.links) {
      if (l.source === focusedNodeId) s.add(typeof l.target === 'object' ? (l.target as { id: string }).id : l.target);
      if (l.target === focusedNodeId) s.add(typeof l.source === 'object' ? (l.source as { id: string }).id : l.source);
    }
    return s;
  }, [focusedNodeId, graphWithDegree.links]);

  const searchMatchedIds = useMemo(() => {
    if (!searchInGraphDebounced.trim()) return new Set<string>();
    const q = searchInGraphDebounced.toLowerCase();
    return new Set(
      filteredGraph.nodes
        .filter((n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
        .map((n) => n.id)
    );
  }, [searchInGraphDebounced, filteredGraph.nodes]);

  const handleNodeClickInternal = useCallback(
    (nodeId: string, node?: GraphNode) => {
      setSelectedNodeIdInGraph(nodeId);
      onNodeClick?.(nodeId, node);
    },
    [onNodeClick]
  );

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      setIsFullscreen(false);
      maximizeButtonRef.current?.focus();
    } else {
      setIsFullscreen(true);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  useEffect(() => {
    const currentSvg = isFullscreen ? fullscreenSvgRef.current : svgRef.current;
    const currentContainer = isFullscreen ? fullscreenContainerRef.current : containerRef.current;
    if (!currentSvg || !currentContainer || filteredGraph.nodes.length === 0) return;

    const run = () => {
      cleanupRef.current?.();
      cleanupRef.current = renderGraph(currentSvg, currentContainer, {
        isFullscreen,
        height,
        graph: filteredGraph,
        onNodeClick,
        onNodeExplore,
        zoomRef: isFullscreen ? fullscreenZoomRef : undefined,
      });
    };

    const timeoutId = setTimeout(run, isFullscreen ? 100 : 0);
    return () => {
      clearTimeout(timeoutId);
      cleanupRef.current?.();
      cleanupRef.current = null;
      d3.selectAll('.kg-tooltip').remove();
    };
  }, [graphWithDegree, handleNodeClickInternal, onNodeExplore, height, isFullscreen, focusedNodeId, neighborIds, searchMatchedIds]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleResize = () => {
      if (!fullscreenSvgRef.current || !fullscreenContainerRef.current || graphWithDegree.nodes.length === 0) return;
      cleanupRef.current?.();
      cleanupRef.current = renderGraph(fullscreenSvgRef.current, fullscreenContainerRef.current, {
        isFullscreen: true,
        height,
        graph: graphWithDegree,
        onNodeClick: handleNodeClickInternal,
        onNodeExplore,
        onNodeContextMenu,
        zoomRef: fullscreenZoomRef,
        focusedNodeId,
        neighborIds,
        searchMatchedIds,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, graphWithDegree, handleNodeClickInternal, onNodeExplore, height, focusedNodeId, neighborIds, searchMatchedIds]);

  useEffect(() => {
    if (!isFullscreen) return;
    const raf = requestAnimationFrame(() => exitFullscreenButtonRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const container = fullscreenContainerRef.current;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !container) return;
      const focusable = container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleResetZoom = useCallback(() => {
    if (fullscreenZoomRef.current) {
      const { zoom, svg } = fullscreenZoomRef.current;
      svg.call(zoom.transform, d3.zoomIdentity);
    }
  }, []);

  const handleExportPng = useCallback(() => {
    const svgEl = fullscreenSvgRef.current;
    if (!svgEl) return;
    const w = svgEl.width.baseVal?.value || svgEl.getBoundingClientRect().width;
    const h = svgEl.height.baseVal?.value || svgEl.getBoundingClientRect().height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'knowledge-graph.png';
      a.click();
    };
    img.src = dataUrl;
  }, []);

  const handleExportSvg = useCallback(() => {
    const svgEl = fullscreenSvgRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge-graph.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  if (graph.nodes.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="flex flex-col items-center justify-center bg-background-glass-subtle border border-borders-subtle rounded-lg overflow-hidden"
        style={{ minHeight: `${height}px` }}
      >
        <div className="text-center p-8">
          <p className="text-text-secondary text-sm mb-2">No graph data available</p>
          <p className="text-text-tertiary text-xs">Start a search or paste a URL to build the knowledge graph</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Normal view */}
      <div
        ref={containerRef}
        className="relative w-full bg-background-glass-subtle border border-borders-subtle rounded-lg overflow-hidden"
        style={{ minHeight: `${height}px` }}
      >
        <button
          ref={maximizeButtonRef}
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-10 p-2 bg-background-overlay/80 backdrop-blur-sm border border-borders-subtle rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-overlay transition-colors"
          title="View in fullscreen"
          aria-label="Toggle fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <svg ref={svgRef} className="w-full" style={{ height: `${height}px` }} />
      </div>

      {/* Fullscreen modal overlay */}
      {isFullscreen && (
        <div
          ref={fullscreenContainerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Knowledge Graph - Fullscreen"
          className="fixed inset-0 bg-background-base z-[9999] flex flex-col"
        >
          <div className="h-16 min-h-16 bg-background-overlay/90 backdrop-blur-sm border-b border-borders-subtle flex items-center justify-between px-4 sm:px-6 flex-shrink-0 flex-wrap gap-2">
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-semibold text-text-primary">Knowledge Graph - Fullscreen</h2>
              {query && (
                <p className="text-sm text-text-secondary truncate max-w-md" title={query}>
                  Requête : {query}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setLegendOpen((o) => !o)}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-borders-subtle text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle text-sm"
                aria-expanded={legendOpen}
                aria-label={legendOpen ? 'Masquer la légende' : 'Afficher la légende'}
              >
                <PanelRightOpen className="w-4 h-4" />
                Légende
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-borders-subtle text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle text-sm"
                title="Reset zoom"
                aria-label="Reset zoom"
              >
                <ZoomOut className="w-4 h-4" />
                Reset zoom
              </button>
              <button
                type="button"
                onClick={handleExportPng}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-borders-subtle text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle text-sm"
                title="Export PNG"
                aria-label="Export PNG"
              >
                <Image className="w-4 h-4" />
                PNG
              </button>
              <button
                type="button"
                onClick={handleExportSvg}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-borders-subtle text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle text-sm"
                title="Export SVG"
                aria-label="Export SVG"
              >
                <Download className="w-4 h-4" />
                SVG
              </button>
              <span className="hidden sm:inline text-xs text-text-tertiary ml-1">ESC pour fermer</span>
              <button
                ref={exitFullscreenButtonRef}
                onClick={toggleFullscreen}
                className="p-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-glass-medium transition-colors"
                title="Exit fullscreen (ESC)"
                aria-label="Exit fullscreen"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          {legendOpen && (
            <div className="flex-shrink-0 border-b border-borders-subtle bg-background-elevated/80 px-4 py-3 flex flex-wrap gap-6 text-sm">
              <p className="w-full text-text-muted text-xs">Taille / opacité = confiance et nombre de sources.</p>
              {searchMode === 'fast' && (
                <p className="w-full text-text-muted text-xs">Liens déduits des co-occurrences (mode rapide).</p>
              )}
              <div className="w-full flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Rechercher dans le graphe..."
                  value={searchInGraph}
                  onChange={(e) => setSearchInGraph(e.target.value)}
                  className="flex-1 min-w-[180px] px-3 py-1.5 bg-background-base border border-borders-subtle rounded-lg text-text-primary text-sm placeholder:text-text-muted"
                />
                {selectedNodeIdInGraph && (
                  <>
                    <button
                      type="button"
                      onClick={() => setFocusedNodeId(selectedNodeIdInGraph)}
                      className="px-3 py-1.5 bg-accent/20 text-accent rounded-lg text-sm hover:bg-accent/30"
                    >
                      Focus
                    </button>
                    <button
                      type="button"
                      onClick={() => setFocusedNodeId(null)}
                      className="px-3 py-1.5 bg-borders-subtle text-text-secondary rounded-lg text-sm hover:bg-borders-medium"
                    >
                      Reset focus
                    </button>
                  </>
                )}
                {focusedNodeId && !selectedNodeIdInGraph && (
                  <button
                    type="button"
                    onClick={() => setFocusedNodeId(null)}
                    className="px-3 py-1.5 bg-borders-subtle text-text-secondary rounded-lg text-sm hover:bg-borders-medium"
                  >
                    Reset focus
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-text-secondary font-medium">Nœuds</span>
                {NODE_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nodeTypesFilter.has(t)}
                      onChange={() => toggleNodeType(t)}
                      className="rounded border-borders-subtle"
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getNodeColor(t) }}
                    />
                    <span className="text-text-primary">{t}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-text-secondary font-medium">Liens</span>
                {LINK_TYPES.map((t) => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkTypesFilter.has(t)}
                      onChange={() => toggleLinkType(t)}
                      className="rounded border-borders-subtle"
                    />
                    <span
                      className="w-6 h-0.5 shrink-0"
                      style={{ backgroundColor: getLinkColor(t) }}
                    />
                    <span className="text-text-primary">{t.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex-1 w-full h-full overflow-hidden" id="fullscreen-graph-container">
            <svg ref={fullscreenSvgRef} className="w-full h-full" />
          </div>
        </div>
      )}
    </>
  );
}

// Drag behavior
function drag(simulation: d3.Simulation<any, undefined>) {
  function dragstarted(event: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event: any) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event: any) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag<SVGCircleElement, any>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}

// Helper functions
function getNodeColor(type: string): string {
  const colors: Record<string, string> = {
    event: '#E1463E',
    article: '#F97316',
    document: '#9CA3AF',
    country: '#3B82F6',
    company: '#10B981',
    commodity: '#F59E0B',
    organization: '#8B5CF6',
    person: '#EC4899',
  };
  return colors[type] || '#6B7280';
}

function getNodeBaseSize(type: string): number {
  const sizes: Record<string, number> = {
    event: 12,
    article: 11,
    document: 10,
    country: 10,
    company: 8,
    commodity: 8,
    organization: 8,
    person: 6,
  };
  return sizes[type] || 8;
}

function getNodeSizeFromData(d: {
  type: string;
  confidence?: number;
  sourceCount?: number;
  normalizedDegree?: number;
}): number {
  const base = getNodeBaseSize(d.type);
  const normDeg = d.normalizedDegree ?? 0;
  const conf = d.confidence ?? 0.5;
  const sc = d.sourceCount ?? 0;
  const importance = base * (0.5 + 0.3 * normDeg + 0.2 * conf) * Math.min(1.5, 1 + Math.log10(1 + sc) * 0.3);
  return Math.max(NODE_SIZE_MIN, Math.min(NODE_SIZE_MAX, Math.round(importance)));
}

function isDirectionalLinkType(type: string): boolean {
  return ['causes', 'precedes', 'operates_in', 'exposes_to', 'impacts'].includes(type);
}

function getLinkColor(type: string): string {
  const colors: Record<string, string> = {
    causes: '#EF4444',
    precedes: '#3B82F6',
    related_to: '#6B7280',
    operates_in: '#10B981',
    exposes_to: '#F59E0B',
    impacts: '#E1463E',
  };
  return colors[type] || '#6B7280';
}
