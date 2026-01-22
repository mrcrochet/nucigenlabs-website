/**
 * ScenarioCard Component
 * 
 * Displays a probabilistic scenario with:
 * - Relative probability
 * - Causal mechanisms
 * - Invalidation conditions
 * 
 * Part of the "Scenario Outlook" / "Probabilistic Outlook" feature
 */

import { AlertCircle, TrendingUp, XCircle, Info } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { Scenario } from '../../types/search';

interface ScenarioCardProps {
  scenario: Scenario;
  totalScenarios: number;
  variant?: 'risks' | 'predictions' | 'implications';
}

export default function ScenarioCard({ scenario, totalScenarios, variant = 'predictions' }: ScenarioCardProps) {
  // Calculate percentage (relative probability normalized to 0-100)
  const percentage = (scenario.relativeProbability * 100).toFixed(0);
  
  // Get color classes based on variant
  const getCardClasses = () => {
    switch (variant) {
      case 'risks':
        return 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10';
      case 'predictions':
        return 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10';
      case 'implications':
        return 'border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10';
      default:
        return 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'risks':
        return 'text-red-500';
      case 'predictions':
        return 'text-blue-500';
      case 'implications':
        return 'text-purple-500';
      default:
        return 'text-blue-500';
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'risks':
        return 'border-red-500/30';
      case 'predictions':
        return 'border-blue-500/30';
      case 'implications':
        return 'border-purple-500/30';
      default:
        return 'border-blue-500/30';
    }
  };

  const textColor = getTextColor();
  const borderColor = getBorderColor();

  return (
    <Card className={`p-5 ${getCardClasses()} transition-colors`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-base font-light text-text-primary mb-2 leading-relaxed">
            {scenario.title}
          </h4>
          <p className="text-sm text-text-secondary font-light leading-relaxed mb-3">
            {scenario.description}
          </p>
        </div>
        
        {/* Relative Probability Badge */}
        <div className="ml-4 text-right">
          <div className={`text-2xl font-semibold ${textColor} mb-1`}>
            {percentage}%
          </div>
          <div className="text-xs text-text-tertiary font-light">
            Relative probability
          </div>
        </div>
      </div>

      {/* Probability Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={`h-full ${textColor.replace('text-', 'bg-')} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-text-tertiary font-light">
            {scenario.confidence ? `${(scenario.confidence * 100).toFixed(0)}% confidence` : ''}
          </span>
        </div>
      </div>

      {/* Causal Mechanisms */}
      {scenario.mechanisms && scenario.mechanisms.length > 0 && (
        <div className="mb-4 pt-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={`w-4 h-4 ${textColor}`} />
            <p className="text-xs text-text-tertiary font-light uppercase tracking-wider">
              Causal Mechanisms
            </p>
          </div>
          <div className="space-y-2">
            {scenario.mechanisms.map((mechanism, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/[0.05]"
              >
                <Info className={`w-3 h-3 ${textColor} mt-0.5 flex-shrink-0`} />
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  {mechanism}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invalidation Conditions */}
      {scenario.invalidationConditions && scenario.invalidationConditions.length > 0 && (
        <div className="pt-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className={`w-4 h-4 ${textColor}`} />
            <p className="text-xs text-text-tertiary font-light uppercase tracking-wider">
              Invalidation Conditions
            </p>
          </div>
          <div className="space-y-2">
            {scenario.invalidationConditions.map((condition, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 bg-red-500/5 rounded-lg border border-red-500/20"
              >
                <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-text-secondary font-light leading-relaxed">
                  {condition}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeframe */}
      {scenario.timeframe && (
        <div className="mt-4 pt-4 border-t border-white/[0.05]">
          <Badge variant="neutral" className="text-xs">
            {scenario.timeframe === 'immediate' ? 'Immediate' :
             scenario.timeframe === 'short' ? 'Short-term' :
             scenario.timeframe === 'medium' ? 'Medium-term' :
             'Long-term'}
          </Badge>
        </div>
      )}
    </Card>
  );
}
