import { Newspaper, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PredictionEngine() {
  const examples = [
    {
      trigger: 'Breaking: Factory explosion in Taiwan semiconductor plant',
      prediction: 'Semiconductor shortage → Tech stocks down, chip makers up',
      timing: 'Predicted 6 hours before market reaction'
    },
    {
      trigger: 'Port strike announced in Rotterdam, Europe',
      prediction: 'Logistics delays → Shipping costs up, retail stocks affected',
      timing: 'Predicted 2 days before price movement'
    },
    {
      trigger: 'New oil sanctions on major exporter',
      prediction: 'Supply constraint → Oil prices up, airline stocks down',
      timing: 'Predicted 12 hours before market opens'
    }
  ];

  return (
    <section className="relative px-6 py-24 bg-gradient-to-b from-slate-950/50 to-transparent">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            From news to prediction in real-time.
          </h2>
          <p className="text-lg text-slate-400 font-light max-w-3xl mx-auto">
            Our system detects market-moving events from global news and predicts their impact before the market prices it in.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {examples.map((example, idx) => (
            <div
              key={idx}
              className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.10] rounded-xl p-8 hover:border-white/[0.20] transition-all duration-300"
            >
              <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-950/40 border border-blue-900/40 flex items-center justify-center flex-shrink-0 mt-1">
                    <Newspaper size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-light mb-2 tracking-wider">NEWS DETECTED</p>
                    <p className="text-sm text-slate-300 font-light leading-relaxed">
                      {example.trigger}
                    </p>
                  </div>
                </div>

                <ArrowRight size={24} className="text-[#E1463E] mx-auto hidden md:block" />

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-950/40 border border-green-900/40 flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-light mb-2 tracking-wider">PREDICTION GENERATED</p>
                    <p className="text-sm text-white font-light leading-relaxed mb-2">
                      {example.prediction}
                    </p>
                    <p className="text-xs text-[#E1463E] font-light">
                      {example.timing}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/30 rounded-xl p-10">
          <div className="text-center">
            <p className="text-2xl text-white font-light leading-relaxed mb-4">
              The edge isn't in the data. It's in the timing.
            </p>
            <p className="text-base text-slate-300 font-light">
              Every prediction is derived from real events, analyzed through causal chains, and delivered before the market reacts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
