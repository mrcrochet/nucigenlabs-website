/**
 * ResearchCard - Card component for Research page
 * Palantir-style: Dense, information-rich cards with source, category, and prediction details
 */

import { ArrowRight, CheckCircle2, FileText } from 'lucide-react';
import Card from '../ui/Card';

interface ResearchCardProps {
  source: string;
  timeAgo: string;
  category: 'prediction' | 'news';
  title: string;
  watchTickers?: string[];
  expectedImpact?: string;
  onClick?: () => void;
}

export default function ResearchCard({
  source,
  timeAgo,
  category,
  title,
  watchTickers,
  expectedImpact,
  onClick,
}: ResearchCardProps) {
  return (
    <Card
      onClick={onClick}
      hover
      className="p-4 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(225,70,62,0.15)]"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Source, Category, Title */}
        <div className="flex-1 min-w-0">
          {/* Source and Time */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-white/[0.08] rounded flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-xs text-slate-400 font-light uppercase tracking-wide">
              {source}
            </span>
            <span className="text-xs text-slate-600">•</span>
            <span className="text-xs text-slate-500 font-light">{timeAgo}</span>
          </div>

          {/* Category Label */}
          {category === 'prediction' && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-4 h-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-green-400" />
              </div>
              <span className="text-xs text-slate-400 font-light">PREDICTION GENERATED</span>
            </div>
          )}

          {category === 'news' && (
            <div className="mb-2">
              <span className="text-xs text-slate-400 font-light">NEWS DETECTED</span>
            </div>
          )}

          {/* Main Title */}
          <h3 className="text-sm font-medium text-white leading-snug mb-3">
            {title}
          </h3>

          {/* Prediction Details */}
          {category === 'prediction' && (
            <div className="space-y-1.5">
              {watchTickers && watchTickers.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 font-light">Watch: </span>
                  <span className="text-xs font-medium text-teal-400">
                    {watchTickers.join(', ')}
                  </span>
                </div>
              )}
              {expectedImpact && (
                <div>
                  <span className="text-xs text-slate-500 font-light">Expected impact: </span>
                  <span className="text-xs font-medium text-orange-400">
                    {expectedImpact}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Arrow */}
        <div className="flex-shrink-0 pt-1">
          <ArrowRight className="w-4 h-4 text-orange-400" />
        </div>
      </div>
    </Card>
  );
}
