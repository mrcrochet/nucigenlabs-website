/**
 * Probability Overview Component
 * 
 * Displays a stacked probability bar showing all scenario probabilities
 * Hover to see scenario name, click to scroll to detailed card
 */

import { useMemo } from 'react';
import type { Outlook } from '../../types/prediction';

interface ProbabilityOverviewProps {
  outlooks: Outlook[];
  onScenarioClick?: (outlookId: string) => void;
}

export default function ProbabilityOverview({ 
  outlooks, 
  onScenarioClick 
}: ProbabilityOverviewProps) {
  // Sort by probability (highest first)
  const sortedOutlooks = useMemo(() => {
    return [...outlooks].sort((a, b) => b.probability - a.probability);
  }, [outlooks]);

  const handleBarClick = (outlookId: string) => {
    if (onScenarioClick) {
      onScenarioClick(outlookId);
    } else {
      // Default: scroll to scenario card
      const element = document.getElementById(`scenario-${outlookId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Color palette for different scenarios
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  return (
    <div className="space-y-4">
      {/* Stacked Bar */}
      <div className="relative h-12 rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.01]">
        <div className="flex h-full">
          {sortedOutlooks.map((outlook, idx) => {
            const width = (outlook.probability * 100).toFixed(2);
            const color = colors[idx % colors.length];
            
            return (
              <div
                key={outlook.id}
                className={`${color} transition-all duration-300 hover:opacity-90 cursor-pointer group relative`}
                style={{ width: `${width}%` }}
                onClick={() => handleBarClick(outlook.id)}
                title={`${outlook.title}: ${(outlook.probability * 100).toFixed(1)}%`}
              >
                {/* Tooltip on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium text-white px-2 py-1 bg-black/50 rounded backdrop-blur-sm">
                    {outlook.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedOutlooks.map((outlook, idx) => {
          const color = colors[idx % colors.length];
          const percentage = (outlook.probability * 100).toFixed(1);
          
          return (
            <button
              key={outlook.id}
              onClick={() => handleBarClick(outlook.id)}
              className="flex items-center gap-2 text-left hover:bg-white/[0.05] rounded-lg p-2 transition-colors group"
            >
              <div className={`w-3 h-3 rounded ${color} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate group-hover:text-blue-400 transition-colors">
                  {outlook.title}
                </p>
                <p className="text-xs text-text-tertiary">{percentage}%</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Micro-copy */}
      <p className="text-xs text-text-tertiary font-light italic text-center pt-2">
        Probabilities reflect relative likelihoods based on current evidence. They update as new information emerges.
      </p>
    </div>
  );
}
