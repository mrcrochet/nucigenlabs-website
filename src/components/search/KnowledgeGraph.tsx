/**
 * Knowledge Graph
 *
 * D3.js force-directed graph visualization with fullscreen support
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as d3 from 'd3';
import { Maximize2, Minimize2, PanelRightOpen, ZoomOut, Download, Image, Filter } from 'lucide-react';
import type { KnowledgeGraph as KnowledgeGraphType } from '../../types/search';

const LABEL_MAX_LEN_NORMAL = 15;
const LABEL_MAX_LEN_FULLSCREEN = 30;
/** Max nodes to render for performance; above this we keep top by (sourceCount * confidence) */
const MAX_NODES = 150;

const NODE_TYPES = ['event', 'country', 'company', 'commodity', 'organization', 'person'] as const;
const LINK_TYPES = ['causes', 'precedes', 'related_to', 'operates_in', 'exposes_to', 'impacts'] as const;

/** Zoom level above which node labels are shown */
const LABEL_VISIBLE_ZOOM = 0.5;
/** Zoom level above which link type labels are shown along edges */
const LINK_LABEL_VISIBLE_ZOOM = 1.2;
/** Simulation cools down faster to limit CPU (fewer ticks) */
const ALPHA_DECAY = 0.06;

interface KnowledgeGraphProps {
  graph: KnowledgeGraphType;
  query?: string;
  onNodeClick?: (nodeId: string) => void;
  onNodeExplore?: (nodeId: string, nodeLabel: string) => void;
  height?: number;
  /** Optional node id to center the view on when the graph is ready */
  focusNodeId?: string | null;
  /** If set, only these node types are shown (default: all) */
  visibleNodeTypes?: string[] | null;
  /** If set, only these link types are shown (default: all) */
  visibleLinkTypes?: string[] | null;
  /** When provided, enables filter UI in fullscreen (same state as parent) */
  filterControls?: {
    visibleNodeTypes: string[] | null;
    visibleLinkTypes: string[] | null;
    setVisibleNodeTypes: (v: string[] | null) => void;
    setVisibleLinkTypes: (v: string[] | null) => void;
    filtersOpen: boolean;
    setFiltersOpen: (v: boolean) => void;
  };
}

type ZoomRef = { zoom: d3.ZoomBehavior<SVGSVGElement, unknown>; svg: d3.Selection<SVGSVGElement, unknown, null, undefined> };

