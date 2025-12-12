import { FileText, Lock } from 'lucide-react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

interface PapersProps {
  onRequestClearance?: () => void;
}

export default function Papers({ onRequestClearance }: PapersProps) {
  const researchCategories = [
    {
      title: 'Causal Modeling',
      items: ['Event → Industry → Supply → Market', 'Nonlinear propagation', 'Shock amplification']
    },
    {
      title: 'Geopolitical Systems',
      items: ['Sanctions', 'Defense alliances', 'Mining concessions', 'Energy treaties']
    },
    {
      title: 'Industrial Chain Intelligence',
      items: ['Upstream capacity modeling', 'Bottleneck detection', 'OEM dependency graphs']
    },
    {
      title: 'Supply Corridor Dynamics',
      items: ['Ports', 'Pipelines', 'Rail networks', 'Maritime chokepoints']
    },
    {
      title: 'Alpha Window Theory',
      items: ['Latency between cause and price', 'Structural vs speculative alpha', 'Narrative decay modeling']
    }
  ];

  const publicPapers = [
    {
      title: 'Alpha Windows in Strategic Commodities',
      subtitle: 'Latency between geopolitical shock and industrial repricing',
      abstract: 'This paper models the temporal gap between upstream geopolitical interventions and downstream market repricing across energy and transition metals.',
      tags: ['Alpha Windows', 'Mining', 'Energy', 'Macroeconomics']
    },
    {
      title: 'Causal Graphs for Supply Chain Disruption',
      subtitle: 'Graph-based modeling of shock propagation',
      abstract: 'Graph-based modeling of shock propagation inside multi-tier industrial supply chains.',
      tags: ['Supply Graphs', 'Logistics', 'AI Modeling']
    },
    {
      title: 'The Political Origin of Market Volatility',
      subtitle: 'Political causation as primary driver',
      abstract: 'Markets do not move randomly. This paper identifies political causation as the primary driver of structural volatility.',
      tags: ['Geopolitics', 'Market Structure', 'Volatility']
    }
  ];

  const restrictedPapers = [
    'Defense-industrial co-production models',
    'Energy corridor fragility scenarios',
    'Sanctions evasion network mapping',
    'Sovereign resource war-game simulations'
  ];

  const researchPipeline = [
    'Global event ingestion',
    'Linguistic event extraction',
    'Political classification',
    'Industrial impact mapping',
    'Supply-chain propagation',
    'Asset exposure scoring',
    'Alpha window detection'
  ];

  return (
    <main className="min-h-screen">
      <SEO
        title="Papers — Nucigen Labs Labs"
        description="The causal layer beneath the markets. Original research on geopolitical causality, industrial propagation, and systemic market consequences."
      />

      <section className="relative min-h-screen px-6 py-32">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center mb-24 max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-12 leading-[1.1] text-white">
              The causal layer beneath the markets.
            </h1>

            <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light mb-12">
              Nucigen Labs Labs publishes original research on geopolitical causality, industrial propagation, and systemic market consequences.
            </p>

            {onRequestClearance && (
              <button
                onClick={onRequestClearance}
                className="px-8 py-3.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/20 hover:border-white/30 text-white font-light rounded-md transition-all duration-300 text-sm tracking-wide"
              >
                Request Research Access
              </button>
            )}

            <p className="text-xs text-slate-600 font-light mt-8">
              Some papers are public. Strategic research requires clearance.
            </p>
          </div>

          <div className="mb-32">
            <p className="text-xs text-slate-600 mb-16 text-center tracking-[0.3em] font-normal">RESEARCH CATEGORIES</p>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {researchCategories.map((category, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-6">
                  <h3 className="text-base text-white font-light mb-4">{category.title}</h3>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs text-slate-500 font-light leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-32">
            <p className="text-xs text-slate-600 mb-16 text-center tracking-[0.3em] font-normal">FEATURED PAPERS — PUBLIC</p>

            <div className="grid md:grid-cols-1 gap-6 max-w-4xl mx-auto">
              {publicPapers.map((paper, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.12] rounded-lg p-8 transition-all duration-300">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl text-white font-light mb-2">{paper.title}</h3>
                      <p className="text-sm text-slate-500 font-light mb-4">{paper.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 font-light leading-relaxed mb-6">
                    {paper.abstract}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {paper.tags.map((tag, tagIdx) => (
                      <span key={tagIdx} className="px-3 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-slate-500 font-light">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] hover:border-white/[0.15] text-white text-xs font-light rounded-md transition-all">
                      View Abstract
                    </button>
                    <button className="px-4 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] text-slate-400 hover:text-white text-xs font-light rounded-md transition-all">
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-32 max-w-4xl mx-auto">
            <p className="text-xs text-slate-600 mb-16 text-center tracking-[0.3em] font-normal">RESTRICTED RESEARCH</p>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.08] rounded-lg p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/40 backdrop-blur-md z-10"></div>

              <div className="relative z-0 blur-sm select-none">
                <div className="space-y-4">
                  {restrictedPapers.map((paper, idx) => (
                    <div key={idx} className="p-4 bg-white/[0.05] border border-white/[0.08] rounded-md">
                      <p className="text-sm text-slate-300 font-light">{paper}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <Lock size={32} className="text-slate-400 mb-4" />
                <p className="text-lg text-white font-light mb-2">Restricted Research</p>
                <p className="text-sm text-slate-400 font-light mb-6 text-center max-w-md">
                  These papers require institutional clearance.<br />
                  Not accessible to retail accounts.
                </p>
                {onRequestClearance && (
                  <button
                    onClick={onRequestClearance}
                    className="px-6 py-3 bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 hover:border-white/30 text-white font-light rounded-md transition-all text-sm tracking-wide"
                  >
                    Request Clearance
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mb-32 max-w-4xl mx-auto">
            <p className="text-xs text-slate-600 mb-16 text-center tracking-[0.3em] font-normal">THE NUCIGEN RESEARCH METHOD</p>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-10">
              <h3 className="text-2xl text-white font-light mb-8 text-center">Scientific Pipeline</h3>

              <div className="space-y-4">
                {researchPipeline.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-400 text-sm font-light">{idx + 1}</span>
                    </div>
                    <p className="text-base text-slate-300 font-light">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-white/[0.08]">
                <p className="text-lg text-white font-light text-center">
                  Price is an output. Causality is the input.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-32 max-w-4xl mx-auto">
            <p className="text-xs text-slate-600 mb-16 text-center tracking-[0.3em] font-normal">WHAT MAKES NUCIGEN RESEARCH DIFFERENT</p>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left p-6 text-sm text-slate-400 font-light">Traditional Finance Research</th>
                    <th className="text-left p-6 text-sm text-white font-light">Nucigen Labs Labs</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Price-based', 'Event-based'],
                    ['Historical correlation', 'Causal modeling'],
                    ['Signal processing', 'Structural impact'],
                    ['Reactive', 'Pre-emptive']
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b border-white/[0.05] last:border-0">
                      <td className="p-6 text-sm text-slate-500 font-light">{row[0]}</td>
                      <td className="p-6 text-sm text-slate-300 font-light">{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-lg text-white font-light text-center mt-8">
              We don't analyze markets. We analyze reality.
            </p>
          </div>

          <div className="mb-32 max-w-4xl mx-auto">
            <p className="text-xs text-slate-600 mb-16 text-center tracking-[0.3em] font-normal">WHO THESE PAPERS ARE FOR</p>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-10">
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                {[
                  'Strategic analysts',
                  'Hedge funds',
                  'Energy & mining desks',
                  'Governments',
                  'Infrastructure operators',
                  'Defense-linked industries'
                ].map((audience, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                    <p className="text-base text-slate-300 font-light">{audience}</p>
                  </div>
                ))}
              </div>

              <p className="text-base text-slate-400 font-light text-center italic">
                If your decisions affect supply chains, these papers are for you.
              </p>
            </div>
          </div>

          <div className="mb-32 max-w-4xl mx-auto">
            <p className="text-xs text-slate-600 mb-16 text-center tracking-[0.3em] font-normal">RESEARCH ACCESS POLICY</p>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.08] rounded-lg p-10">
              <ul className="space-y-4 mb-8">
                {[
                  'No anonymous research access',
                  'No free institutional usage',
                  'Manual validation only',
                  'Misuse leads to permanent ban'
                ].map((policy, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600/60 mt-2 flex-shrink-0"></div>
                    <p className="text-base text-slate-400 font-light">{policy}</p>
                  </li>
                ))}
              </ul>

              <p className="text-lg text-white font-light text-center">
                Intelligence is earned, not consumed.
              </p>
            </div>
          </div>

          <div className="text-center py-16 border-y border-white/[0.10]">
            <p className="text-2xl md:text-4xl font-light leading-relaxed text-slate-300">
              Retail reads headlines.<br />
              Institutions read consequences.<br />
              <span className="text-white">Operators read causality.</span>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
