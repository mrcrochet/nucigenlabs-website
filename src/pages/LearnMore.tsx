import { Link } from 'react-router-dom';
import { ArrowRight, Zap, TrendingUp, Globe, Target, Shield, Clock, CheckCircle2, Layers, FileText, BarChart3, Users } from 'lucide-react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import FourLevels from '../components/FourLevels';
import LiveNewsFeed from '../components/LiveNewsFeed';
import TypewriterText from '../components/TypewriterText';

export default function LearnMore() {
  return (
    <main className="min-h-screen">
      <SEO
        title="Learn More — Nucigen Labs"
        description="Discover how Nucigen Labs transforms global news into predictive market intelligence before markets react."
      />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-32">
        <div className="max-w-5xl mx-auto w-full text-center">
          <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-full px-6 py-2 mb-8">
            <p className="text-sm text-[#E1463E] font-light tracking-[0.15em]">WELCOME TO NUCIGEN LABS</p>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-10 leading-[1.1] text-white">
            We scan the news.<br />
            We predict the market.<br />
            <span className="text-[#E1463E]">Before it moves.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light mb-6 max-w-4xl mx-auto">
            Nucigen Labs transforms global news into predictive market signals in real-time.
          </p>

          <p className="text-base md:text-lg text-slate-500 leading-relaxed font-light mb-12 max-w-3xl mx-auto min-h-[4rem]">
            <TypewriterText
              texts={[
                'When a factory closes in Taiwan or a sanction hits Russia, we detect it instantly and predict which assets will move — hours or days before the market reacts.',
                'When consumer demand shifts abruptly, Nucigen models the causal chain from demand signals to inventory pressure before it becomes visible in earnings.',
                'When volatility regimes shift following political or economic stress, Nucigen maps the underlying causal drivers to distinguish transitory shocks from structural repricing.',
                'Political uncertainty does not hit markets directly. It first alters permits, enforcement, financing, and movement.',
                'Nucigen does not forecast outcomes. It maps how decisions and disruptions propagate through real systems.'
              ]}
              typingSpeed={60}
              deletingSpeed={20}
              pauseDuration={4000}
              className="text-slate-500"
            />
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
              <span className="text-xs text-slate-500 font-light tracking-[0.2em]">HOW IT WORKS</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-light text-white mb-8 leading-tight">
              From news to prediction<br />
              <span className="text-slate-400">in real-time</span>
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-3xl mx-auto">
              Our system continuously monitors global events and calculates their market impact before prices adjust.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-8 hover:border-white/[0.2] transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-6">
                <Globe size={28} className="text-[#E1463E]" />
              </div>
              <h3 className="text-xl font-light text-white mb-4">1. Global News Scanning</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                We monitor thousands of news sources worldwide, 24/7, detecting events that impact markets: factory closures, sanctions, trade deals, natural disasters.
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-8 hover:border-white/[0.2] transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-6">
                <Layers size={28} className="text-[#E1463E]" />
              </div>
              <h3 className="text-xl font-light text-white mb-4">2. Four-Level Analysis</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Each event is analyzed across four levels: Geopolitical, Industrial, Financial, and Market Impact. We trace the causal chain from event to consequence.
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-8 hover:border-white/[0.2] transition-all duration-300">
              <div className="w-14 h-14 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-6">
                <TrendingUp size={28} className="text-[#E1463E]" />
              </div>
              <h3 className="text-xl font-light text-white mb-4">3. Predictive Intelligence</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Before markets react, we identify which assets, sectors, and regions will be affected. You get actionable intelligence hours or days ahead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live News Preview */}
      <div className="section-light">
        <LiveNewsFeed />
      </div>

      {/* Four Levels */}
      <section className="relative px-6 py-24">
        <FourLevels />
      </section>

      {/* Key Features */}
      <div className="section-light">
        <section className="relative px-6 py-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                <span className="text-xs text-slate-500 font-light tracking-[0.2em]">KEY FEATURES</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-light text-white mb-8 leading-tight">
                Everything you need<br />
                <span className="text-slate-400">to stay ahead</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: 'Real-time Monitoring',
                  description: '24/7 news scanning and event detection across global markets'
                },
                {
                  icon: Target,
                  title: 'Precise Predictions',
                  description: 'Identify which assets will move before market repricing'
                },
                {
                  icon: Clock,
                  title: 'Time Advantage',
                  description: 'Get intelligence hours or days before markets react'
                },
                {
                  icon: Shield,
                  title: 'Causal Analysis',
                  description: 'Understand the why, not just the what. Trace events to consequences'
                },
                {
                  icon: BarChart3,
                  title: 'Market Impact',
                  description: 'See how geopolitical events propagate through supply chains'
                },
                {
                  icon: FileText,
                  title: 'Research Papers',
                  description: 'Access original research on causality and market dynamics'
                }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-6 hover:border-white/[0.2] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-4">
                    <feature.icon size={24} className="text-[#E1463E]" />
                  </div>
                  <h3 className="text-lg font-light text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Who It's For */}
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
              <span className="text-xs text-slate-500 font-light tracking-[0.2em]">WHO IT'S FOR</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-light text-white mb-8 leading-tight">
              Built for professionals<br />
              <span className="text-slate-400">who think in systems</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Users,
                title: 'Analysts & Researchers',
                description: 'Get early sector inflection points and real-time event monitoring with causality classification.',
                features: ['Early sector inflection points', 'Real-time event monitoring', 'Causality classification']
              },
              {
                icon: TrendingUp,
                title: 'Investors & Traders',
                description: 'Identify alpha windows and understand macro-to-micro propagation with sector sensitivity mapping.',
                features: ['Alpha windows', 'Macro-to-micro propagation', 'Sector sensitivity mapping']
              },
              {
                icon: Shield,
                title: 'Fund Managers',
                description: 'Make strategic decisions based on geopolitical and industrial intelligence before markets reprice.',
                features: ['Strategic intelligence', 'Risk assessment', 'Portfolio optimization']
              },
              {
                icon: BarChart3,
                title: 'Institutional Teams',
                description: 'Access private intelligence feeds, API pipelines, and strategic reports for your organization.',
                features: ['Private intelligence feed', 'API pipelines', 'Strategic reports']
              }
            ].map((audience, idx) => (
              <div
                key={idx}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-8 hover:border-white/[0.2] transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center">
                    <audience.icon size={24} className="text-[#E1463E]" />
                  </div>
                  <h3 className="text-xl font-light text-white">{audience.title}</h3>
                </div>
                <p className="text-sm text-slate-400 font-light leading-relaxed mb-6">{audience.description}</p>
                <ul className="space-y-2">
                  {audience.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#E1463E] flex-shrink-0" />
                      <span className="text-xs text-slate-500 font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <div className="section-light">
        <section className="relative px-6 py-24">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
                <span className="text-xs text-slate-500 font-light tracking-[0.2em]">WHAT MAKES US DIFFERENT</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-light text-white mb-12">
                Not a signal group.<br />
                Not a trading bot.<br />
                Not a sentiment tool.
              </h2>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-10">
              <div className="text-center mb-8">
                <p className="text-sm text-slate-500 font-light mb-3 tracking-[0.2em]">WHAT NUCIGEN LABS IS</p>
                <p className="text-2xl font-light text-white">
                  A strategic information-to-decision platform.
                </p>
              </div>
              <p className="text-base text-slate-400 font-light leading-relaxed text-center max-w-2xl mx-auto">
                We don't predict markets. We predict consequences. We trace the causal chain from geopolitical events through industrial supply chains to financial markets — automatically, in real-time.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* CTA Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-lg text-slate-400 font-light mb-10 max-w-2xl mx-auto">
            Explore our intelligence platform, research papers, and case studies to see how Nucigen Labs can help you stay ahead of the markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/intelligence"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_25px_rgba(225,70,62,0.35)]"
            >
              Explore Intelligence
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/papers"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 hover:border-white/40 hover:bg-white/[0.05] rounded-lg text-white text-base font-light transition-all"
            >
              Read Research Papers
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}


