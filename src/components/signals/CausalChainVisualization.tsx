/**
 * CausalChainVisualization Component
 * 
 * NEW ARCHITECTURE: Visualizes causal chains for signals
 * Shows: Event → Signal → Scenario → Decision
 * 
 * Even simple/static visualization = huge perceived value
 */

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Zap, TrendingUp, Target, AlertCircle, Download, FileImage, FileText } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface CausalNode {
  id: string;
  type: 'event' | 'signal' | 'scenario' | 'decision';
  title: string;
  description?: string;
  confidence?: number;
}

interface CausalChainVisualizationProps {
  nodes: CausalNode[];
  signalId?: string;
}

export default function CausalChainVisualization({ nodes, signalId }: CausalChainVisualizationProps) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [visibleNodes, setVisibleNodes] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const chainRef = useRef<HTMLDivElement>(null);

  // Animate nodes appearing one by one
  useEffect(() => {
    if (nodes.length === 0) return;

    const timer = setTimeout(() => {
      nodes.forEach((node, index) => {
        setTimeout(() => {
          setVisibleNodes((prev) => new Set([...prev, node.id]));
        }, index * 200); // 200ms delay between each node
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [nodes]);

  if (!nodes || nodes.length === 0) {
    return null;
  }

  const getNodeIcon = (type: CausalNode['type']) => {
    switch (type) {
      case 'event':
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
      case 'signal':
        return <TrendingUp className="w-5 h-5 text-[#E1463E]" />;
      case 'scenario':
        return <Target className="w-5 h-5 text-yellow-400" />;
      case 'decision':
        return <Zap className="w-5 h-5 text-green-400" />;
    }
  };

  const getNodeColor = (type: CausalNode['type']) => {
    switch (type) {
      case 'event':
        return 'border-blue-500/30 bg-blue-500/10';
      case 'signal':
        return 'border-[#E1463E]/30 bg-[#E1463E]/10';
      case 'scenario':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'decision':
        return 'border-green-500/30 bg-green-500/10';
    }
  };

  // Export functions
  const exportAsImage = async () => {
    if (!chainRef.current) return;

    setIsExporting(true);
    try {
      // Dynamic import of html2canvas (install with: npm install html2canvas)
      let html2canvas;
      try {
        html2canvas = (await import('html2canvas')).default;
      } catch {
        alert('html2canvas is not installed. Please run: npm install html2canvas');
        setIsExporting(false);
        return;
      }
      
      const canvas = await html2canvas(chainRef.current, {
        backgroundColor: '#0A0A0A',
        scale: 2,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `causal-chain-${signalId || 'export'}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!chainRef.current) return;

    setIsExporting(true);
    try {
      // Dynamic import of html2canvas and jsPDF
      let html2canvas, jsPDF;
      try {
        html2canvas = (await import('html2canvas')).default;
        const jsPDFModule = await import('jspdf');
        jsPDF = jsPDFModule.jsPDF;
      } catch (error: any) {
        if (error.message?.includes('html2canvas')) {
          alert('html2canvas is not installed. Please run: npm install html2canvas');
        } else {
          alert('Export libraries not available. Please install html2canvas.');
        }
        setIsExporting(false);
        return;
      }

      const canvas = await html2canvas(chainRef.current, {
        backgroundColor: '#0A0A0A',
        scale: 2,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`causal-chain-${signalId || 'export'}-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Causal Chain</h3>
          <p className="text-sm text-text-secondary">
            How this signal connects to events and potential outcomes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportAsImage}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/[0.02] border border-white/[0.05] rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-50"
            title="Export as PNG"
          >
            <FileImage className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={exportAsPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/[0.02] border border-white/[0.05] rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-50"
            title="Export as PDF"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div ref={chainRef} className="flex items-center gap-4 overflow-x-auto pb-4">
        {nodes.map((node, index) => {
          const isVisible = visibleNodes.has(node.id);
          return (
            <div 
              key={node.id} 
              className="flex items-center gap-4 flex-shrink-0"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
              }}
            >
              {/* Node */}
              <div
                className={`p-4 rounded-xl border ${getNodeColor(node.type)} min-w-[200px] cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  expandedNode === node.id ? 'ring-2 ring-white/20 scale-105' : ''
                }`}
                onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
              >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getNodeIcon(node.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="neutral" className="text-xs capitalize">
                      {node.type}
                    </Badge>
                    {node.confidence !== undefined && (
                      <Badge variant="neutral" className="text-xs">
                        {Math.round(node.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-text-primary mb-1">
                    {node.title}
                  </h4>
                  {expandedNode === node.id && node.description && (
                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                      {node.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

              {/* Arrow */}
              {index < nodes.length - 1 && (
                <ArrowRight 
                  className="w-5 h-5 text-slate-500 flex-shrink-0 transition-all duration-300"
                  style={{
                    opacity: isVisible && visibleNodes.has(nodes[index + 1]?.id) ? 1 : 0.3,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {nodes.length === 0 && (
        <div className="text-center py-8 text-text-secondary text-sm">
          <p>No causal chain data available</p>
        </div>
      )}
    </Card>
  );
}
