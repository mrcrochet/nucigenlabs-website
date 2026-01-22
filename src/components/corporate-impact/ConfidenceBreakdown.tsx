/**
 * Confidence Breakdown Modal
 * 
 * Shows detailed breakdown of confidence score (Palantir-like)
 */

import { X } from 'lucide-react';

interface ConfidenceBreakdownProps {
  confidence: number;
  onClose: () => void;
}

export default function ConfidenceBreakdown({ confidence, onClose }: ConfidenceBreakdownProps) {
  // Mock breakdown data - in real implementation, this would come from the signal
  const breakdown = [
    { label: 'Causal Link Strength', value: 30, max: 30 },
    { label: 'Evidence Quality', value: 20, max: 20 },
    { label: 'Historical Pattern Match', value: 15, max: 15 },
    { label: 'Market Mispricing', value: 15, max: 15 },
    { label: 'Time Horizon Clarity', value: 10, max: 10 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative backdrop-blur-xl bg-gradient-to-br from-[#0A0A0A] to-[#0F0F0F] border border-white/[0.15] rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-light text-white">Confidence Breakdown</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-light text-white">{confidence}%</span>
            <span className="text-slate-400 text-sm">confidence</span>
          </div>
          <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E1463E] to-red-600 transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {breakdown.map((item, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className="text-sm text-white font-medium">
                  {item.value}/{item.max}
                </span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#E1463E]/50 to-[#E1463E] transition-all duration-500"
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-white/[0.08]">
          <p className="text-xs text-slate-500 italic">
            Confidence reflects pattern match quality with historical cases. Not a price prediction.
          </p>
        </div>
      </div>
    </div>
  );
}
