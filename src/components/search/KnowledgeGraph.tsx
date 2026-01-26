/**
 * Knowledge Graph
 * 
 * D3.js force-directed graph visualization with fullscreen support
 */

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { KnowledgeGraph as KnowledgeGraphType } from '../../types/search';

interface KnowledgeGraphProps {
  graph: KnowledgeGraphType;
  onNodeClick?: (nodeId: string) => void;
  onNodeExplore?: (nodeId: string, nodeLabel: string) => void;
  height?: number;
}

export default function KnowledgeGraph({ graph, onNodeClick, onNodeExplore, height = 600 }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const fullscreenSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen toggle (using modal overlay approach, more reliable than browser fullscreen API)
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  // Render graph
  useEffect(() => {
    const currentSvg = isFullscreen ? fullscreenSvgRef.current : svgRef.current;
    const currentContainer = isFullscreen ? fullscreenContainerRef.current : containerRef.current;
    if (!currentSvg || !currentContainer || graph.nodes.length === 0) {
      return;
    }

    // Wait for container to be ready, especially for fullscreen
    const updateGraph = () => {
      const width = currentContainer.clientWidth;
      const graphHeight = isFullscreen ? window.innerHeight - 80 : height; // Reserve space for header in fullscreen

      // Clear previous render
      d3.select(currentSvg).selectAll('*').remove();

      const svg = d3.select(currentSvg)
        .attr('width', width)
        .attr('height', graphHeight);

      // Create container for zoom
      const g = svg.append('g');

      // Zoom behavior
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom);

      // Create force simulation
      const simulation = d3.forceSimulation(graph.nodes as any)
        .force('link', d3.forceLink(graph.links).id((d: any) => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, graphHeight / 2))
        .force('collision', d3.forceCollide().radius(30));

      // Create links
      const link = g.append('g')
        .selectAll('line')
        .data(graph.links)
        .enter()
        .append('line')
        .attr('stroke', (d) => getLinkColor(d.type))
        .attr('stroke-opacity', 0.6)
        .attr('stroke-width', (d) => d.strength * 3);

      // Create nodes
      const node = g.append('g')
        .selectAll('circle')
        .data(graph.nodes)
        .enter()
        .append('circle')
        .attr('r', (d) => getNodeSize(d.type))
        .attr('fill', (d) => getNodeColor(d.type))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .call(drag(simulation) as any)
        .on('click', (event, d: any) => {
          event.stopPropagation();
          // Double-click or Ctrl+Click = explore, single click = select
          if (event.ctrlKey || event.metaKey) {
            // Explore mode: trigger contextual search
            if (onNodeExplore) {
              onNodeExplore(d.id, d.label);
            }
          } else {
            // Select mode: show details
            if (onNodeClick) {
              onNodeClick(d.id);
            }
          }
        })
        .on('dblclick', (event, d: any) => {
          event.stopPropagation();
          // Double-click = explore
          if (onNodeExplore) {
            onNodeExplore(d.id, d.label);
          }
        });

      // Add labels
      const label = g.append('g')
        .selectAll('text')
        .data(graph.nodes)
        .enter()
        .append('text')
        .text((d) => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label)
        .attr('font-size', '10px')
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .attr('dy', (d) => getNodeSize(d.type) + 12);

      // Tooltip
      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('font-size', '12px')
        .style('z-index', '1000');

      node
        .on('mouseover', (event, d: any) => {
          tooltip.transition().duration(200).style('opacity', 1);
          tooltip.html(`${d.label}<br/>${d.type}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', () => {
          tooltip.transition().duration(200).style('opacity', 0);
        });

      // Update positions on simulation tick
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node
          .attr('cx', (d: any) => d.x)
          .attr('cy', (d: any) => d.y);

        label
          .attr('x', (d: any) => d.x)
          .attr('y', (d: any) => d.y);
      });

      // Return cleanup function
      return () => {
        simulation.stop();
        tooltip.remove();
      };
    };

    // Small delay to ensure container is ready, especially for fullscreen
    const timeoutId = setTimeout(updateGraph, isFullscreen ? 100 : 0);

    return () => {
      clearTimeout(timeoutId);
      // Also cleanup any existing tooltips
      d3.selectAll('.tooltip').remove();
    };
  }, [graph, onNodeClick, onNodeExplore, height, isFullscreen]);

  // Handle window resize in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleResize = () => {
      // Trigger re-render on resize
      if (svgRef.current && fullscreenContainerRef.current && graph.nodes.length > 0) {
        const width = fullscreenContainerRef.current.clientWidth;
        const graphHeight = window.innerHeight - 80;
        
        d3.select(svgRef.current)
          .attr('width', width)
          .attr('height', graphHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, graph.nodes.length]);

  if (graph.nodes.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="flex flex-col items-center justify-center bg-background-glass-subtle border border-borders-subtle rounded-lg overflow-hidden"
        style={{ minHeight: `${height}px` }}
      >
        <div className="text-center p-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <p className="text-text-secondary text-sm">Graph processing active</p>
          </div>
          <p className="text-text-tertiary text-xs">No relationships detected for this query. Start a search or paste a URL to build the knowledge graph.</p>
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
        {/* Fullscreen button */}
        <button
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
          className="fixed inset-0 bg-background-base z-[9999] flex flex-col"
        >
          {/* Fullscreen header */}
          <div className="h-16 bg-background-overlay/90 backdrop-blur-sm border-b border-borders-subtle flex items-center justify-between px-6 flex-shrink-0">
            <h2 className="text-lg font-semibold text-text-primary">Knowledge Graph - Fullscreen</h2>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-glass-medium transition-colors"
              title="Exit fullscreen (ESC)"
              aria-label="Exit fullscreen"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
          {/* Fullscreen SVG container */}
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

function getNodeSize(type: string): number {
  const sizes: Record<string, number> = {
    event: 12,
    country: 10,
    company: 8,
    commodity: 8,
    organization: 8,
    person: 6,
  };
  return sizes[type] || 8;
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
