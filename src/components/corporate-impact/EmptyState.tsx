/**
 * Empty State Component
 * 
 * Educational empty state for Corporate Impact when no signals are available
 */

import { AlertCircle, BookOpen, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface EmptyStateProps {
  onShowHowItWorks?: () => void;
}

export default function EmptyState({ onShowHowItWorks }: EmptyStateProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="text-center py-16">
      <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-2xl p-12 max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-2xl font-semibold text-white mb-2">No Corporate Impact Signals yet</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Our system is actively monitoring geopolitical, regulatory, and supply-chain events.
          </p>
        </div>

        <div className="space-y-3 text-left mb-6">
          <p className="text-sm text-slate-500 font-medium">Signals appear only when:</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 text-sm text-slate-400">
              <span className="text-[#E1463E] mt-0.5">•</span>
              <span>A real-world event creates measurable corporate exposure</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-400">
              <span className="text-[#E1463E] mt-0.5">•</span>
              <span>Evidence and historical patterns align</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-400">
              <span className="text-[#E1463E] mt-0.5">•</span>
              <span>Confidence exceeds internal thresholds</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setShowDetails(!showDetails);
            onShowHowItWorks?.();
          }}
          className="inline-flex items-center gap-2 px-6 py-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-lg text-sm text-white hover:from-white/[0.12] hover:to-white/[0.04] transition-all"
        >
          <BookOpen className="w-4 h-4" />
          How signals are generated
          <ArrowRight className="w-4 h-4" />
        </button>

        {showDetails && (
          <div className="mt-6 pt-6 border-t border-white/[0.08] text-left">
            <h4 className="text-white font-semibold mb-3 text-sm">Signal Generation Process</h4>
            <div className="space-y-3 text-sm text-slate-400">
              <p>
                Our system continuously analyzes geopolitical and regulatory events from trusted sources. When an event
                shows clear potential to impact specific companies, we:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Identify companies with significant exposure to the event</li>
                <li>Analyze historical patterns of similar past events</li>
                <li>Calculate confidence scores based on pattern match quality</li>
                <li>Generate signals only when historical precedent is strong</li>
              </ol>
              <p className="text-slate-500 text-xs mt-4">
                This selective approach ensures you only see signals backed by observable historical patterns, not predictions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
