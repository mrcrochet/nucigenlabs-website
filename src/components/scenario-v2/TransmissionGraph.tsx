import { useState, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { TransmissionGraphData, TransmissionNode } from '../../types/scenario-v2';

interface TransmissionGraphProps {
  data: TransmissionGraphData;
  height?: number;
}

// Fixed positions for the transmission chain layout (percentages)
const NODE_POSITIONS: Record<string, { top: string; left: string; size: number }> = {
  event:    { top: '45%', left: '8%',  size: 80 },
  energy:   { top: '30%', left: '28%', size: 70 },
  shipping: { top: '60%', left: '28%', size: 70 },
  europe:   { top: '15%', left: '50%', size: 65 },
  asia:     { top: '45%', left: '53%', size: 65 },
  mena:     { top: '70%', left: '50%', size: 65 },
  banks:    { top: '18%', left: '75%', size: 60 },
  tech:     { top: '48%', left: '78%', size: 60 },
  defense:  { top: '72%', left: '75%', size: 60 },
};

// Fullscreen: bigger nodes, same relative positions
const NODE_POSITIONS_FS: Record<string, { top: string; left: string; size: number }> = {
  event:    { top: '45%', left: '10%',  size: 110 },
  energy:   { top: '28%', left: '28%', size: 95 },
  shipping: { top: '62%', left: '28%', size: 95 },
  europe:   { top: '12%', left: '48%', size: 85 },
  asia:     { top: '45%', left: '52%', size: 85 },
  mena:     { top: '72%', left: '48%', size: 85 },
  banks:    { top: '15%', left: '74%', size: 80 },
  tech:     { top: '48%', left: '77%', size: 80 },
  defense:  { top: '75%', left: '74%', size: 80 },
};

// Lines connecting nodes
const CONNECTIONS = [
  { top: '48%', left: '16%', width: 120, rotate: -20 },
  { top: '52%', left: '16%', width: 120, rotate: 20 },
  { top: '34%', left: '38%', width: 130, rotate: -20 },
  { top: '36%', left: '38%', width: 130, rotate: 10 },
  { top: '38%', left: '38%', width: 120, rotate: 35 },
  { top: '64%', left: '38%', width: 100, rotate: -15 },
  { top: '62%', left: '38%', width: 110, rotate: -40 },
  { top: '20%', left: '60%', width: 110, rotate: 5 },
  { top: '50%', left: '63%', width: 110, rotate: 0 },
  { top: '72%', left: '60%', width: 100, rotate: 5 },
  { top: '22%', left: '60%', width: 90, rotate: 30 },
  { top: '68%', left: '58%', width: 90, rotate: -15 },
];

// Fullscreen: longer lines
const CONNECTIONS_FS = [
  { top: '48%', left: '18%', width: 160, rotate: -18 },
  { top: '52%', left: '18%', width: 160, rotate: 18 },
  { top: '32%', left: '38%', width: 170, rotate: -18 },
  { top: '34%', left: '38%', width: 180, rotate: 10 },
  { top: '36%', left: '38%', width: 160, rotate: 35 },
  { top: '66%', left: '38%', width: 140, rotate: -15 },
  { top: '64%', left: '38%', width: 150, rotate: -38 },
  { top: '18%', left: '58%', width: 160, rotate: 3 },
  { top: '50%', left: '62%', width: 150, rotate: 0 },
  { top: '74%', left: '58%', width: 140, rotate: 3 },
  { top: '20%', left: '58%', width: 130, rotate: 28 },
  { top: '70%', left: '56%', width: 130, rotate: -12 },
];

function GraphContent({
  data,
  hoveredNode,
  setHoveredNode,
  positions,
  connections,
  nodeFontSize,
}: {
  data: TransmissionGraphData;
  hoveredNode: TransmissionNode | null;
  setHoveredNode: (n: TransmissionNode | null) => void;
  positions: Record<string, { top: string; left: string; size: number }>;
  connections: typeof CONNECTIONS;
  nodeFontSize: string;
}) {
  return (
    <>
      {/* Hover metrics panel */}
      <div
        className={`absolute top-4 right-4 bg-[#0a0a0a] border border-[#1a1a1a] p-3 text-[0.65rem] font-mono text-[#666] z-10 transition-opacity duration-200 ${
          hoveredNode ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {hoveredNode && (
          <>
            <div className="mb-2">IMPACT SCORE: <span className="text-white">{hoveredNode.impactScore}/10</span></div>
            <div className="mb-2">SENSITIVITY: <span className={
              hoveredNode.sensitivity === 'Critical' || hoveredNode.sensitivity === 'High'
                ? 'text-[#ff0000]' : 'text-white'
            }>{hoveredNode.sensitivity.toUpperCase()}</span></div>
            <div className="mb-2">LAG TIME: <span className="text-white">{hoveredNode.lagTime}</span></div>
            <div>CORRELATION: <span className="text-white">{hoveredNode.historicalCorrelation.toFixed(2)}</span></div>
          </>
        )}
      </div>

      {/* Connection lines */}
      {connections.map((conn, i) => (
        <div
          key={`line-${i}`}
          className="absolute h-px bg-[#1a1a1a]"
          style={{
            top: conn.top,
            left: conn.left,
            width: `${conn.width}px`,
            transformOrigin: 'left center',
            transform: `rotate(${conn.rotate}deg)`,
          }}
        />
      ))}

      {/* Nodes */}
      {data.nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;

        return (
          <div
            key={node.id}
            onMouseEnter={() => setHoveredNode(node)}
            onMouseLeave={() => setHoveredNode(null)}
            className={`absolute bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center text-[#b4b4b4] font-mono font-normal tracking-[1px] cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a] hover:border-white hover:text-white`}
            style={{
              top: pos.top,
              left: pos.left,
              width: `${pos.size}px`,
              height: `${pos.size}px`,
              fontSize: nodeFontSize,
            }}
          >
            {node.label}
          </div>
        );
      })}
    </>
  );
}

