/**
 * SignalEvidenceGraph - Evidence graph visualization with D3.js
 * 
 * nodes: events/entities/assets
 * edges: "linked by"
 */

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { getNormalizedEventById } from '../../lib/supabase';
import type { Signal } from '../../types/intelligence';
import type { Event } from '../../types/intelligence';
import { Maximize2, Minimize2, Sparkles } from 'lucide-react';

interface SignalEvidenceGraphProps {
  signal: Signal;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'signal' | 'event';
  data?: Event;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export default function SignalEvidenceGraph({ signal }: SignalEvidenceGraphProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const fullscreenSvgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const loadEvents = async () => {
    if (!signal.related_event_ids || signal.related_event_ids.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const loadedEvents = await Promise.all(
        signal.related_event_ids.map(async (id) => {
          try {
            return await getNormalizedEventById(id);
          } catch (err: any) {
            console.warn(`[SignalEvidenceGraph] Failed to load event ${id}:`, err);
            return null;
          }
        })
      );
      // Filter out null values (failed loads)
      const validEvents = loadedEvents.filter((e): e is Event => e !== null);
      setEvents(validEvents);
      
      if (validEvents.length === 0 && signal.related_event_ids.length > 0) {
        setError(`Unable to load ${signal.related_event_ids.length} related event${signal.related_event_ids.length > 1 ? 's' : ''}. They may still be processing.`);
      }
    } catch (error: any) {
      console.error('[SignalEvidenceGraph] Error loading events:', error);
      setEvents([]);
      setError(error.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [signal.related_event_ids]);

  // Render D3 graph
  useEffect(() => {
    const currentSvg = isFullscreen ? fullscreenSvgRef.current : svgRef.current;
    const currentContainer = isFullscreen ? fullscreenContainerRef.current : containerRef.current;
    
    if (!currentSvg || !currentContainer || events.length === 0) {
      return;
    }

    // Build graph data
    const nodes: GraphNode[] = [
      {
        id: signal.id,
        label: signal.title.length > 30 ? signal.title.substring(0, 30) + '...' : signal.title,
        type: 'signal',
      },
      ...events.map((event) => ({
        id: event.id,
        label: (event.headline || event.title || 'Event').length > 25 
          ? (event.headline || event.title || 'Event').substring(0, 25) + '...' 
          : (event.headline || event.title || 'Event'),
        type: 'event' as const,
        data: event,
      })),
    ];

    const links: GraphLink[] = events.map((event) => ({
      source: event.id,
      target: signal.id,
      type: 'evidence',
    }));

    const width = currentContainer.clientWidth;
    const height = isFullscreen ? window.innerHeight - 100 : 400;

    // Clear previous render
    d3.select(currentSvg).selectAll('*').remove();

    const svg = d3.select(currentSvg)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#E1463E')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 2);

    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => d.type === 'signal' ? 20 : 12)
      .attr('fill', (d) => d.type === 'signal' ? '#E1463E' : '#6366f1')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', (d: any) => (d.type === 'signal' ? 25 : 15));
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('r', (d: any) => (d.type === 'signal' ? 20 : 12));
      });

    // Add labels
    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((d) => d.label)
      .attr('font-size', (d) => d.type === 'signal' ? '12px' : '10px')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => d.type === 'signal' ? 35 : 20)
      .attr('pointer-events', 'none');

    // Tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(10, 10, 10, 0.95)')
      .style('color', '#fff')
      .style('padding', '12px')
      .style('border-radius', '8px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('border', '1px solid rgba(255,255,255,0.1)')
      .style('max-width', '300px');

    node.on('mouseover', function(event, d: any) {
      tooltip.transition().duration(200).style('opacity', 0.95);
      let content = `<strong>${d.label}</strong>`;
      if (d.type === 'event' && d.data) {
        content += `<br/><span style="font-size: 11px; color: #999;">${new Date(d.data.date).toLocaleDateString()}</span>`;
        if (d.data.location) {
          content += `<br/><span style="font-size: 11px; color: #999;">📍 ${d.data.location}</span>`;
        }
      }
      tooltip.html(content)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    }).on('mouseout', function() {
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

    return () => {
      tooltip.remove();
      simulation.stop();
    };
  }, [events, signal, isFullscreen]);

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

  if (loading) {
    return (
      <Card>
        <SectionHeader title="Evidence Graph" />
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg mt-4" />
      </Card>
    );
  }

  // Even if no events, show the signal node
  if (events.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Evidence Graph" />
          {signal.related_event_ids && signal.related_event_ids.length > 0 && (
            <div className="text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
              {signal.related_event_ids.length} event{signal.related_event_ids.length > 1 ? 's' : ''} referenced but not loaded
            </div>
          )}
        </div>
        <div className="mt-4">
          {/* Show signal node even without events */}
          <div className="w-full h-[300px] border border-borders-subtle rounded-lg overflow-hidden bg-background-glass-subtle flex items-center justify-center relative">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#E1463E]/20 border-4 border-[#E1463E] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#E1463E]" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-2">{signal.title}</p>
              {signal.related_event_ids && signal.related_event_ids.length > 0 ? (
                <div className="text-xs text-text-tertiary">
                  <p className="mb-1">Unable to load {signal.related_event_ids.length} related event{signal.related_event_ids.length > 1 ? 's' : ''}</p>
                  <p className="text-text-quaternary mb-3">The events may still be processing or the IDs may be incorrect.</p>
                  <button
                    onClick={loadEvents}
                    disabled={loading}
                    className="px-3 py-1.5 bg-[#E1463E]/20 hover:bg-[#E1463E]/30 border border-[#E1463E]/30 rounded-lg text-xs text-[#E1463E] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Retry Loading Events'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-text-tertiary">No events linked to this signal yet</p>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Evidence Graph" />
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2 hover:bg-background-glass-medium rounded-lg transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
        
        <div ref={containerRef} className="w-full h-[400px] border border-borders-subtle rounded-lg overflow-hidden bg-background-glass-subtle">
          <svg ref={svgRef} className="w-full h-full" />
        </div>
      </Card>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-borders-subtle">
            <h2 className="text-lg font-semibold text-text-primary">Evidence Graph - {signal.title}</h2>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-background-glass-medium rounded-lg transition-colors"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
          <div ref={fullscreenContainerRef} className="flex-1 w-full">
            <svg ref={fullscreenSvgRef} className="w-full h-full" />
          </div>
        </div>
      )}
    </>
  );
}
