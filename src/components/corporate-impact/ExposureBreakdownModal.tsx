/**
 * Exposure Breakdown Modal
 * 
 * Explains why a specific company is impacted by an event
 */

import { X, TrendingUp, TrendingDown, AlertTriangle, BarChart3, MapPin, Building2 } from 'lucide-react';

interface ExposureBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyTicker: string | null;
  companySector: string | null;
  eventTitle: string;
  signalType: 'opportunity' | 'risk';
  reasoning: {
    summary: string;
    key_factors: string[];
    risks: string[];
  };
  marketData?: {
    volume_change?: string;
    institutional_interest?: string;
    analyst_coverage?: string;
    short_interest?: string;
  };
}

export default function ExposureBreakdownModal({
  isOpen,
  onClose,
  companyName,
  companyTicker,
  companySector,
  eventTitle,
  signalType,
  reasoning,
  marketData,
}: ExposureBreakdownModalProps) {
  if (!isOpen) return null;

  const isOpportunity = signalType === 'opportunity';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F] border border-white/[0.15] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <div className="flex-1">
            <h2 className="text-2xl font-light text-white mb-2">Why {companyName}?</h2>
            <p className="text-sm text-slate-400">
              Exposure breakdown for <span className="text-white font-medium">"{eventTitle}"</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Company Info */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-5 h-5 text-slate-400" />
              <div>
                <h3 className="text-lg font-medium text-white">{companyName}</h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  {companyTicker && (
                    <>
                      <span className="font-mono">{companyTicker}</span>
                      <span>•</span>
                    </>
                  )}
                  {companySector && <span>{companySector}</span>}
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isOpportunity
                ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20'
                : 'bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20'
            }`}>
              {isOpportunity ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[#E1463E]" />
              )}
              <span className={`text-sm font-semibold ${isOpportunity ? 'text-green-400' : 'text-[#E1463E]'}`}>
                {isOpportunity ? 'Opportunity' : 'Risk'} Exposure
              </span>
            </div>
          </div>

          {/* Summary */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Exposure Summary
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{reasoning.summary}</p>
          </div>

          {/* Key Factors */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Key Exposure Factors
            </h3>
            <div className="space-y-2">
              {reasoning.key_factors.map((factor, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg"
                >
                  <span className="text-green-400 font-bold flex-shrink-0 mt-0.5">✓</span>
                  <span className="text-sm text-slate-300 flex-1">{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Exposure Risks
            </h3>
            <div className="space-y-2">
              {reasoning.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg"
                >
                  <span className="text-orange-400 font-bold flex-shrink-0 mt-0.5">⚠</span>
                  <span className="text-sm text-slate-300 flex-1">{risk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Market Data Signals */}
          {marketData && Object.keys(marketData).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Market Data Signals
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {marketData.volume_change && (
                  <div className="p-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Volume Change</p>
                    <p className="text-sm font-semibold text-white">{marketData.volume_change}</p>
                  </div>
                )}
                {marketData.short_interest && (
                  <div className="p-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Short Interest</p>
                    <p className="text-sm font-semibold text-white">{marketData.short_interest}</p>
                  </div>
                )}
                {marketData.institutional_interest && (
                  <div className="col-span-2 p-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Institutional Interest</p>
                    <p className="text-sm font-semibold text-white">{marketData.institutional_interest}</p>
                  </div>
                )}
                {marketData.analyst_coverage && (
                  <div className="col-span-2 p-3 backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Analyst Coverage</p>
                    <p className="text-sm font-semibold text-white">{marketData.analyst_coverage}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/[0.08]">
          <p className="text-xs text-slate-500 text-center">
            This breakdown is based on event-driven corporate exposure analysis. Not investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}
