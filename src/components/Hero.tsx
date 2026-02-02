import CountdownTimer from './CountdownTimer';
import SimpleWaitlistForm from './SimpleWaitlistForm';

export default function Hero() {

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-12 leading-[1.1] text-white max-w-5xl mx-auto">
            We transform real events into predictive intelligence
            <span className="block mt-6 text-slate-400">before the market reacts</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto font-light">
            Nucigen Labs captures consequences before they become prices
          </p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-lg p-10 md:p-14 shadow-2xl mb-32 relative max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-radial from-slate-700/5 via-transparent to-transparent rounded-lg pointer-events-none"></div>

          <div className="relative">
            <div className="mb-16 text-center">
              <p className="text-sm text-slate-400 mb-8 font-light tracking-wider">LAUNCH — FEBRUARY 28, 2026 • 15:00 UTC</p>
              <div className="py-6">
                <CountdownTimer />
              </div>
            </div>

            <div className="mb-10">
              <SimpleWaitlistForm variant="inline" />
              </div>

            <div className="text-center">
              <p className="text-sm text-slate-500 font-light">
                Access restricted to professional operators and analysts
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-32">
          <p className="text-xs text-slate-600 mb-16 text-center tracking-[0.3em] font-normal">HOW WE CAPTURE ALPHA</p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-8 text-center">
              <div className="text-4xl mb-6">⚡</div>
              <h3 className="text-xl text-white font-light mb-4">Event</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                A geopolitical treaty, an industrial decision, a resource movement
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.12] rounded-lg p-8 text-center">
              <div className="text-4xl mb-6">🧠</div>
              <h3 className="text-xl text-white font-light mb-4">Analysis</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Nucigen Labs models cascading consequences across industrial chains
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-8 text-center">
              <div className="text-4xl mb-6">💎</div>
              <h3 className="text-xl text-white font-light mb-4">Alpha</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                You position before the market prices in the information
              </p>
            </div>
          </div>
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <p className="text-2xl md:text-4xl font-light leading-relaxed text-slate-300">
            When the media reports the event,<br />
            <span className="text-white">we've already captured the consequences</span>
          </p>
        </div>
      </div>
    </section>
  );
}
