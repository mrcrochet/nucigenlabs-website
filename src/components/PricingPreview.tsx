import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, TrendingUp, Shield, Zap, Sparkles, Lock, Star } from 'lucide-react';
import InstitutionalAccessModal from './InstitutionalAccessModal';
import LiveNewsTicker from './LiveNewsTicker';

export default function PricingPreview() {
  const [showInstitutionalModal, setShowInstitutionalModal] = useState(false);

  return (
    <>
      {/* Hero Section */}
      <section className="relative px-6 py-32">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-full px-6 py-2 mb-8">
            <p className="text-sm text-[#E1463E] font-light tracking-[0.15em]">TRANSPARENT PRICING</p>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-6 leading-[1.1] text-white">
            Strategic intelligence.<br />
            <span className="text-slate-300">Simple pricing.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light mb-4 max-w-3xl mx-auto">
            Professional-grade market intelligence — no longer reserved for institutions.
          </p>
          
          <p className="text-sm text-slate-500 font-light">
            Pay for intelligence, not infrastructure. No setup fees. No hidden costs.
          </p>
        </div>
      </section>

      {/* Main Pricing Cards */}
      <section className="relative px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Individual Plan - Featured */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.10] to-white/[0.03] border-2 border-[#E1463E]/30 rounded-2xl p-10 relative overflow-hidden group hover:border-[#E1463E]/50 transition-all duration-300">
              {/* Featured Badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-br from-[#E1463E] to-[#E1463E]/80 rounded-bl-2xl rounded-tr-2xl px-4 py-2 z-20">
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-white fill-white" />
                  <span className="text-[10px] text-white font-light tracking-wider uppercase">Available Now</span>
                </div>
              </div>

              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#E1463E]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

              <div className="relative z-10">
                <div className="mb-8">
                  <h3 className="text-2xl font-light text-white mb-3">Nucigen Labs Intelligence</h3>
                  <p className="text-sm text-slate-400 font-light mb-6 leading-relaxed">
                    For individual operators, analysts, and strategic decision-makers.
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl text-white font-light tracking-tight">$59</span>
                    <span className="text-slate-400 font-light text-lg">/ month</span>
                  </div>

                  <p className="text-xs text-slate-500 font-light mb-6">
                    Early access pricing. No commitments.
                  </p>
                </div>

                <div className="space-y-3.5 mb-8">
                  {[
                    'Real-time geopolitical event detection',
                    'Market impact forecasting (stocks, commodities)',
                    'Causal event-to-market dashboards',
                    'Alpha window predictions',
                    'Supply chain disruption alerts',
                    'Multi-asset exposure analysis',
                    'Customizable intelligence feeds'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <Check size={18} className="text-[#E1463E]" />
                      </div>
                      <p className="text-sm text-slate-300 font-light leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>

              <Link
                to="/request-access"
                className="w-full group relative inline-flex items-center justify-center gap-2 px-6 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-300 text-sm tracking-wide shadow-lg shadow-[#E1463E]/20 hover:shadow-xl hover:shadow-[#E1463E]/30 hover:scale-[1.02] mb-3"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Request Access
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
                
                <p className="text-xs text-slate-500 font-light text-center">
                  Manual approval required
                </p>
              </div>
            </div>

            {/* Pro Plan - Blurred/Coming Soon */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.10] rounded-2xl p-10 relative overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-20 rounded-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <Lock size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400 font-light tracking-wide">Coming Soon</p>
                  <p className="text-xs text-slate-600 font-light mt-1">Q2 2026</p>
                </div>
              </div>

              <div className="relative z-10 opacity-25">
                <div className="mb-8">
                  <h3 className="text-2xl font-light text-white mb-3">Nucigen Labs Pro</h3>
                  <p className="text-sm text-slate-400 font-light mb-6">
                    For professional teams and growing organizations.
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl text-white font-light tracking-tight">$XXX</span>
                    <span className="text-slate-400 font-light text-lg">/ month</span>
              </div>

                  <p className="text-xs text-slate-500 font-light mb-6">
                    Advanced features. Team collaboration. Priority support.
                  </p>
                </div>

                <div className="space-y-3.5 mb-8">
                  {[
                    'Everything in Intelligence, plus:',
                    'Team collaboration features',
                    'Advanced analytics and reporting',
                    'Live web research with AI agents',
                    'Priority support',
                    'Custom integrations',
                    'Enhanced API access',
                    'Dedicated account manager'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <Check size={18} className="text-[#E1463E]/30" />
                      </div>
                      <p className="text-sm text-slate-400 font-light leading-relaxed">{feature}</p>
                </div>
                  ))}
                </div>

                <button
                  disabled
                  className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 text-slate-600 font-light rounded-lg text-sm tracking-wide mb-3 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>

            {/* Institutional Plan - Blurred/Coming Soon */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.01] border border-white/[0.10] rounded-2xl p-10 relative overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-20 rounded-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <Lock size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-400 font-light tracking-wide">Coming Soon</p>
                  <p className="text-xs text-slate-600 font-light mt-1">Q3 2026</p>
                </div>
              </div>

              <div className="relative z-10 opacity-25">
                <div className="mb-8">
                  <h3 className="text-2xl font-light text-white mb-3">Nucigen Labs Enterprise</h3>
                  <p className="text-sm text-slate-400 font-light mb-6">
                    For institutions, funds, and organizations requiring strategic intelligence at scale.
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-6xl text-white font-light tracking-tight">Custom</span>
                  </div>
                  
                  <p className="text-xs text-slate-500 font-light mb-6">
                    Volume pricing. Dedicated support. Custom integrations.
                  </p>
                </div>

                <div className="space-y-3.5 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <Check size={18} className="text-[#E1463E]/30" />
                    </div>
                    <p className="text-sm text-slate-400 font-light leading-relaxed">
                      <strong className="text-white/30">Everything in Intelligence, plus:</strong>
                    </p>
                  </div>
                  
                  {[
                    'Multi-user access with role-based permissions',
                    'API access for custom integrations',
                    'Dedicated intelligence analyst support',
                    'Custom event detection rules',
                    'White-label reporting and dashboards',
                    'Priority alpha window alerts',
                    'Quarterly strategic intelligence briefings',
                    'Custom supply chain mapping'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <Check size={18} className="text-[#E1463E]/30" />
                      </div>
                      <p className="text-sm text-slate-400 font-light leading-relaxed">{feature}</p>
                    </div>
                  ))}
                </div>

                <button
                  disabled
                  className="w-full px-6 py-4 bg-white/[0.03] border border-white/5 text-slate-600 font-light rounded-lg text-sm tracking-wide mb-3 cursor-not-allowed"
                >
                  Coming Soon
                </button>
                
                <p className="text-xs text-slate-600 font-light text-center">
                  Manual review process
                </p>
              </div>
            </div>
          </div>

          {/* No Competition Section */}
          <div className="text-center mb-16">
            <div className="max-w-4xl mx-auto backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.12] rounded-2xl p-12">
              {/* Bloc 1 - Titre institutionnel */}
              <div className="mb-10">
                <h3 className="text-3xl md:text-4xl font-light text-white mb-3 leading-tight tracking-tight">
                  Institutional-grade intelligence,<br />
                  <span className="text-slate-300">re-engineered for decision-makers.</span>
                </h3>
                <p className="text-sm text-slate-500 font-light tracking-wide mt-4">
                  Why there is no direct competition
                </p>
              </div>

              <div className="space-y-8 text-left max-w-3xl mx-auto">
                {/* Bloc 2 - Thèse centrale */}
                <div>
                  <p className="text-lg text-slate-200 font-light leading-relaxed">
                    We make institutional intelligence <strong className="text-white">operational</strong> — outside of institutions.
                  </p>
                </div>

                {/* Bloc 3 - Comparaison implicite */}
                <div className="space-y-4">
                  <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-xl p-6">
                    <p className="text-base text-slate-300 font-light leading-relaxed mb-4">
                      <span className="opacity-40 blur-sm">Traditional financial platforms</span> optimize historical certainty.
                    </p>
                    <p className="text-base text-white font-light leading-relaxed">
                      <strong className="text-[#E1463E]">Nucigen Labs</strong> is built for forward-looking interpretation.
                    </p>
              </div>

                  <div className="grid md:grid-cols-3 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-sm text-slate-400 font-light">Signals, not noise</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400 font-light">Causality, not correlation</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-400 font-light">Decisions, not dashboards</p>
                    </div>
                  </div>
                </div>

                {/* Bloc 4 - Légitimation institutionnelle */}
                <div className="space-y-4 pt-4">
                  <p className="text-base text-slate-300 font-light leading-relaxed">
                    Until now, this level of intelligence existed only inside:
                  </p>
                  
                  <ul className="space-y-2 ml-6">
                    <li className="text-base text-slate-300 font-light leading-relaxed">
                      – major financial institutions
                    </li>
                    <li className="text-base text-slate-300 font-light leading-relaxed">
                      – sovereign investment funds
                    </li>
                    <li className="text-base text-slate-300 font-light leading-relaxed">
                      – internal government units
                    </li>
                  </ul>
                  
                  <p className="text-base text-slate-300 font-light leading-relaxed pt-2">
                    These systems were never sold. They were <strong className="text-white">built internally, at extreme cost</strong>, and kept private.
                  </p>
                  
                  <p className="text-base text-slate-300 font-light leading-relaxed">
                    Nucigen Labs brings this institutional-grade environment into a unified, accessible platform — with the same analytical depth, auditability, and decision logic previously reserved for closed desks.
                  </p>
                </div>

                {/* Prix en fin de section */}
                <div className="pt-6 border-t border-white/[0.08]">
                  <p className="text-base text-slate-300 font-light leading-relaxed mb-4">
                    <strong className="text-white">Access is subscription-based.</strong>
                  </p>
                  <p className="text-base text-slate-300 font-light leading-relaxed mb-6">
                    Pricing starts at <strong className="text-[#E1463E]">$59/month</strong>, designed to extend institutional intelligence beyond Wall Street.
                  </p>
                  
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-6">
                    <p className="text-sm text-slate-400 font-medium mb-4 tracking-wide">$59/month includes:</p>
                    <div className="space-y-3">
                      {[
                        'Real-time event stream from global news sources',
                        'Market impact predictions with timing estimates',
                        'Sector & asset exposure analysis',
                        'Email and in-app alerts',
                        'Access to historical signals and patterns',
                        'Multi-asset class coverage (stocks, commodities)',
                        'Customizable alert frequency and filters'
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-1 h-1 rounded-full bg-[#E1463E] mt-2 flex-shrink-0"></div>
                          <p className="text-sm text-slate-300 font-light">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mantra produit */}
                <div className="pt-6 border-t border-white/[0.08] text-center">
                  <p className="text-sm text-slate-400 font-light italic leading-relaxed">
                    We don't replace <span className="opacity-40 blur-sm">Bloomberg</span>.<br />
                    We operate where <span className="opacity-40 blur-sm">Bloomberg</span> stops.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column - General Features */}
            <div>
              <h3 className="text-2xl font-light text-white mb-8">Every Nucigen Labs Intelligence feature</h3>
              <div className="space-y-5">
                {[
                  'Set up in under an hour',
                  'Handles global news, geopolitical events, and market signals',
                  'Customizable intelligence depth and alert frequency',
                  'Takes action to track external systems and supply chains',
                  'Transfers to human analysts when needed',
                  'Real-time event detection and alpha window identification',
                  'Multi-asset class coverage (stocks, commodities)'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E1463E] mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-slate-300 font-light leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Enterprise Features */}
            <div>
              <h3 className="text-2xl font-light text-white mb-8">Enterprise features, plus:</h3>
              <div className="space-y-5">
                {[
                  'Configurable intelligence dashboards and reporting',
                  'Email, API, webhook, and custom integrations',
                  'Workflow automations & pre-built intelligence pipelines',
                  'Private knowledge base and intelligence hub',
                  'Proactive strategic intelligence briefings',
                  'Custom event detection and monitoring rules',
                  'Dedicated support and onboarding'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E1463E] mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-slate-300 font-light leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              Simple, transparent pricing that scales
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
              Pricing aligns with value. No setup fees. No integration costs. No platform fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Resolution-based pricing */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-xl p-8 text-center hover:border-white/[0.12] transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mx-auto mb-6">
                <Zap size={24} className="text-[#E1463E]" />
              </div>
              <h3 className="text-xl font-light text-white mb-4">Subscription-based pricing</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Pay a fixed monthly fee for unlimited access to intelligence — no per-alert charges or hidden fees.
              </p>
            </div>

            {/* Control built in */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-xl p-8 text-center hover:border-white/[0.12] transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mx-auto mb-6">
                <Shield size={24} className="text-[#E1463E]" />
              </div>
              <h3 className="text-xl font-light text-white mb-4">Control built in</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Manage usage with configurable alerts, custom intelligence filters, and real-time reporting dashboards.
              </p>
            </div>

            {/* Value that compounds */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-xl p-8 text-center hover:border-white/[0.12] transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mx-auto mb-6">
                <TrendingUp size={24} className="text-[#E1463E]" />
              </div>
              <h3 className="text-xl font-light text-white mb-4">Value that compounds</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                As Nucigen Labs handles more intelligence, your strategic advantage grows — without sacrificing quality or speed.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Live News Ticker */}
      <LiveNewsTicker />

      <InstitutionalAccessModal
        isOpen={showInstitutionalModal}
        onClose={() => setShowInstitutionalModal(false)}
        onSuccess={() => {}}
        onError={() => {}}
      />
    </>
  );
}