export default function TransmissionGraph({ data, height = 400 }: TransmissionGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<TransmissionNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ESC to close fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isFullscreen]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  return (
    <>
      {/* Normal view */}
      <div className="bg-black border border-[#1a1a1a] p-6 h-full">
        <div className="flex items-center justify-between text-[0.7rem] font-mono font-normal text-white tracking-[2px] uppercase mb-4 pb-2 border-b border-[#1a1a1a]">
          <span>TRANSMISSION CHAIN</span>
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1.5 border border-[#2a2a2a] bg-black text-[#666] hover:text-white hover:border-white transition-all duration-200 cursor-pointer"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div
          className="relative bg-black border border-[#1a1a1a] overflow-hidden mt-4"
          style={{ height: `${height}px` }}
        >
          <GraphContent
            data={data}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            positions={NODE_POSITIONS}
            connections={CONNECTIONS}
            nodeFontSize="0.65rem"
          />
        </div>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Transmission Chain — Fullscreen"
        >
          {/* Fullscreen header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a] flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[0.8rem] font-mono text-white tracking-[2px] uppercase">
                TRANSMISSION CHAIN
              </span>
              <span className="text-[0.65rem] font-mono text-[#666] tracking-[1px]">
                EVENT → SECTOR → REGION → ASSET CLASS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[0.6rem] font-mono text-[#666] tracking-[1px]">
                ESC TO CLOSE
              </span>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 border border-[#2a2a2a] bg-black text-[#666] hover:text-white hover:border-white transition-all duration-200 cursor-pointer"
                title="Exit fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fullscreen graph */}
          <div className="flex-1 relative overflow-hidden">
            <GraphContent
              data={data}
              hoveredNode={hoveredNode}
              setHoveredNode={setHoveredNode}
              positions={NODE_POSITIONS_FS}
              connections={CONNECTIONS_FS}
              nodeFontSize="0.8rem"
            />
          </div>
        </div>
      )}
    </>
  );
}
