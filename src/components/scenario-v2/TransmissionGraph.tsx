import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import type { TransmissionGraphData, TransmissionNode } from '../../types/scenario-v2';
import TransmissionNodeTooltip from './TransmissionNodeTooltip';

interface TransmissionGraphProps {
  data: TransmissionGraphData;
  height?: number;
}

const NODE_COLORS: Record<string, string> = {
  event: '#E1463E',
  sector: '#3B82F6',
  region: '#A855F7',
  asset: '#F59E0B',
};

const NODE_SIZES: Record<string, number> = {
  event: 22,
  sector: 16,
  region: 14,
  asset: 12,
};

export default function TransmissionGraph({ data, height = 400 }: TransmissionGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [tooltipNode, setTooltipNode] = useState<TransmissionNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleNodeClick = useCallback((node: TransmissionNode, event: MouseEvent) => {
    setTooltipNode(node);
    setTooltipPos({ x: event.clientX, y: event.clientY });
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl || data.nodes.length === 0) return;

    cleanupRef.current?.();

    const width = containerEl.clientWidth;
    const graphHeight = height;

    d3.select(svgEl).selectAll('*').remove();

    const svg = d3.select(svgEl)
      .attr('width', width)
      .attr('height', graphHeight);

    const g = svg.append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Deep clone data for D3 mutation
    const nodes = data.nodes.map(n => ({ ...n }));
    const links = data.links.map(l => ({ ...l }));

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(90))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, graphHeight / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (NODE_SIZES[d.type] || 12) + 8))
      .alphaDecay(0.05);

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', (d: any) => Math.max(1, d.weight * 3));

    // Node groups
    const nodeGroup = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(drag(simulation) as any);

    // Node circles
    nodeGroup
      .append('circle')
      .attr('r', (d: any) => NODE_SIZES[d.type] || 12)
      .attr('fill', (d: any) => NODE_COLORS[d.type] || '#6B7280')
      .attr('fill-opacity', 0.15)
      .attr('stroke', (d: any) => NODE_COLORS[d.type] || '#6B7280')
      .attr('stroke-width', 1.5);

    // Node labels
    nodeGroup
      .append('text')
      .text((d: any) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('letter-spacing', '1px')
      .attr('fill', '#ffffff')
      .attr('opacity', 0.9);

    // Click handler
    nodeGroup.on('click', (event: any, d: any) => {
      event.stopPropagation();
      const originalNode = data.nodes.find(n => n.id === d.id);
      if (originalNode) handleNodeClick(originalNode, event.sourceEvent || event);
    });

    // Hover effect
    nodeGroup
      .on('mouseover', function () {
        d3.select(this).select('circle')
          .attr('fill-opacity', 0.3)
          .attr('stroke-width', 2.5);
      })
      .on('mouseout', function () {
        d3.select(this).select('circle')
          .attr('fill-opacity', 0.15)
          .attr('stroke-width', 1.5);
      });

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    cleanupRef.current = () => {
      simulation.stop();
    };

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [data, height, handleNodeClick]);

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-5 h-full">
      <div className="text-[0.7rem] uppercase tracking-[2px] text-white font-light mb-1 pb-3 border-b border-white/[0.05] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
        TRANSMISSION CHAIN
      </div>
      <div
        ref={containerRef}
        className="relative mt-4 bg-white/[0.01] rounded-lg border border-white/[0.04] overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <svg ref={svgRef} className="w-full h-full" />

        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-4 text-[0.6rem] font-mono text-zinc-600">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {type.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {tooltipNode && (
        <TransmissionNodeTooltip
          node={tooltipNode}
          position={tooltipPos}
          onClose={() => setTooltipNode(null)}
        />
      )}
    </div>
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

  return d3.drag<SVGGElement, any>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
}
