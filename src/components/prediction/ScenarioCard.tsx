/**
 * Scenario Card Component
 * 
 * Displays a detailed scenario/outlook card with:
 * - Title, probability, time horizon
 * - Mechanism (causal chain)
 * - Supporting evidence (clickable cards)
 * - Counter-evidence (if available)
 * - Watch indicators
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Clock, Target, Bell } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import EvidenceCard from './EvidenceCard';
import CreateAlertModal from './CreateAlertModal';
import type { Outlook } from '../../types/prediction';

interface ScenarioCardProps {
  outlook: Outlook;
  rank: number; // 1 = most likely, 2 = second most likely, etc.
  totalScenarios: number;
  eventId?: string;
}

export default function ScenarioCard({ outlook, rank, totalScenarios, eventId }: ScenarioCardProps) {
  const [isExpanded, setIsExpanded] = useState(rank <= 3); // Auto-expand top 3
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);

  const percentage = (outlook.probability * 100).toFixed(1);
  const confidenceColors = {
    high: 'text-green-400',
    medium: 'text-amber-400',
    low: 'text-red-400',
  };

  const getRankBadge = () => {
    if (rank === 1) return { label: '#1 Most Likely', variant: 'critical' as const };
    if (rank === 2) return { label: '#2 Second Most Likely', variant: 'level' as const };
    if (rank === 3) return { label: '#3 Third Most Likely', variant: 'neutral' as const };
    return null;
  };

  const rankBadge = getRankBadge();

  return (
    <Card 
      id={`scenario-${outlook.id}`}
      className="p-6 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-light text-text-tertiary">O{outlook.id.replace('O', '')}</span>
            {rankBadge && (
              <Badge variant={rankBadge.variant}>
                {rankBadge.label}
              </Badge>
            )}
          </div>
          
          <h3 className="text-xl font-light text-text-primary mb-3 leading-tight">
            {outlook.title}
          </h3>

          {/* Probability & Time Horizon */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-light text-blue-400">
                {percentage}%
              </div>
              <div className="text-xs text-text-tertiary font-light">
                probability
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock className="w-4 h-4" />
              <span>{outlook.time_horizon}</span>
            </div>

            <div className={`flex items-center gap-2 text-sm ${confidenceColors[outlook.confidence]}`}>
              <Target className="w-4 h-4" />
              <span className="capitalize">{outlook.confidence} confidence</span>
            </div>
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-text-tertiary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-tertiary" />
          )}
        </button>
      </div>

      {/* Mechanism (always visible) */}
      <div className="mb-4 p-4 bg-white/[0.02] rounded-lg border border-white/[0.05]">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-light uppercase tracking-wider text-text-tertiary">
            Mechanism
          </span>
        </div>
        <p className="text-sm text-text-secondary font-light leading-relaxed">
          {outlook.mechanism}
        </p>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-white/[0.05]">
          {/* Supporting Evidence */}
          {outlook.supporting_evidence && outlook.supporting_evidence.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Supporting Evidence
                </h4>
                <span className="text-xs text-text-tertiary">
                  ({outlook.supporting_evidence.length})
                </span>
              </div>
              <div className="space-y-3">
                {outlook.supporting_evidence.map((evidence, idx) => (
                  <EvidenceCard 
                    key={idx} 
                    evidence={evidence} 
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Counter-Evidence */}
          {outlook.counter_evidence && outlook.counter_evidence.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Counter-Evidence
                </h4>
                <span className="text-xs text-text-tertiary">
                  ({outlook.counter_evidence.length})
                </span>
              </div>
              <div className="space-y-3">
                {outlook.counter_evidence.map((evidence, idx) => (
                  <EvidenceCard 
                    key={idx} 
                    evidence={evidence} 
                    index={idx}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Watch Indicators */}
          {outlook.watch_indicators && outlook.watch_indicators.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                  Signals to Watch
                </h4>
              </div>
              <ul className="space-y-2">
                {outlook.watch_indicators.map((indicator, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary font-light group">
                    <span className="text-purple-400 mt-1">•</span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="leading-relaxed">{indicator}</span>
                      <button
                        onClick={() => {
                          setSelectedIndicator(indicator);
                          setAlertModalOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/[0.05] rounded transition-all"
                        title="Create alert for this indicator"
                      >
                        <Bell className="w-3.5 h-3.5 text-purple-400" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Alert Modal */}
      {selectedIndicator && (
        <CreateAlertModal
          isOpen={alertModalOpen}
          onClose={() => {
            setAlertModalOpen(false);
            setSelectedIndicator(null);
          }}
          indicator={selectedIndicator}
          scenarioTitle={outlook.title}
          eventId={eventId}
        />
      )}
    </Card>
  );
}

// Import FileText icon
import { FileText } from 'lucide-react';
