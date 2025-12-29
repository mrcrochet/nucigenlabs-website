import { XCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import SimpleWaitlistForm from '../components/SimpleWaitlistForm';
import CountdownTimer from '../components/CountdownTimer';
import LiveNewsFeed from '../components/LiveNewsFeed';
import FourLevels from '../components/FourLevels';
import WhoThisIsFor from '../components/WhoThisIsFor';
import Mission from '../components/Mission';
import AdvancedFeatures from '../components/AdvancedFeatures';
import HowPeopleUseNucigen from '../components/HowPeopleUseNucigen';
import TypewriterText from '../components/TypewriterText';
import SocialProof from '../components/SocialProof';

export default function Home() {
  const [openStep, setOpenStep] = useState<number | null>(0); // First step open by default
  const [isNotOpen, setIsNotOpen] = useState(false);

  return (
    <main className="min-h-screen">
      <SEO 
        title="Nucigen Labs — Strategic Intelligence for Operators"
        description="We scan the news. We predict the market. Before it moves. Transform global news into predictive market signals in real-time. Limited to 1,200 early access spots."
        keywords="market intelligence, predictive analytics, geopolitical analysis, financial forecasting, strategic intelligence, market prediction, real-time intelligence, early access"
      />

      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-5xl mx-auto w-full text-center">
          <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-full px-4 sm:px-6 py-2 mb-6 sm:mb-8">
            <p className="text-xs sm:text-sm text-[#E1463E] font-light tracking-[0.15em]">PREDICTIVE NEWS ANALYSIS</p>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-light mb-6 sm:mb-10 leading-[1.1] text-white px-2">
            We scan the news.<br className="hidden sm:block" /> We predict the market.<br className="hidden sm:block" />
            <span className="text-[#E1463E]">Before it moves.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-400 leading-relaxed font-light mb-4 sm:mb-6 max-w-4xl mx-auto px-4">
            Nucigen Labs transforms global news into predictive market signals in real-time.
          </p>

          <p className="text-base md:text-lg text-slate-500 leading-relaxed font-light mb-8 max-w-3xl mx-auto min-h-[4rem]">
            <TypewriterText
              texts={[
                'When a factory closes in Taiwan or a sanction hits Russia, we detect it instantly and predict which assets will move — hours or days before the market reacts.',
                'When a port shuts down in Shanghai or a trade agreement collapses, we identify the ripple effects across supply chains — before prices adjust.',
                'When a mining operation halts in Chile or geopolitical tensions escalate, we map the causal chains to market impact — giving you time to position.',
                'When energy infrastructure fails or regulatory changes emerge, we predict sector-wide consequences — before the news becomes obvious.',
                'When industrial capacity shifts or currency policies change, we forecast asset movements — hours or days ahead of market reaction.',
                'When consumer demand shifts abruptly or brand sentiment deteriorates, Nucigen Labs models the causal chain from demand signals to inventory pressure and pricing behavior before it becomes visible in earnings.',
                'When volatility regimes shift following political or economic stress, Nucigen Labs maps the underlying causal drivers to distinguish transitory shocks from structural repricing.',
                'When compute availability tightens or data center expansion slows, Nucigen Labs maps how capacity constraints propagate across AI, cloud, and enterprise software ecosystems.',
                'When a major competitor exits a market or cuts capacity, Nucigen Labs maps substitution limits and market structure to identify which players gain pricing power ahead of market consensus.',
                'When political instability escalates in a strategic region, Nucigen Labs models how institutional disruption propagates through production, logistics, and investment flows to anticipate market impact.',
                'When new sanctions are introduced or enforcement tightens, Nucigen Labs maps the causal chains across trade, compliance, and supply corridors to identify downstream exposure before markets fully adjust.',
                'Political uncertainty does not hit markets directly. It first alters permits, enforcement, financing, and movement. Nucigen Labs models those intermediate constraints before they show up in prices.',
                'Industrial bottlenecks are often invisible until they fail. Nucigen Labs identifies them earlier by mapping dependency networks rather than monitoring output alone.',
                'Technological systems fail gradually, not suddenly. Nucigen Labs tracks capacity saturation and dependency buildup to detect stress before outages occur.',
                'Nucigen Labs does not forecast outcomes. It maps how decisions and disruptions propagate through real systems.',
                'Volatility is rarely random. Nucigen Labs links price instability to structural constraints rather than treating it as noise.',
                'A regulatory decision in one capital can quietly reshape production incentives across multiple regions. Nucigen Labs traces those shifts through industrial and trade systems to surface their downstream effects.'
              ]}
              typingSpeed={60}
              deletingSpeed={20}
              pauseDuration={4000}
              className="text-slate-500"
            />
          </p>

          {/* Simple explanation layer */}
          <div className="mb-12 max-w-3xl mx-auto">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl p-6 hover:border-white/[0.12] transition-all duration-300">
              <p className="text-sm text-slate-500 font-light mb-2 tracking-[0.15em] text-center uppercase">IN SIMPLE TERMS</p>
              <p className="text-base text-slate-300 font-light leading-relaxed text-center">
                We translate world events into early market insights — so you understand what's coming before it becomes obvious.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-2xl px-8 py-6">
              <div className="text-xs text-slate-500 font-light tracking-[0.2em] mb-4 text-center">OFFICIAL LAUNCH IN</div>
              <CountdownTimer />
            </div>
          </div>

          <div className="mb-12 max-w-2xl mx-auto">
            <SimpleWaitlistForm variant="inline" />
            <p className="text-xs text-slate-500 font-light mt-4 text-center">
              Be ahead of the market, not behind it.
            </p>
          </div>
        </div>
      </section>

      <LiveNewsFeed />

      {/* Who is this for - Early section */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 sm:mb-6 text-white px-2">
              Who is Nucigen Labs for?
            </h2>
            <p className="text-base sm:text-lg text-slate-400 font-light max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4">
              If you care about understanding why markets move — not just reacting after — Nucigen Labs is for you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[
              {
                title: 'Everyone who\'s curious',
                description: 'Understand how real markets work by seeing cause → effect in action'
              },
              {
                title: 'Investors',
                description: 'Avoid reacting too late. Get early signals before markets reprice'
              },
              {
                title: 'Professionals',
                description: 'Monitor structural signals and risk thresholds in real-time'
              }
            ].map((item, idx) => (
              <div key={idx} className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl p-4 sm:p-6 text-center hover:border-white/[0.15] hover:shadow-xl hover:shadow-white/[0.03] hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-base sm:text-lg text-white font-light mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center space-y-3 sm:space-y-4 px-4">
            <p className="text-sm sm:text-base text-slate-300 font-light italic">
              You don't need to be a specialist. We offer the same technology that specialists use.
            </p>
            <p className="text-xs sm:text-sm text-slate-400 font-light">
              The same intelligence used by professionals — now accessible to everyone who's curious about how the world works.
            </p>
          </div>
        </div>
      </section>

      <section className="relative px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-light mb-8 sm:mb-12 px-2">
              What Nucigen Labs is NOT
            </h2>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden hover:border-white/[0.18] transition-all duration-300">
            <button
              onClick={() => setIsNotOpen(!isNotOpen)}
              className="w-full px-10 py-6 flex items-center justify-between gap-4 text-left focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-black"
              aria-expanded={isNotOpen}
            >
              <div className="flex items-center gap-3">
                <XCircle size={20} className="text-[#E1463E]/70 flex-shrink-0" />
                <span className="text-base text-slate-400 font-light">What Nucigen Labs is NOT</span>
              </div>
              <ChevronDown
                size={20}
                className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                  isNotOpen ? 'transform rotate-180' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isNotOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-10 pb-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    'Not a signal group',
                    'Not a trading bot',
                    'Not a sentiment-based hype tool',
                    'Not a get-rich-quick platform'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80">
                      <XCircle size={20} className="text-[#E1463E]/70 flex-shrink-0" />
                      <p className="text-base text-slate-400 font-light">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-10 hover:border-white/[0.18] transition-all duration-300">
            <div className="text-center">
              <p className="text-sm text-slate-500 font-light mb-3 tracking-[0.15em] uppercase">WHAT NUCIGEN LABS IS</p>
              <p className="text-xl font-light text-white">
                A strategic information-to-decision platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-light">
      <FourLevels />
      </div>

      <AdvancedFeatures />

      {/* Simple Example Section */}
      <section className="relative px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
              <span className="text-[10px] text-slate-600 font-light tracking-[0.25em]">EXAMPLE</span>
            </div>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-3 sm:mb-4 px-2">
              How it works in practice
            </h3>
            <p className="text-sm sm:text-base text-slate-400 font-light max-w-2xl mx-auto mb-4 sm:mb-6 px-4">
              See how we transform a real-world event into actionable market intelligence
            </p>
            <div className="max-w-2xl mx-auto mb-8">
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-xl p-6">
                <p className="text-sm text-slate-500 font-light mb-2 tracking-wide text-center">In simple terms:</p>
                <p className="text-base text-slate-300 font-light leading-relaxed text-center min-h-[3rem]">
                  <TypewriterText
                    texts={[
                      'We turn world events into clear signals about what might happen next in markets — so you can act earlier, not later.',
                      'Technological systems fail gradually, not suddenly. Nucigen Labs tracks capacity saturation and dependency buildup.',
                      'A regulatory decision in one capital can quietly reshape production incentives across multiple regions.',
                      'When volatility regimes shift, Nucigen Labs maps the underlying causal drivers to distinguish transitory shocks from structural repricing.',
                      'Industrial bottlenecks are often invisible until they fail. Nucigen Labs identifies them earlier by mapping dependency networks.'
                    ]}
                    typingSpeed={65}
                    deletingSpeed={25}
                    pauseDuration={4500}
                    className="text-slate-300"
                  />
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            {[
              {
                step: 1,
                label: 'Event Detected',
                time: 'Real-time',
                title: 'A strike shuts down a lithium mine in Chile',
                description: 'Our system detects this event from global news sources within minutes'
              },
              {
                step: 2,
                label: 'Impact Predicted',
                time: 'Within hours',
                title: 'Battery supply tightens → EV manufacturers face higher costs',
                description: 'We map the causal chain: mine closure → lithium shortage → battery production impact → EV manufacturing costs'
              },
              {
                step: 3,
                label: 'Market Signal',
                time: 'Before market reacts',
                title: 'EV stocks likely to come under pressure before the market reacts',
                description: 'You receive this signal hours or days before prices adjust, giving you time to position'
              }
            ].map((stepData, idx) => {
              const isOpen = openStep === idx;
              return (
                <div key={idx} className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden hover:border-white/[0.20] transition-all duration-300">
                  <button
                    onClick={() => setOpenStep(isOpen ? null : idx)}
                    className="w-full px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 text-left focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-black min-h-[44px]"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#E1463E] font-bold text-base sm:text-lg">{stepData.step}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">{stepData.label}</p>
                          <span className="text-xs text-slate-600">•</span>
                          <p className="text-xs text-slate-500 font-light">{stepData.time}</p>
                        </div>
                        <p className="text-sm sm:text-base text-white font-light">{stepData.title}</p>
                      </div>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-4 sm:px-6 pb-3 sm:pb-4 pl-14 sm:pl-20">
                      <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">{stepData.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/30 rounded-xl p-8 text-center hover:border-[#E1463E]/40 hover:shadow-xl hover:shadow-[#E1463E]/10 transition-all duration-300">
            <p className="text-lg text-white font-light mb-3">
              <span className="font-medium">Less stress. Less noise. More clarity.</span>
            </p>
            <p className="text-sm text-slate-300 font-light">
              No hype. No guessing. Just understanding what's changing — before it becomes obvious.
            </p>
          </div>
        </div>
      </section>

      <div className="section-light">
      <HowPeopleUseNucigen />
      </div>

      <section className="relative px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-10 text-center hover:border-white/[0.18] transition-all duration-300">
            <div className="inline-block mb-6 px-4 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
              <span className="text-[10px] text-slate-600 font-light tracking-[0.25em] uppercase">TECHNOLOGY</span>
            </div>
            <h3 className="text-2xl font-light text-white mb-4">
              Fully automated causal inference engine
            </h3>
            <p className="text-base text-slate-400 font-light leading-relaxed max-w-2xl mx-auto mb-4">
              Signals are generated automatically and continuously from global news sources. 
              Our LLM-based system extracts causal structure and predicts market impact with no human bias. 
              High-impact events receive additional validation, but the core intelligence engine operates 24/7 without intervention.
            </p>
            <p className="text-sm text-slate-500 font-light leading-relaxed max-w-2xl mx-auto italic min-h-[3rem]">
              <TypewriterText
                texts={[
                  'In practice: we follow "cause → effect → market reaction" step by step. You never see the complexity — only the insights.',
                  'When consumer demand shifts abruptly, Nucigen Labs models the causal chain from demand signals to inventory pressure before it becomes visible in earnings.',
                  'Political uncertainty does not hit markets directly. It first alters permits, enforcement, financing, and movement.',
                  'Nucigen Labs traces regulatory shifts through industrial and trade systems to surface their downstream effects.',
                  'Volatility is rarely random. Nucigen Labs links price instability to structural constraints rather than treating it as noise.'
                ]}
                typingSpeed={60}
                deletingSpeed={25}
                pauseDuration={5000}
                className="text-slate-500 italic"
              />
            </p>
          </div>
        </div>
      </section>

      <SocialProof />

      <div className="section-light">
        <SimpleWaitlistForm variant="section" className="" />
      </div>

      <Mission />

      <Footer />
    </main>
  );
}
