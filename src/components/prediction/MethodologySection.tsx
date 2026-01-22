/**
 * Methodology & Transparency Section
 * 
 * Trust layer showing how predictions are built
 * Links to all sources
 */

import { FileText, CheckCircle2, History, BarChart3, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { EventPrediction } from '../../types/prediction';

interface MethodologySectionProps {
  prediction: EventPrediction;
  onViewSources?: () => void;
}

export default function MethodologySection({ 
  prediction, 
  onViewSources 
}: MethodologySectionProps) {
  const outlooks = prediction.outlooks || [];
  const evidenceCount = prediction.evidence_count || 0;
  const historicalPatternsCount = prediction.historical_patterns_count || 0;
  const totalSources = outlooks.reduce((sum, outlook) => {
    return sum + 
      (outlook.supporting_evidence?.length || 0) + 
      (outlook.counter_evidence?.length || 0);
  }, 0);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-light text-text-primary mb-2">
          How Nucigen builds predictions
        </h3>
        <p className="text-sm text-text-secondary font-light">
          Transparency and trust in our methodology
        </p>
      </div>

      {/* Methodology Points */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">
              Scenarios generated from verified news sources
            </p>
            <p className="text-xs text-text-secondary font-light">
              All evidence is sourced from real articles and official documents
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <History className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">
              Historical pattern matching applied
            </p>
            <p className="text-xs text-text-secondary font-light">
              Similar past events inform probability assessments
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">
              No speculative or unverifiable claims
            </p>
            <p className="text-xs text-text-secondary font-light">
              Every statement is backed by traceable sources
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">
              Probabilities normalized across scenarios
            </p>
            <p className="text-xs text-text-secondary font-light">
              All probabilities sum to 100% for clear relative likelihoods
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">
              Updated automatically as new data arrives
            </p>
            <p className="text-xs text-text-secondary font-light">
              Predictions refresh based on TTL (3-12 hours depending on tier)
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-6 border-t border-white/[0.05]">
        <div>
          <p className="text-2xl font-light text-text-primary mb-1">
            {totalSources}
          </p>
          <p className="text-xs text-text-tertiary font-light">
            Total Sources
          </p>
        </div>
        <div>
          <p className="text-2xl font-light text-text-primary mb-1">
            {evidenceCount}
          </p>
          <p className="text-xs text-text-tertiary font-light">
            Evidence Items
          </p>
        </div>
        <div>
          <p className="text-2xl font-light text-text-primary mb-1">
            {historicalPatternsCount}
          </p>
          <p className="text-xs text-text-tertiary font-light">
            Historical Patterns
          </p>
        </div>
        <div>
          <p className="text-2xl font-light text-text-primary mb-1">
            {outlooks.length}
          </p>
          <p className="text-xs text-text-tertiary font-light">
            Scenarios
          </p>
        </div>
      </div>

      {/* View Sources Button */}
      {onViewSources && (
        <button
          onClick={onViewSources}
          className="w-full md:w-auto px-6 py-3 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.15] rounded-lg text-sm font-light text-text-primary transition-all duration-200 flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View all sources ({totalSources})</span>
        </button>
      )}
    </Card>
  );
}
