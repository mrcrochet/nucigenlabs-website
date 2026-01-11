import Footer from '../components/Footer';
import SEO from '../components/SEO';

export default function About() {
  return (
    <main className="min-h-screen">
      <SEO
        title="About — Nucigen Labs"
        description="Learn about Nucigen Labs, our mission to transform global news into predictive market signals, and our vision for strategic intelligence."
        keywords="about nucigen labs, mission, vision, strategic intelligence, market prediction"
      />

      <section className="relative px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-20">
            <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-full px-4 py-2 mb-8">
              <p className="text-xs text-[#E1463E] font-light tracking-[0.15em] uppercase">About Us</p>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-[1.1]">
              We're here to make strategic intelligence{' '}
              <span className="text-slate-300">feel effortless</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-light leading-relaxed max-w-3xl">
              Clear signals, simple automation, and a smoother path from world events to market insights.
            </p>
          </div>

          {/* Mission, Vision, Progress */}
          <div className="grid md:grid-cols-3 gap-12 mb-20">
            {/* Mission */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-6">
                <span className="text-2xl text-[#E1463E] font-light">1</span>
              </div>
              <h2 className="text-2xl font-light text-white mb-4">Mission</h2>
              <p className="text-base text-slate-300 font-light leading-relaxed">
                Turn scattered news into one seamless intelligence workflow. We simplify event detection, causal analysis, and market prediction — so you understand what's changing before it becomes obvious.
              </p>
            </div>

            {/* Vision */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-6">
                <span className="text-2xl text-[#E1463E] font-light">2</span>
              </div>
              <h2 className="text-2xl font-light text-white mb-4">Vision</h2>
              <p className="text-base text-slate-300 font-light leading-relaxed">
                A future where teams can monitor, analyze, and act on market signals with confidence using one streamlined system — no switching between platforms, no information overload.
              </p>
            </div>

            {/* Progress */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-6">
                <span className="text-2xl text-[#E1463E] font-light">3</span>
              </div>
              <h2 className="text-2xl font-light text-white mb-4">Progress</h2>
              <p className="text-base text-slate-300 font-light leading-relaxed">
                Build tools that reduce noise, not add it. We're guided by principles of clarity, causality, and trust in systems — so you can focus on decisions, not data.
              </p>
            </div>
          </div>

          {/* Where Intelligence Starts */}
          <section className="mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6">
                  Where smart intelligence starts
                </h2>
                <p className="text-lg text-slate-400 font-light leading-relaxed">
                  A clean foundation that reduces noise and keeps your intelligence workflows running smoothly.
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 border border-white/[0.15] rounded-full flex items-center justify-center backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01]">
                    <span className="text-5xl font-light text-white">N</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#E1463E] rounded-full"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="grid md:grid-cols-3 gap-8 mb-20">
            <div>
              <h3 className="text-xl font-light text-white mb-4">Smarter automation</h3>
              <p className="text-base text-slate-400 font-light leading-relaxed">
                Automate event detection and causal analysis, so your team stays focused on strategic decisions.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-light text-white mb-4">Streamlined workflows</h3>
              <p className="text-base text-slate-400 font-light leading-relaxed">
                Connect events, signals, and alerts into one flow — no more juggling scattered intelligence sources.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-light text-white mb-4">Reliable performance</h3>
              <p className="text-base text-slate-400 font-light leading-relaxed">
                Built to scale with your organization — stable, predictable, and resilient from day one.
              </p>
            </div>
          </section>

          {/* Real-time Visibility */}
          <section className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl font-light text-white mb-4">Real-time visibility</h3>
            <p className="text-lg text-slate-300 font-light leading-relaxed">
              Understand what's happening across global markets instantly with live intelligence signals and causal chain analysis.
            </p>
          </section>
        </div>
      </section>

      <Footer />
    </main>
  );
}

