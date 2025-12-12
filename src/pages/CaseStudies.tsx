import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

interface CaseStudiesProps {
  onRequestClearance: () => void;
}

export default function CaseStudies({ onRequestClearance }: CaseStudiesProps) {
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
        title="Case Studies — Nucigen Labs Labs"
        description="Intelligence built on consequences, not signals. Live event-to-supply-chain causality models."
      />

      <section className="relative min-h-screen px-6 py-32">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-32 animate-in fade-in duration-700">
            <div className="inline-block mb-8 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
              <span className="text-xs text-slate-500 font-light tracking-[0.2em]">STRATEGIC INTELLIGENCE</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-extralight mb-12 leading-[1.05] tracking-[-0.02em] text-white">
              Intelligence built on<br />
              <span className="text-slate-300">consequences, not signals.</span>
            </h1>

            <p className="text-base md:text-xl text-slate-400 leading-[1.9] max-w-3xl mx-auto font-light mb-14">
              Live event-to-supply-chain causality models that identify alpha windows before markets move.
            </p>

            <button
              onClick={onRequestClearance}
              className="group relative px-10 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-300 text-sm tracking-wide shadow-lg shadow-[#E1463E]/20 hover:shadow-xl hover:shadow-[#E1463E]/30 hover:scale-[1.02]"
            >
              <span className="relative z-10">Request Clearance</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </button>
          </div>

          <div className="space-y-6">
            {cases.map((study) => (
              <button
                key={study.id}
                onClick={() => setSelectedCase(study.id)}
                className="group relative w-full backdrop-blur-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-10 md:p-12 transition-all duration-500 hover:shadow-2xl hover:shadow-white/[0.05] text-left overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${study.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-8 mb-6">
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-600 font-light tracking-[0.2em] mb-4 uppercase">{study.tags}</p>
                      <h3 className="text-2xl md:text-3xl text-white font-light mb-4 leading-[1.3] tracking-tight group-hover:text-slate-100 transition-colors">
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
      <section className="relative min-h-screen px-6 py-32">
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
            <h1 className="text-4xl md:text-6xl font-light text-white mb-8 leading-[1.15] tracking-tight">
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
                            <div className="backdrop-blur-xl bg-black/60 border border-white/20 rounded-xl px-6 py-4">
                              <p className="text-sm text-slate-300 font-light tracking-wide">
                                🔒 Operator+ access required
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
          heading: 'The headline was not the signal.',
          content: [
            {
              text: `The press reported: "Congo signs new cobalt concessions."

The retail market reacted predictably:
• Mining stocks up 2–3%
• Day traders entered positions
• Brief momentum

The signal was noise.

The truth was structural. The concessions don't release cobalt tomorrow. They modify the flux of the EV supply chain over 6–12 months. They lock export contracts to specific countries. They reduce Chinese dependency. They force EV OEMs to accelerate procurement.

This isn't a trade. It's a macro industrial shift.`,
            },
          ],
        },
        {
          heading: 'What the Nucigen Labs engine detected',
          content: [
            {
              text: `Our engine didn't "read an article." It detected:

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
          heading: 'The alpha window',
          content: [
            {
              text: `Retail looks at price → action.

Nucigen Labs looks at context → consequences.

Cobalt doesn't just move "the mines." It triggers the EV procurement war.

Result:
• EV OEMs accumulate early inventory
• Battery suppliers lock supply chains
• Asia–Africa shipping lanes explode in volume

The EV repricing occurred 6–12 months later.`,
            },
            {
              text: `Operator+ users received the complete window mapping, including specific ticker exposure, supply chain bottleneck analysis, and temporal cascade predictions across all four tiers.`,
              locked: true,
            },
          ],
        },
        {
          heading: 'Why this beats signals',
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
          heading: 'The headline that fools traders',
          content: [
            {
              text: `The press: "Major Asian port slowdown due to maintenance."

Retail reaction:
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
          heading: 'What the Nucigen Labs engine saw',
          content: [
            {
              text: `This wasn't maintenance. It was a logistics chokepoint.

The engine detected:
• Container backlog +15%
• Government cargo prioritization
• Reduced inland rail capacity
• Ship diversion to port C

The effect isn't the port. The effect is retail inventory inflation.`,
            },
          ],
        },
        {
          heading: 'Propagation in the real world',
          content: [
            {
              text: `Tier 1: Retail electronics import delayed → stock shortages

Tier 2: Retailers overpay spot cargo → profit margin squeeze

Tier 3: E-commerce earnings guidance repricing

Tier 4: Local currency inflation pressure

None of this appears in crypto signals.`,
            },
          ],
        },
        {
          heading: 'The alpha window',
          content: [
            {
              text: `Duration: 10–45 days

Why?
• 7–10 days physical backlog
• 3–5 days warehouse clearing
• 2–3 earnings calls
• Then repricing

Charts react after. Operators anticipate before.`,
            },
            {
              text: `Result analysis: Margin squeeze on retail, shipping multipliers, freight backwardation patterns, and specific ticker exposure across affected logistics chains and e-commerce platforms were provided to Operator+ subscribers in real-time.`,
              locked: true,
            },
          ],
        },
        {
          heading: 'Why signals are blind here',
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
          heading: 'What the world saw',
          content: [
            {
              text: `The press: "Bilateral drone cooperation agreement."

Retail reaction:
• Defense stocks +3%
• Brief pump
• End of story

Total misunderstanding.`,
            },
          ],
        },
        {
          heading: 'What Nucigen Labs saw',
          content: [
            {
              text: `The drones aren't the subject. The electronics are.

Our engine isolated:

Upstream supply chain:
• Military-grade PCBs
• Hardened semiconductors
• Microcontrollers

Downstream:
• Maintenance capacity
• Production facilities
• Training/simulation loops

The drone cooperation equals structural demand increase in microelectronics.`,
            },
          ],
        },
        {
          heading: 'Alpha window',
          content: [
            {
              text: `There's a temporal gap:

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
          heading: 'What retail missed',
          content: [
            {
              text: `• Retail played the defense stock
• Hedge funds played upstream semiconductors
• Nucigen Labs operators played Tier 3:
  - Military microelectronics
  - Embedded systems
  - Drone maintenance
  - Passive suppliers

The market didn't see these actors for 8–12 months.`,
            },
            {
              text: `Detailed analysis of specific microelectronics manufacturers, MCU shortage predictions, anti-icing PCB supply constraints, and tier-by-tier exposure mapping with temporal windows was delivered to Operator+ subscribers during the pre-market phase.`,
              locked: true,
            },
          ],
        },
        {
          heading: 'Why this destroys signals',
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
