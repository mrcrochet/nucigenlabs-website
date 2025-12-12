import { Zap, TrendingUp, Clock } from 'lucide-react';

export default function SimpleExplanation() {
  return (
    <section className="relative px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            News moves markets.<br />We predict it before it happens.
          </h2>
          <p className="text-lg text-slate-400 font-light max-w-3xl mx-auto">
            Every market movement has a cause. We scan global news 24/7 to detect these causes and predict the consequences.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-950/30 border border-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <Zap size={24} className="text-blue-400" />
            </div>
            <h3 className="text-lg text-white font-light mb-3">Real-time News Scanning</h3>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              Our system scans thousands of global news sources every minute for events that impact markets.
            </p>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-950/30 border border-green-900/30 flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={24} className="text-green-400" />
            </div>
            <h3 className="text-lg text-white font-light mb-3">Predictive Analysis</h3>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              We model how each event will propagate through supply chains, industries, and markets.
            </p>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-orange-950/30 border border-orange-900/30 flex items-center justify-center mx-auto mb-4">
              <Clock size={24} className="text-orange-400" />
            </div>
            <h3 className="text-lg text-white font-light mb-3">Early Positioning</h3>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              You receive predictions hours or days before the market reacts, giving you time to position.
            </p>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/30 rounded-xl p-10">
          <div className="text-center">
            <p className="text-2xl text-white font-light leading-relaxed mb-4">
              By the time it's on Bloomberg, it's already priced in.
            </p>
            <p className="text-base text-slate-300 font-light">
              Nucigen Labs gives you the signal before the crowd knows about it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
