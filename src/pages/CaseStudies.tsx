import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import TypewriterText from '../components/TypewriterText';

export default function CaseStudies() {
  const [selectedCase, setSelectedCase] = useState<number | null>(null);

  const cases = [
    {
      id: 1,
      title: 'From cobalt concessions to EV repricing',
      tags: 'Geopolitical vectors · Industrial chains',
      teaser: 'How a series of mining agreements reshaped EV supply and created a 6–12 month repricing window.',
      gradient: 'from-teal-900/20 via-slate-900/40 to-black/60',
    },
    {
      id: 2,
      title: 'When ports blink: the cost of a 10-day backlog',
      tags: 'Supply corridors',
      teaser: 'A case study on how a temporary slowdown in a major Asian port cascaded through retail inventories.',
      gradient: 'from-blue-900/20 via-slate-900/40 to-black/60',
    },
    {
      id: 3,
      title: 'Drone co-production and microelectronics demand',
      tags: 'Geopolitical vectors · Alpha windows',
      teaser: 'Mapping how defense cooperation translates into upstream electronics pressure.',
      gradient: 'from-amber-900/20 via-slate-900/40 to-black/60',
    },
  ];

  if (selectedCase !== null) {
    return <CaseStudyDetail caseId={selectedCase} onBack={() => setSelectedCase(null)} />;
  }

  return (
    <main className="min-h-screen">
      <SEO
        title="Case Studies — Nucigen Labs"
        description="Real-world case studies showing how Nucigen Labs predicts market movements through causal analysis. From geopolitical events to supply chain disruptions to market repricing."
        keywords="market intelligence case studies, predictive analytics examples, geopolitical analysis case studies, supply chain intelligence, market prediction examples"
      />

      <section className="relative min-h-screen px-4 sm:px-6 py-16 sm:py-32">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-20 sm:mb-32 animate-in fade-in duration-700">
            <div className="inline-block mb-6 sm:mb-8 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
              <span className="text-[10px] sm:text-xs text-slate-500 font-light tracking-[0.2em]">STRATEGIC INTELLIGENCE</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-extralight mb-8 sm:mb-12 leading-[1.05] tracking-[-0.02em] text-white">
              Intelligence built on<br />
              <span className="text-slate-300">consequences, not signals.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-xl text-slate-400 leading-[1.9] max-w-3xl mx-auto font-light mb-6 sm:mb-8 min-h-[3rem] px-4">
              <TypewriterText
                texts={[
                  'Live event-to-supply-chain causality models that identify alpha windows before markets move.',
                  'When a major competitor exits a market, Nucigen Labs maps substitution limits and market structure to identify which players gain pricing power.',
                  'When political instability escalates, Nucigen Labs models how institutional disruption propagates through production, logistics, and investment flows.',
                  'Nucigen Labs traces regulatory shifts through industrial and trade systems to surface their downstream effects.'
                ]}
                typingSpeed={70}
                deletingSpeed={25}
                pauseDuration={5000}
                className="text-slate-400"
              />
            </p>

            <p className="text-xs sm:text-sm text-slate-500 font-light mb-10 sm:mb-14 italic min-h-[2rem] px-4">
              <TypewriterText
                texts={[
                  'Built for analysts, operators, and investors who think in systems — not charts.',
                  'Volatility is rarely random. Nucigen Labs links price instability to structural constraints.',
                  'Nucigen Labs does not forecast outcomes. It maps how decisions and disruptions propagate through real systems.'
                ]}
                typingSpeed={60}
                deletingSpeed={20}
                pauseDuration={4000}
                className="text-slate-500 italic"
              />
            </p>

            <Link
              to="/request-access"
              className="group relative inline-block px-6 sm:px-10 py-3 sm:py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-300 text-xs sm:text-sm tracking-wide shadow-lg shadow-[#E1463E]/20 hover:shadow-xl hover:shadow-[#E1463E]/30 hover:scale-[1.02]"
            >
              <span className="relative z-10">Request Access</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
          </div>

          <div className="space-y-6">
            {cases.map((study) => (
              <button
                key={study.id}
                onClick={() => setSelectedCase(study.id)}
                className="group relative w-full backdrop-blur-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.15] rounded-xl sm:rounded-2xl p-6 sm:p-10 md:p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-white/[0.05] text-left overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${study.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-8 mb-6">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-600 font-light tracking-[0.2em] mb-4 uppercase">{study.tags}</p>
                      <h3 className="text-xl sm:text-2xl md:text-3xl text-white font-light mb-4 leading-[1.3] tracking-tight group-hover:text-slate-100 transition-colors">
                        {study.title}
                      </h3>
                    </div>
                    <div className="text-slate-500 group-hover:text-slate-300 transition-all duration-300 group-hover:translate-x-2">
                      <ArrowRight size={28} strokeWidth={1.5} />
                    </div>
                  </div>

                  <p className="text-sm md:text-base text-slate-400 font-light leading-[1.8] group-hover:text-slate-300 transition-colors">
                    {study.teaser}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-20 text-center">
            <Link
              to="/request-access"
              className="group inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-light"
            >
              Request Access
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-slate-600 font-light mt-2">
              No charts. No signals. No noise.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function CaseStudyDetail({ caseId, onBack }: { caseId: number; onBack: () => void }) {
  const caseContent = getCaseContent(caseId);

  return (
    <main className="min-h-screen">
      <section className="relative min-h-screen px-4 sm:px-6 py-16 sm:py-32">
        <div className="max-w-4xl mx-auto w-full">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-12 text-sm font-light"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Back to case studies
          </button>

          <div className="mb-16">
            <p className="text-[10px] text-slate-600 font-light tracking-[0.2em] mb-6 uppercase">{caseContent.tags}</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-light text-white mb-6 sm:mb-8 leading-[1.15] tracking-tight">
              {caseContent.title}
            </h1>
          </div>

          <div className="space-y-20">
            {caseContent.sections.map((section, idx) => (
              <div key={idx} className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-light text-slate-200 tracking-tight">
                  {section.heading}
                </h2>
                <div className="space-y-6 text-base md:text-lg text-slate-400 font-light leading-[1.9]">
                  {section.content.map((paragraph, pIdx) => (
                    <div key={pIdx}>
                      {paragraph.locked ? (
                        <div className="relative">
                          <div className="blur-sm select-none pointer-events-none">
                            <p>{paragraph.text}</p>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="backdrop-blur-xl bg-black/60 border border-white/20 rounded-xl px-6 py-4 text-center">
                              <p className="text-sm text-slate-300 font-light tracking-wide mb-2">
                                🔒 Operator+ access required
                              </p>
                              <p className="text-xs text-slate-500 font-light">
                                Full causal graphs, timelines and actor exposure available in Operator+.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-line">{paragraph.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 pt-12 border-t border-white/[0.08] text-center">
            <Link
              to="/request-access"
              className="group inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-light"
            >
              Request Access
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-slate-600 font-light mt-2">
              No charts. No signals. No noise.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function getCaseContent(caseId: number) {
  const content = [
    {
      id: 1,
      title: 'From cobalt concessions to EV repricing',
      tags: 'Geopolitical vectors · Industrial chains',
      sections: [
        {
          heading: '① Misleading Headline',
          content: [
            {
              text: `Headline: "Congo signs new cobalt concessions."

To the market, this looked like a trade.
To Nucigen Labs, it was a structural re-routing of the EV supply chain.`,
            },
          ],
        },
        {
          heading: '② Retail / Signal Reaction',
          content: [
            {
              text: `The retail market reacted predictably:
• Mining stocks up 2–3%
• Day traders entered positions
• Brief momentum

The signal was noise.`,
            },
          ],
        },
        {
          heading: '③ Nucigen Labs Detection',
          content: [
            {
              text: `Nucigen Labs does not ingest news.
It models causal systems.

In this case, the engine isolated:

Actors:
• Congo government
• Mining consortium
• EV off-takers

Exposure:
• 4 battery manufacturers
• 3 international logistics chains
• 2 maritime export corridors

Propagation:
• Tier 1: Mining equities
• Tier 2: Cathode suppliers
• Tier 3: EV OEM stocks
• Tier 4: Lithium miners (delayed)

None of these dynamics are visible on Binance, TradingView, or an RSI indicator.`,
            },
          ],
        },
        {
          heading: '④ Causal Chain',
          content: [
            {
              text: `The truth was structural. The concessions don't release cobalt tomorrow. They modify the flux of the EV supply chain over 6–12 months. They lock export contracts to specific countries. They reduce Chinese dependency. They force EV OEMs to accelerate procurement.

This isn't a trade. It's a macro industrial shift.`,
            },
          ],
        },
        {
          heading: '⑤ Alpha Window',
          content: [
            {
              text: `Retail looks at price → action.

Nucigen Labs looks at context → consequences.

Cobalt doesn't just move "the mines." It triggers the EV procurement war.

Result:
• EV OEMs accumulate early inventory
• Battery suppliers lock supply chains
• Asia–Africa shipping lanes explode in volume

The EV repricing occurred 6–12 months later.

This pattern was identified before it appeared in earnings calls or analyst notes.`,
            },
            {
              text: `Operator+ users received the complete window mapping, including specific ticker exposure, supply chain bottleneck analysis, and temporal cascade predictions across all four tiers.`,
              locked: true,
            },
          ],
        },
        {
          heading: '⑥ Why Signals Fail',
          content: [
            {
              text: `An oversold RSI anticipates nothing. It reacts.

The Nucigen Labs engine predicts:
• The actors who will move
• Their timeline
• The logistics corridor
• Cost components
• Upstream pressure

This is intelligence, not technical analysis.`,
            },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'When ports blink: the cost of a 10-day backlog',
      tags: 'Supply corridors',
      sections: [
        {
          heading: '① Misleading Headline',
          content: [
            {
              text: `Headline: "Major Asian port slowdown due to maintenance."

To the market, this looked like routine news.
To Nucigen Labs, it was a logistics chokepoint cascading into retail inflation.`,
            },
          ],
        },
        {
          heading: '② Retail / Signal Reaction',
          content: [
            {
              text: `Retail reaction:
• "Minor news"
• "It'll bounce back"
• "Not significant"

Technical signals:
• Volume stable
• RSI neutral
• No breakout detected

The mechanical indicators saw nothing.`,
            },
          ],
        },
        {
          heading: '③ Nucigen Labs Detection',
          content: [
            {
              text: `Nucigen Labs does not ingest news.
It models causal systems.

In this case, the engine isolated:

Actors:
• Port authority
• Government cargo prioritization
• Shipping lines

Exposure:
• Container backlog +15%
• Reduced inland rail capacity
• Ship diversion to port C

Propagation:
• Tier 1: Retail electronics import delayed → stock shortages
• Tier 2: Retailers overpay spot cargo → profit margin squeeze
• Tier 3: E-commerce earnings guidance repricing
• Tier 4: Local currency inflation pressure

None of this appears in crypto signals.`,
            },
          ],
        },
        {
          heading: '④ Causal Chain',
          content: [
            {
              text: `This wasn't maintenance. It was a logistics chokepoint.

The effect isn't the port. The effect is retail inventory inflation.

The cascade:
• 7–10 days physical backlog
• 3–5 days warehouse clearing
• 2–3 earnings calls
• Then repricing

Charts react after. Operators anticipate before.`,
            },
          ],
        },
        {
          heading: '⑤ Alpha Window',
          content: [
            {
              text: `Duration: 10–45 days

Why?
• 7–10 days physical backlog
• 3–5 days warehouse clearing
• 2–3 earnings calls
• Then repricing

By the time this reached mainstream analysts, the positioning phase was already over.`,
            },
            {
              text: `Result analysis: Margin squeeze on retail, shipping multipliers, freight backwardation patterns, and specific ticker exposure across affected logistics chains and e-commerce platforms were provided to Operator+ subscribers in real-time.`,
              locked: true,
            },
          ],
        },
        {
          heading: '⑥ Why Signals Fail',
          content: [
            {
              text: `A technical indicator doesn't understand material chains.

Alpha is born in logistics, not on a chart.`,
            },
          ],
        },
      ],
    },
    {
      id: 3,
      title: 'Drone co-production and microelectronics demand',
      tags: 'Geopolitical vectors · Alpha windows',
      sections: [
        {
          heading: '① Misleading Headline',
          content: [
            {
              text: `Headline: "Bilateral drone cooperation agreement."

To the market, this looked like a defense stock play.
To Nucigen Labs, it was a structural demand increase in microelectronics.`,
            },
          ],
        },
        {
          heading: '② Retail / Signal Reaction',
          content: [
            {
              text: `Retail reaction:
• Defense stocks +3%
• Brief pump
• End of story

Total misunderstanding.`,
            },
          ],
        },
        {
          heading: '③ Nucigen Labs Detection',
          content: [
            {
              text: `Nucigen Labs does not ingest news.
It models causal systems.

In this case, the engine isolated:

Actors:
• Defense contractors
• Technology transfer partners
• Upstream suppliers

Exposure:
• Military-grade PCBs
• Hardened semiconductors
• Microcontrollers

Propagation:
• Tier 1: Defense stock momentum (retail plays here)
• Tier 2: Military microelectronics demand
• Tier 3: Embedded systems manufacturers
• Tier 4: Passive suppliers and maintenance capacity

The market didn't see these actors for 8–12 months.`,
            },
          ],
        },
        {
          heading: '④ Causal Chain',
          content: [
            {
              text: `The drones aren't the subject. The electronics are.

There's a temporal gap:
1. Diplomatic signature
2. Technology transfer
3. Production setup
4. Supply ramp-up
5. Upstream supplier squeeze

Duration: 9–18 months

This is a macro-industrial catalyst.`,
            },
          ],
        },
        {
          heading: '⑤ Alpha Window',
          content: [
            {
              text: `• Retail played the defense stock
• Hedge funds played upstream semiconductors
• Nucigen Labs operators played Tier 3:
  - Military microelectronics
  - Embedded systems
  - Drone maintenance
  - Passive suppliers

This pattern was identified before it appeared in earnings calls or analyst notes.`,
            },
            {
              text: `Detailed analysis of specific microelectronics manufacturers, MCU shortage predictions, anti-icing PCB supply constraints, and tier-by-tier exposure mapping with temporal windows was delivered to Operator+ subscribers during the pre-market phase.`,
              locked: true,
            },
          ],
        },
        {
          heading: '⑥ Why Signals Fail',
          content: [
            {
              text: `RSI doesn't tell you:
• "Country X will sign technology transfer"
• "OEM Y lacks sufficient mil-spec MCUs"
• "Anti-icing PCB shortage Q4"

Signals detect the past. Consequences detect the future.`,
            },
          ],
        },
      ],
    },
  ];

  return content.find((c) => c.id === caseId) || content[0];
}