function renderGraph(
  svgEl: SVGSVGElement,
  containerEl: HTMLDivElement,
  opts: {
    isFullscreen: boolean;
    height: number;
    graph: KnowledgeGraphType;
    onNodeClick?: (nodeId: string) => void;
    onNodeExplore?: (nodeId: string, nodeLabel: string) => void;
    zoomRef?: React.MutableRefObject<ZoomRef | null>;
    focusNodeId?: string | null;
    visibleNodeTypes?: string[] | null;
    visibleLinkTypes?: string[] | null;
  }
): () => void {
  const { isFullscreen, height, graph, onNodeClick, onNodeExplore, zoomRef, focusNodeId, visibleNodeTypes, visibleLinkTypes } = opts;
  const width = containerEl.clientWidth;
  const graphHeight = isFullscreen ? window.innerHeight - 80 : height;
  const labelMaxLen = isFullscreen ? LABEL_MAX_LEN_FULLSCREEN : LABEL_MAX_LEN_NORMAL;

  const filteredNodes = visibleNodeTypes?.length
    ? graph.nodes.filter((n) => visibleNodeTypes.includes(n.type))
    : graph.nodes;
  const nodeIdSet = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = graph.links.filter((l) => {
    const src = typeof l.source === 'object' ? (l.source as { id: string }).id : l.source;
    const tgt = typeof l.target === 'object' ? (l.target as { id: string }).id : l.target;
    if (!nodeIdSet.has(src) || !nodeIdSet.has(tgt)) return false;
    if (visibleLinkTypes?.length) return visibleLinkTypes.includes(l.type);
    return true;
  });
  const displayGraph = { nodes: filteredNodes, links: filteredLinks };

  d3.select(svgEl).selectAll('*').remove();

  const svg = d3.select(svgEl).attr('width', width).attr('height', graphHeight);
  const g = svg.append('g');

  let labelGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  let linkLabelGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr('transform', event.transform);
      if (labelGroup) labelGroup.attr('opacity', event.transform.k >= LABEL_VISIBLE_ZOOM ? 1 : 0);
      if (linkLabelGroup) linkLabelGroup.attr('opacity', event.transform.k >= LINK_LABEL_VISIBLE_ZOOM ? 1 : 0);
    });

  svg.call(zoom);
  if (zoomRef) zoomRef.current = { zoom, svg };

  const simulation = d3.forceSimulation(displayGraph.nodes as d3.SimulationNodeDatum & { id: string; x?: number; y?: number }[])
    .force('link', d3.forceLink(displayGraph.links).id((d: any) => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, graphHeight / 2))
    .force('collision', d3.forceCollide().radius(30))
    .alphaDecay(ALPHA_DECAY);

  const link = g.append('g')
    .selectAll('line')
    .data(displayGraph.links)
    .enter()
    .append('line')
    .attr('stroke', (d: any) => getLinkColor(d.type))
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', (d: any) => d.strength * 3);

  const node = g.append('g')
    .selectAll('circle')
    .data(displayGraph.nodes)
    .enter()
    .append('circle')
    .attr('r', (d: any) => getNodeSize(d))
    .attr('fill', (d: any) => getNodeColor(d.type))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .call(drag(simulation) as any)
    .on('click', (event: any, d: any) => {
      event.stopPropagation();
      if (event.ctrlKey || event.metaKey) {
        onNodeExplore?.(d.id, d.label);
      } else {
        onNodeClick?.(d.id);
      }
    })
    .on('dblclick', (event: any, d: any) => {
      event.stopPropagation();
      onNodeExplore?.(d.id, d.label);
    });

  const labelG = g.append('g');
  labelGroup = labelG;
  const label = labelG
    .selectAll('text')
    .data(displayGraph.nodes)
    .enter()
    .append('text')
    .text((d: any) => (d.label.length > labelMaxLen ? d.label.substring(0, labelMaxLen) + '...' : d.label))
    .attr('font-size', '10px')
    .attr('fill', '#fff')
    .attr('text-anchor', 'middle')
    .attr('dy', (d: any) => getNodeSize(d) + 12)
    .attr('opacity', 1);

  if (focusNodeId) {
    simulation.on('end', () => {
      const node = displayGraph.nodes.find((n: any) => n.id === focusNodeId) as any;
      if (node && node.x != null && node.y != null) {
        const scale = 1;
        const tx = width / 2 - node.x * scale;
        const ty = graphHeight / 2 - node.y * scale;
        svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
    });
  }

  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'kg-tooltip')
    .attr('role', 'tooltip')
    .attr('aria-live', 'polite')
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
      const confidencePct = d.confidence != null ? Math.round((d.confidence ?? 0) * 100) : null;
      const sources = d.sourceCount ?? 1;
      let html = `${d.label}<br/><span style="color:#94a3b8">${d.type}</span>`;
      if (confidencePct != null) html += `<br/>Confidence: ${confidencePct}%`;
      html += `<br/>Sources: ${sources}`;
      tooltip.html(html)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', () => tooltip.transition().duration(200).style('opacity', 0));

  link
    .on('mouseover', (event: any, d: any) => {
      tooltip.transition().duration(200).style('opacity', 1);
      const typeLabel = String(d.type).replace('_', ' ');
      const strengthVal = d.strength != null ? (typeof d.strength === 'number' ? d.strength.toFixed(1) : d.strength) : '';
      tooltip.html(`<span style="color:#94a3b8">Type: ${typeLabel}</span>${strengthVal ? `<br/>Strength: ${strengthVal}` : ''}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', () => tooltip.transition().duration(200).style('opacity', 0));

  const linkLabelG = g.append('g').attr('class', 'link-labels');
  linkLabelGroup = linkLabelG;
  const linkLabel = linkLabelG
    .selectAll('text')
    .data(displayGraph.links)
    .enter()
    .append('text')
    .attr('font-size', '9px')
    .attr('fill', 'rgba(148,163,184,0.9)')
    .attr('text-anchor', 'middle')
    .text((d: any) => String(d.type).replace('_', ' '));

  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);
    node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
    label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    linkLabel
      .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
      .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
  });
  const currentTransform = d3.zoomTransform(svg.node()!);
  if (labelGroup) labelGroup.attr('opacity', currentTransform.k >= LABEL_VISIBLE_ZOOM ? 1 : 0);
  if (linkLabelGroup) linkLabelGroup.attr('opacity', currentTransform.k >= LINK_LABEL_VISIBLE_ZOOM ? 1 : 0);

  return () => {
    simulation.stop();
    tooltip.remove();
  };
}

export default function KnowledgeGraph({ graph, query, onNodeClick, onNodeExplore, height = 600, focusNodeId, visibleNodeTypes = null, visibleLinkTypes = null, filterControls }: KnowledgeGraphProps) {
  const { graphToRender, cappedMessage } = useMemo(() => {
    if (graph.nodes.length <= MAX_NODES) return { graphToRender: graph, cappedMessage: null as string | null };
    const scored = [...graph.nodes].sort((a, b) => {
      const sa = (a.sourceCount ?? 0) * (a.confidence ?? 0.5);
      const sb = (b.sourceCount ?? 0) * (b.confidence ?? 0.5);
      return sb - sa;
    });
    const top = scored.slice(0, MAX_NODES);
    const ids = new Set(top.map((n) => n.id));
    const links = graph.links.filter((l) => {
      const src = typeof l.source === 'object' ? (l.source as { id: string }).id : l.source;
      const tgt = typeof l.target === 'object' ? (l.target as { id: string }).id : l.target;
      return ids.has(src) && ids.has(tgt);
    });
    return {
      graphToRender: { nodes: top, links },
      cappedMessage: `Graphe limité à ${MAX_NODES} nœuds pour la lisibilité.`,
    };
  }, [graph]);

  const svgRef = useRef<SVGSVGElement>(null);
  const fullscreenSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const normalZoomRef = useRef<ZoomRef | null>(null);
  const fullscreenZoomRef = useRef<ZoomRef | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const maximizeButtonRef = useRef<HTMLButtonElement>(null);
  const exitFullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

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
    if (!currentSvg || !currentContainer || graphToRender.nodes.length === 0) return;

    const run = () => {
      cleanupRef.current?.();
      cleanupRef.current = renderGraph(currentSvg, currentContainer, {
        isFullscreen,
        height,
        graph: graphToRender,
        onNodeClick,
        onNodeExplore,
        zoomRef: isFullscreen ? fullscreenZoomRef : normalZoomRef,
        focusNodeId,
        visibleNodeTypes,
        visibleLinkTypes,
      });
    };

    const timeoutId = setTimeout(run, isFullscreen ? 100 : 0);
    return () => {
      clearTimeout(timeoutId);
      cleanupRef.current?.();
      cleanupRef.current = null;
      d3.selectAll('.kg-tooltip').remove();
    };
  }, [graphToRender, onNodeClick, onNodeExplore, height, isFullscreen, focusNodeId, visibleNodeTypes, visibleLinkTypes]);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleResize = () => {
      if (!fullscreenSvgRef.current || !fullscreenContainerRef.current || graphToRender.nodes.length === 0) return;
      cleanupRef.current?.();
      cleanupRef.current = renderGraph(fullscreenSvgRef.current, fullscreenContainerRef.current, {
        isFullscreen: true,
        height,
        graph: graphToRender,
        onNodeClick,
        onNodeExplore,
        zoomRef: fullscreenZoomRef,
        focusNodeId,
        visibleNodeTypes,
        visibleLinkTypes,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, graphToRender, onNodeClick, onNodeExplore, height, visibleNodeTypes, visibleLinkTypes]);

  useEffect(() => {
    if (!isFullscreen) return;
    const raf = requestAnimationFrame(() => exitFullscreenButtonRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [isFullscreen]);

  const handleResetZoom = useCallback(() => {
    if (fullscreenZoomRef.current) {
      const { zoom, svg } = fullscreenZoomRef.current;
      svg.call(zoom.transform, d3.zoomIdentity);
    }
  }, []);

  const handleResetZoomNormal = useCallback(() => {
    if (normalZoomRef.current) {
      const { zoom, svg } = normalZoomRef.current;
      svg.call(zoom.transform, d3.zoomIdentity);
    }
  }, []);

  const handleFullscreenZoom = useCallback((direction: 'in' | 'out') => {
    const ref = fullscreenZoomRef.current;
    if (!ref) return;
    const { zoom, svg } = ref;
    const sel = d3.select(svg);
    const current = d3.zoomTransform(sel.node() as Element);
    const factor = direction === 'in' ? 1.2 : 1 / 1.2;
    const k = Math.min(4, Math.max(0.1, current.k * factor));
    sel.call(zoom.transform, d3.zoomIdentity.translate(current.x, current.y).scale(k));
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const container = fullscreenContainerRef.current;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const target = document.activeElement as HTMLElement;
        if (!target || target === document.body || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
          handleResetZoom();
          return;
        }
      }
      if (e.key === '=' || e.key === '+') {
        const target = document.activeElement as HTMLElement;
        if (!target || target === document.body || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
          e.preventDefault();
          handleFullscreenZoom('in');
          return;
        }
      }
      if (e.key === '-') {
        const target = document.activeElement as HTMLElement;
        if (!target || target === document.body || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) {
          e.preventDefault();
          handleFullscreenZoom('out');
          return;
        }
      }
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
  }, [isFullscreen, handleResetZoom, handleFullscreenZoom]);

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

  if (graphToRender.nodes.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="flex flex-col items-center justify-center bg-background-glass-subtle border border-borders-subtle rounded-lg overflow-hidden"
        style={{ minHeight: `${height}px` }}
      >
        <div className="text-center p-8 max-w-sm">
          <p className="text-text-secondary text-sm mb-2">Aucun graphe pour l&apos;instant.</p>
          <p className="text-text-tertiary text-xs mb-4">
            Lancez une recherche ou collez une URL pour construire le knowledge graph.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-borders-subtle hover:bg-borders-medium text-text-primary text-sm font-medium transition-colors"
          >
            Faire une recherche
          </Link>
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
        {cappedMessage && (
          <p className="absolute top-2 left-1/2 -translate-x-1/2 z-10 text-xs text-text-tertiary bg-background-overlay/90 px-2 py-1 rounded" role="status">
            {cappedMessage}
          </p>
        )}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            {query && (
              <span className="text-text-tertiary text-xs truncate max-w-[120px] sm:max-w-[200px]" title={query}>
                Requête : {query.length > 40 ? `${query.slice(0, 37)}…` : query}
              </span>
            )}
            <button
              type="button"
              onClick={handleResetZoomNormal}
              className="p-2 bg-background-overlay/80 backdrop-blur-sm border border-borders-subtle rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-overlay transition-colors text-xs font-medium flex items-center gap-1.5"
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
              Reset zoom
            </button>
            <button
              type="button"
              onClick={() => setLegendOpen((o) => !o)}
              className="p-2 bg-background-overlay/80 backdrop-blur-sm border border-borders-subtle rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-overlay transition-colors text-xs font-medium flex items-center gap-1.5"
              aria-expanded={legendOpen}
              aria-label={legendOpen ? 'Masquer la légende' : 'Afficher la légende'}
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
              Légende
            </button>
          </div>
          <button
            ref={maximizeButtonRef}
            onClick={toggleFullscreen}
            className="p-2 bg-background-overlay/80 backdrop-blur-sm border border-borders-subtle rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-overlay transition-colors"
            title="View in fullscreen"
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        {legendOpen && (
          <div className="absolute bottom-4 left-4 right-4 z-10 flex-shrink-0 border border-borders-subtle rounded-lg bg-background-overlay/95 backdrop-blur-sm px-3 py-2 flex flex-wrap gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-text-secondary font-medium">Nœuds</span>
              {NODE_TYPES.map((t) => (
                <span key={t} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getNodeColor(t) }} />
                  <span className="text-text-primary">{t}</span>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-text-secondary font-medium">Liens</span>
              {LINK_TYPES.map((t) => (
                <span key={t} className="flex items-center gap-1">
                  <span className="w-4 h-0.5 shrink-0" style={{ backgroundColor: getLinkColor(t) }} />
                  <span className="text-text-primary">{t.replace('_', ' ')}</span>
                </span>
              ))}
            </div>
          </div>
        )}
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
          <div className="min-h-16 py-3 bg-background-overlay/90 backdrop-blur-sm border-b border-borders-subtle flex items-center justify-between px-4 sm:px-6 flex-shrink-0 flex-wrap gap-2">
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-semibold text-text-primary">Knowledge Graph - Fullscreen</h2>
              {query && (
                <p className="text-sm text-text-secondary truncate max-w-md" title={query}>
                  Requête : {query}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {filterControls && (
                <button
                  type="button"
                  onClick={() => filterControls.setFiltersOpen(!filterControls.filtersOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-borders-subtle text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle text-sm"
                  aria-expanded={filterControls.filtersOpen}
                  aria-label={filterControls.filtersOpen ? 'Masquer les filtres' : 'Afficher les filtres'}
                >
                  <Filter className="w-4 h-4" />
                  Filtres
                </button>
              )}
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
              <span className="hidden sm:inline text-xs text-text-tertiary ml-1">ESC fermer · R reset · +/− zoom</span>
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
          {filterControls && filterControls.filtersOpen && (
            <div className="flex-shrink-0 border-b border-borders-subtle bg-background-elevated/80 px-4 pt-4 pb-3 text-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-text-primary">Filtres par type</span>
                <button
                  type="button"
                  onClick={() => filterControls.setFiltersOpen(false)}
                  className="text-text-tertiary hover:text-text-primary text-xs"
                >
                  Fermer
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-text-secondary mb-1.5">Nœuds</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {NODE_TYPES.map((t) => {
                      const selected = filterControls.visibleNodeTypes === null || filterControls.visibleNodeTypes.includes(t);
                      return (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              const all = [...NODE_TYPES];
                              if (filterControls.visibleNodeTypes === null) {
                                filterControls.setVisibleNodeTypes(all.filter((x) => x !== t));
                              } else if (selected) {
                                const next = filterControls.visibleNodeTypes.filter((x) => x !== t);
                                filterControls.setVisibleNodeTypes(next.length ? next : null);
                              } else {
                                const next = [...filterControls.visibleNodeTypes, t];
                                filterControls.setVisibleNodeTypes(next.length === all.length ? null : next);
                              }
                            }}
                          />
                          <span className="text-text-primary capitalize">{t}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-text-secondary mb-1.5">Liens</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {LINK_TYPES.map((t) => {
                      const selected = filterControls.visibleLinkTypes === null || filterControls.visibleLinkTypes.includes(t);
                      return (
                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              const all = [...LINK_TYPES];
                              if (filterControls.visibleLinkTypes === null) {
                                filterControls.setVisibleLinkTypes(all.filter((x) => x !== t));
                              } else if (selected) {
                                const next = filterControls.visibleLinkTypes.filter((x) => x !== t);
                                filterControls.setVisibleLinkTypes(next.length ? next : null);
                              } else {
                                const next = [...filterControls.visibleLinkTypes, t];
                                filterControls.setVisibleLinkTypes(next.length === all.length ? null : next);
                              }
                            }}
                          />
                          <span className="text-text-primary">{t.replace('_', ' ')}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          {legendOpen && (
            <div className="flex-shrink-0 border-b border-borders-subtle bg-background-elevated/80 px-4 py-3 flex flex-wrap gap-6 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-text-secondary font-medium">Nœuds</span>
                {NODE_TYPES.map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: getNodeColor(t) }}
                    />
                    <span className="text-text-primary">{t}</span>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-text-secondary font-medium">Liens</span>
                {LINK_TYPES.map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span
                      className="w-6 h-0.5 shrink-0"
                      style={{ backgroundColor: getLinkColor(t) }}
                    />
                    <span className="text-text-primary">{t.replace('_', ' ')}</span>
                  </span>
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
    country: '#3B82F6',
    company: '#10B981',
    commodity: '#F59E0B',
    organization: '#8B5CF6',
    person: '#EC4899',
  };
  return colors[type] || '#6B7280';
}

function getNodeSize(d: { type: string; sourceCount?: number; confidence?: number }): number {
  const sizes: Record<string, number> = {
    event: 12,
    country: 10,
    company: 8,
    commodity: 8,
    organization: 8,
    person: 6,
  };
  const base = sizes[d.type] ?? 8;
  const count = d.sourceCount ?? 1;
  const mult = 1 + Math.min(count / 5, 2);
  const r = Math.min(24, Math.max(5, base * mult));
  return r;
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
