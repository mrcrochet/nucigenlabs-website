/**
 * ScenarioCardWithSources Component
 * 
 * Enhanced scenario card that displays:
 * - Relative probability with visual bar
 * - Causal mechanisms
 * - Invalidation conditions
 * - Web sources backing the scenario (articles, patterns)
 * 
 * Fully responsive and intuitive UI
 */

import { useState } from 'react';
import { TrendingUp, XCircle, ExternalLink, ChevronDown, ChevronUp, Info } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { Scenario } from '../../types/search';

interface ScenarioCardWithSourcesProps {
  scenario: Scenario;
  totalScenarios: number;
  variant?: 'risks' | 'predictions' | 'implications';
}

export default function ScenarioCardWithSources({ 
  scenario, 
  totalScenarios, 
  variant = 'predictions' 
}: ScenarioCardWithSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  
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
  const hasSources = scenario.sources && scenario.sources.length > 0;

  return (
    <Card className={`p-5 ${getCardClasses()} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-light text-text-primary mb-2 leading-relaxed">
            {scenario.title}
          </h4>
          <p className="text-sm text-text-secondary font-light leading-relaxed mb-3">
            {scenario.description}
          </p>
        </div>
        
        {/* Relative Probability Badge */}
        <div className="ml-4 text-right flex-shrink-0">
          <div className={`text-2xl font-semibold ${textColor} mb-1`}>
            {percentage}%
          </div>
          <div className="text-xs text-text-tertiary font-light">
            Probability
          </div>
          {scenario.confidence && (
            <div className="text-xs text-text-tertiary font-light mt-1">
              {Math.round(scenario.confidence * 100)}% confidence
            </div>
          )}
        </div>
      </div>

      {/* Probability Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-2.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={`h-full ${textColor.replace('text-', 'bg-')} transition-all duration-500 rounded-full`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {scenario.timeframe && (
          <Badge variant="neutral" className="text-xs">
            {scenario.timeframe === 'immediate' ? 'Immediate' :
             scenario.timeframe === 'short' ? 'Short-term' :
             scenario.timeframe === 'medium' ? 'Medium-term' :
             'Long-term'}
          </Badge>
        )}
        {hasSources && (
          <Badge variant="neutral" className="text-xs">
            {scenario.sources!.length} source{scenario.sources!.length !== 1 ? 's' : ''}
          </Badge>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-auto px-2 py-1 text-xs text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Details
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-white/[0.05]">
          {/* Causal Mechanisms */}
          {scenario.mechanisms && scenario.mechanisms.length > 0 && (
            <div>
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
                    className="flex items-start gap-2 p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.05]"
                  >
                    <Info className={`w-3.5 h-3.5 ${textColor} mt-0.5 flex-shrink-0`} />
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
            <div>
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs text-text-tertiary font-light uppercase tracking-wider">
                  Invalidation Conditions
                </p>
              </div>
              <div className="space-y-2">
                {scenario.invalidationConditions.map((condition, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 bg-red-500/5 rounded-lg border border-red-500/20"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-text-secondary font-light leading-relaxed">
                      {condition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sources */}
          {hasSources && (
            <div>
              <button
                onClick={() => setSourcesExpanded(!sourcesExpanded)}
                className="flex items-center justify-between w-full mb-3"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className={`w-4 h-4 ${textColor}`} />
                  <p className="text-xs text-text-tertiary font-light uppercase tracking-wider">
                    Backing Sources ({scenario.sources!.length})
                  </p>
                </div>
                {sourcesExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-tertiary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-tertiary" />
                )}
              </button>
              
              {sourcesExpanded && (
                <div className="space-y-2">
                  {scenario.sources!.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-white/[0.02] rounded-lg border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="text-sm font-light text-text-primary group-hover:text-text-primary line-clamp-2 flex-1">
                          {source.title}
                        </h5>
                        <ExternalLink className="w-4 h-4 text-text-tertiary group-hover:text-text-primary flex-shrink-0 mt-0.5" />
                      </div>
                      {source.snippet && (
                        <p className="text-xs text-text-secondary font-light line-clamp-2 mt-1">
                          {source.snippet}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="neutral" className="text-xs">
                          {Math.round(source.relevanceScore * 100)}% relevance
                        </Badge>
                        <span className="text-xs text-text-tertiary font-light">
                          {new URL(source.url).hostname}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
