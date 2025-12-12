import { useState } from 'react';
import { Check, Lock } from 'lucide-react';
import AccessRequestModal from './AccessRequestModal';

export default function PricingPreview() {
  const [showAccessModal, setShowAccessModal] = useState(false);

  return (
    <>
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Accessible intelligence.
            </h2>
            <p className="text-base text-slate-400 font-light">
              Professional-grade market intelligence — no longer reserved for institutions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.12] rounded-xl p-8">
              <div className="mb-6">
                <p className="text-sm text-slate-500 font-light mb-2">Entry Plan</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl text-white font-light">$59</span>
                  <span className="text-slate-500 font-light">/ month</span>
                </div>
                <p className="text-xs text-green-500/70 mt-2 font-light">Early Access Pricing</p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Global news analysis',
                  'Market impact forecasting',
                  'Crypto, stocks, commodities',
                  'Causal event dashboards',
                  'Early prediction alerts'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check size={18} className="text-green-500/70 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 font-light">{feature}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAccessModal(true)}
                className="w-full py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 text-sm"
              >
                Join Waiting List
              </button>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-10">
                <div className="text-center">
                  <Lock size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-light">Coming Soon</p>
                </div>
              </div>

              <div className="mb-6 opacity-30">
                <p className="text-sm text-slate-500 font-light mb-2">Pro Plan</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl text-white font-light">$XXX</span>
                  <span className="text-slate-500 font-light">/ month</span>
                </div>
              </div>

              <div className="space-y-3 mb-8 opacity-30">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded bg-slate-700 flex-shrink-0 mt-0.5"></div>
                  <div className="h-3 bg-slate-700 rounded w-full"></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded bg-slate-700 flex-shrink-0 mt-0.5"></div>
                  <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded bg-slate-700 flex-shrink-0 mt-0.5"></div>
                  <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-10">
                <div className="text-center">
                  <Lock size={32} className="text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-light">Coming Soon</p>
                </div>
              </div>

              <div className="mb-6 opacity-30">
                <p className="text-sm text-slate-500 font-light mb-2">Institutional Plan</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl text-white font-light">Custom</span>
                </div>
              </div>

              <div className="space-y-3 mb-8 opacity-30">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded bg-slate-700 flex-shrink-0 mt-0.5"></div>
                  <div className="h-3 bg-slate-700 rounded w-full"></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded bg-slate-700 flex-shrink-0 mt-0.5"></div>
                  <div className="h-3 bg-slate-700 rounded w-3/4"></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded bg-slate-700 flex-shrink-0 mt-0.5"></div>
                  <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-xs text-slate-600 font-light">
              Professional intelligence once reserved for institutions — now $59/month.
            </p>
          </div>
        </div>
      </section>

      <AccessRequestModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        onSuccess={() => {}}
        onError={() => {}}
        sourcePage="pricing"
      />
    </>
  );
}
