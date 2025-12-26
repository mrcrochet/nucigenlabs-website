import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import TypewriterText from '../components/TypewriterText';

export default function Intelligence() {
  return (
    <main className="min-h-screen">
      <SEO
        title="Intelligence — Nucigen Labs"
        description="We don't predict markets, we predict consequences. Geopolitical vectors, industrial chains, and supply corridors analyzed before markets reprice."
      />
      <section className="relative min-h-screen flex items-center justify-center px-6 py-32">
        <div className="max-w-5xl mx-auto w-full">
          <div className="text-center mb-40 animate-in fade-in duration-700">
            <div className="inline-block mb-8 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
              <span className="text-xs text-slate-500 font-light tracking-[0.2em]">STRATEGIC INTELLIGENCE</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-extralight mb-12 leading-[1.05] tracking-[-0.02em] text-white">
              We don't predict markets.<br />
              <span className="text-slate-300">We predict consequences.</span>
            </h1>

            <p className="text-base md:text-xl text-slate-400 leading-[1.9] max-w-3xl mx-auto font-light mb-8 min-h-[3rem]">
              <TypewriterText
                texts={[
                  'Nucigen Labs transforms geopolitical and industrial events into exploitable intelligence long before media amplification.',
                  'When compute availability tightens, Nucigen maps how capacity constraints propagate across AI, cloud, and enterprise software ecosystems.',
                  'When a major competitor exits a market, Nucigen maps substitution limits and market structure to identify which players gain pricing power.',
                  'When political instability escalates, Nucigen models how institutional disruption propagates through production, logistics, and investment flows.'
                ]}
                typingSpeed={70}
                deletingSpeed={25}
                pauseDuration={5000}
                className="text-slate-400"
              />
            </p>

            <p className="text-sm text-slate-500 font-light mb-14 tracking-wide min-h-[2rem]">
              <TypewriterText
                texts={[
                  'Markets move last. Supply chains and treaties move first.',
                  'Volatility is rarely random. Nucigen links price instability to structural constraints.',
                  'Industrial bottlenecks are often invisible until they fail. Nucigen identifies them earlier.'
                ]}
                typingSpeed={60}
                deletingSpeed={20}
                pauseDuration={4000}
                className="text-slate-500"
              />
            </p>

            <Link
              to="/request-access"
              className="group relative inline-block px-10 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-300 text-sm tracking-wide shadow-lg shadow-[#E1463E]/20 hover:shadow-xl hover:shadow-[#E1463E]/30 hover:scale-[1.02]"
            >
              <span className="relative z-10">Request Access</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
          </div>

          <div className="mb-40">
            <div className="text-center mb-24">
              <div className="inline-block mb-6 px-4 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                <span className="text-[10px] text-slate-600 font-light tracking-[0.25em]">CORE SYSTEM</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extralight mb-8 text-white tracking-tight">
                The Intelligence Engine
              </h2>
              <p className="text-base md:text-lg text-slate-400 font-light leading-[1.9] max-w-2xl mx-auto">
                Most systems watch price. Nucigen Labs watches the sequence of events that eventually forces price to move.
              </p>
            </div>

            <div className="space-y-8">
              <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-white/[0.03] hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  <h3 className="text-2xl text-slate-100 font-light tracking-wide">
                    Geopolitical Vector
                  </h3>
                </div>
                <p className="text-sm text-slate-400 font-light leading-[2] mb-8">
                  Where states negotiate access to resources, energy, logistics, and defense.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Treaties</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Sanctions</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Co-production deals</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Mining concessions</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Strategic partnerships</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Naval agreements</div>
                </div>
                <div className="pt-6 border-t border-white/[0.05]">
                  <p className="text-sm text-slate-300 font-light italic">
                    A political decision becomes an industrial shock.
                  </p>
                </div>
              </div>

              <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-white/[0.03] hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  <h3 className="text-2xl text-slate-100 font-light tracking-wide">
                    Industrial Chain
                  </h3>
                </div>
                <p className="text-sm text-slate-400 font-light leading-[2] mb-8">
                  Where policy becomes physical capacity.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Miners</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Refiners</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Smelters</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Foundries</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Upstream suppliers</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">OEM factories</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Downstream distributors</div>
                </div>
                <div className="pt-6 border-t border-white/[0.05]">
                  <p className="text-sm text-slate-300 font-light italic">
                    The bottleneck does not start on the chart. It starts inside the factory.
                  </p>
                </div>
              </div>

              <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-white/[0.03] hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  <h3 className="text-2xl text-slate-100 font-light tracking-wide">
                    Supply Corridors
                  </h3>
                </div>
                <p className="text-sm text-slate-400 font-light leading-[2] mb-8">
                  Where physical transportation determines shortage.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Ports</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Canals</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Rail networks</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Shipping lanes</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Pipelines</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Fuel logistics</div>
                  <div className="text-xs text-slate-500 font-light px-3 py-2 rounded-md bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors">Customs</div>
                </div>
                <div className="pt-6 border-t border-white/[0.05]">
                  <p className="text-sm text-slate-300 font-light italic">
                    Scarcity emerges when matter cannot move.
                  </p>
                </div>
              </div>

              <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-white/[0.03] hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  <h3 className="text-2xl text-slate-100 font-light tracking-wide">
                    Alpha Windows
                  </h3>
                </div>
                <p className="text-sm text-slate-400 font-light leading-[2] mb-6">
                  Where the consequence exists, but price hasn't noticed yet.
                </p>
                <div className="pt-6 border-t border-white/[0.05]">
                  <p className="text-sm text-slate-300 font-light italic">
                    Alpha lives in the temporal gap between reality and repricing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-40">
            <div className="text-center mb-20">
              <div className="inline-block mb-6 px-4 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                <span className="text-[10px] text-slate-600 font-light tracking-[0.25em]">CASE STUDIES</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extralight mb-4 text-white tracking-tight">
                Example Scenarios
              </h2>
            </div>

            <div className="space-y-6">
              <div className="group border-l-2 border-white/[0.1] hover:border-white/[0.3] pl-10 py-6 transition-all duration-300">
                <h3 className="text-xl text-slate-200 font-light mb-5 tracking-wide group-hover:text-white transition-colors">
                  Lithium Treaty
                </h3>
                <p className="text-sm text-slate-500 font-light leading-[2] mb-5">
                  China signs a state agreement with Bolivia → mining concessions change export rights → refiners in Peru and Chile reallocate capacity → EV supply chains are repriced with a 90–180 day lag.
                </p>
                <p className="text-sm text-slate-400 font-light italic">
                  Most investors see a news headline. Operators see the sequence of consequences.
                </p>
              </div>

              <div className="group border-l-2 border-white/[0.1] hover:border-white/[0.3] pl-10 py-6 transition-all duration-300">
                <h3 className="text-xl text-slate-200 font-light mb-5 tracking-wide group-hover:text-white transition-colors">
                  Naval Corridor Disruption
                </h3>
                <p className="text-sm text-slate-500 font-light leading-[2] mb-5">
                  A backlog at a key Asian port triggers fuel pressure, container delays and retail inventory shocks. Markets only react once panic sets in 45–90 days later.
                </p>
                <p className="text-sm text-slate-400 font-light italic">
                  Nucigen Labs flags the choke point, not the headline.
                </p>
              </div>

              <div className="group border-l-2 border-white/[0.1] hover:border-white/[0.3] pl-10 py-6 transition-all duration-300">
                <h3 className="text-xl text-slate-200 font-light mb-5 tracking-wide group-hover:text-white transition-colors">
                  Defense Co-Production
                </h3>
                <p className="text-sm text-slate-500 font-light leading-[2] mb-5">
                  A drone co-production deal between two states reshapes demand for electronics, rare earths and batteries. Industrial and logistics chains shift quietly, long before repricing becomes visible on charts.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-32">
            <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.12] rounded-2xl p-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-slate-800/10 via-transparent to-transparent"></div>
              <div className="relative z-10">
                <div className="inline-block mb-6 px-4 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                  <span className="text-[10px] text-slate-600 font-light tracking-[0.25em]">TECHNOLOGY</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extralight mb-8 text-white tracking-tight leading-[1.3]">
                  LLMs don't forecast.<br />They extract causal structure.
                </h2>
                <p className="text-sm md:text-base text-slate-400 font-light leading-[2] max-w-3xl mx-auto mb-8">
                  Large language models are not price oracles. We use them to read relationships between actors, assets and corridors: to detect chains of cause and effect, to map which industries absorb the shock, and to estimate how long repricing will take.
                </p>
                <p className="text-base text-slate-200 font-light tracking-wide">
                  We don't forecast. We front-run reality.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center py-16 border-t border-white/[0.08]">
            <p className="text-xs text-slate-600 font-light tracking-wide">
              Clearance is limited. You may be rejected without explanation.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
