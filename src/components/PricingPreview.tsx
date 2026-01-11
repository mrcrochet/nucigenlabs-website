import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, ChevronDown } from 'lucide-react';

type BillingPeriod = 'monthly' | 'yearly';

interface Plan {
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  features: string[];
  cta: string;
  ctaLink: string;
}

export default function PricingPreview() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const plans: Plan[] = [
    {
      name: 'Intelligence',
      tagline: 'For individual operators, analysts, and strategic decision-makers.',
      monthlyPrice: 59,
      yearlyPrice: 531, // 25% off: 59 * 12 * 0.75 = 531
      popular: false,
      features: [
        'Real-time geopolitical event detection',
        'Market and geopolitical event predictions',
        'Market impact forecasting (stocks, commodities)',
        'Causal event-to-market dashboards',
        'Alpha window predictions',
        'Supply chain disruption alerts',
        'Multi-asset exposure analysis',
        'Customizable intelligence feeds',
        'Email and in-app alerts',
        'Access to historical signals and patterns'
      ],
      cta: 'Request Access',
      ctaLink: '/register'
    },
    {
      name: 'Pro',
      tagline: 'For professional teams and growing organizations.',
      monthlyPrice: 99,
      yearlyPrice: 891, // 25% off: 99 * 12 * 0.75 = 891
      popular: true,
      features: [
        'Everything in Intelligence, plus:',
        'Real-time event research and fact-checking',
        'Causal chain analysis and verification',
        'Team collaboration features',
        'Advanced analytics and reporting',
        'Live web research with AI agents',
        'Priority support',
        'Custom integrations',
        'Enhanced API access',
        'Dedicated account manager',
        'Workflow automations',
        'Private knowledge base'
      ],
      cta: 'Request Access',
      ctaLink: '/register'
    },
    {
      name: 'Ultimate',
      tagline: 'For scaling teams that require enterprise-grade stability.',
      monthlyPrice: 199,
      yearlyPrice: 1791, // 25% off: 199 * 12 * 0.75 = 1791
      popular: false,
      features: [
        'Everything in Pro, plus:',
        'High-performance API limits',
        'Dedicated onboarding',
        'Advanced security controls',
        'Private team environments',
        'Lifetime priority support',
        'Custom event detection rules',
        'White-label reporting',
        'Quarterly strategic briefings',
        'Custom supply chain mapping'
      ],
      cta: 'Contact Sales',
      ctaLink: '/register'
    }
  ];

  const comparisonFeatures = [
    { feature: 'Events Monitored', intelligence: 'Unlimited', pro: 'Unlimited', ultimate: 'Unlimited' },
    { feature: 'Team Members', intelligence: '1', pro: '10', ultimate: 'Unlimited' },
    { feature: 'API Requests', intelligence: '1,000/month', pro: '10,000/month', ultimate: 'Unlimited' },
    { feature: 'Alert Frequency', intelligence: 'Standard', pro: 'Priority', ultimate: 'Real-time' },
    { feature: 'Dashboard Access', intelligence: 'Basic', pro: 'Advanced', ultimate: 'Custom' },
    { feature: 'Data Retention', intelligence: '90 days', pro: '1 year', ultimate: 'Unlimited' },
    { feature: 'Support Level', intelligence: 'Email', pro: 'Priority', ultimate: 'Dedicated' },
    { feature: 'Custom Integrations', intelligence: '—', pro: '5', ultimate: 'Unlimited' },
    { feature: 'Onboarding', intelligence: 'Self-service', pro: 'Guided', ultimate: 'Dedicated' }
  ];

  const faqs = [
    {
      question: 'What is Nucigen Labs?',
      answer: 'Nucigen Labs is a strategic intelligence platform that transforms global news into predictive market signals in real-time. We detect geopolitical and industrial events and predict their market impact before prices adjust.'
    },
    {
      question: 'Who is Nucigen Labs built for?',
      answer: 'Nucigen Labs is designed for operators, analysts, investors, and strategic decision-makers who want to understand market movements before they become obvious. Whether you\'re an individual analyst or part of a growing team, our platform scales with your needs.'
    },
    {
      question: 'Do I need prior financial or technical experience?',
      answer: 'No. Nucigen Labs is designed to be accessible. While our intelligence is institutional-grade, our interface is built for clarity. You don\'t need to be a financial expert to understand the signals we provide.'
    },
    {
      question: 'What types of events does Nucigen Labs monitor?',
      answer: 'We monitor geopolitical events, industrial disruptions, supply chain changes, regulatory decisions, security incidents, and market movements. Our system processes millions of data points to identify high-impact events and their causal chains.'
    },
    {
      question: 'Is Nucigen Labs cloud-hosted or self-hosted?',
      answer: 'Nucigen Labs is a fully managed cloud platform. We handle all infrastructure, data processing, and intelligence generation. You simply access the insights through our dashboard, API, or alerts.'
    },
    {
      question: 'Does Nucigen Labs scale with my needs?',
      answer: 'Yes. Nucigen Labs automatically handles increasing data volumes, event complexity, and user demand. As your team grows, you can upgrade to Pro or Ultimate plans for additional features and support.'
    },
    {
      question: 'Does Nucigen Labs replace my existing tools?',
      answer: 'No. Nucigen Labs complements your existing stack. We don\'t replace Bloomberg, Reuters, or your internal systems. We operate where traditional platforms stop — providing forward-looking causal analysis rather than historical reporting.'
    },
    {
      question: 'Is Nucigen Labs suitable for both small and large teams?',
      answer: 'Yes. Individual operators can use Intelligence to track events and receive alerts. Growing teams benefit from Pro\'s collaboration features. Large organizations can leverage Ultimate\'s enterprise-grade capabilities and custom integrations.'
    }
  ];

  const getPrice = (plan: Plan) => {
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getYearlySavings = (plan: Plan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const yearlyPrice = plan.yearlyPrice;
    return monthlyTotal - yearlyPrice;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light mb-6 leading-[1.1] text-white">
            Simple plans,<br />
            <span className="text-slate-300">built for every team</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-light mb-8 max-w-3xl mx-auto">
            Select the plan that matches your environment — from individual operators to enterprise scale.
          </p>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="relative px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-light transition-colors ${billingPeriod === 'monthly' ? 'text-white' : 'text-slate-500'}`}>
              MONTHLY
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                billingPeriod === 'yearly' ? 'bg-[#E1463E]' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-light transition-colors ${billingPeriod === 'yearly' ? 'text-white' : 'text-slate-500'}`}>
                YEARLY
              </span>
              <span className="text-xs text-[#E1463E] font-light">-25%</span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, idx) => {
              const price = getPrice(plan);
              const isYearly = billingPeriod === 'yearly';
              const savings = isYearly ? getYearlySavings(plan) : 0;

              return (
                <div
                  key={idx}
                  className={`backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border rounded-2xl p-8 relative overflow-hidden transition-all duration-300 ${
                    plan.popular
                      ? 'border-[#E1463E]/40 shadow-lg shadow-[#E1463E]/10'
                      : 'border-white/[0.12] hover:border-white/[0.20]'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-[#E1463E] rounded-bl-2xl rounded-tr-2xl px-4 py-1.5">
                      <span className="text-[10px] text-white font-light tracking-wider uppercase">POPULAR</span>
                </div>
                  )}

                  <div className="mb-8">
                    <h3 className="text-2xl font-light text-white mb-2">{plan.name}</h3>
                    <p className="text-sm text-slate-400 font-light mb-6 leading-relaxed">
                      {plan.tagline}
                    </p>
                    
                    {plan.name !== 'Ultimate' && (
                      <>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-5xl text-white font-light tracking-tight">${price}</span>
                          <span className="text-slate-400 font-light text-lg">/ {billingPeriod === 'monthly' ? 'month' : 'year'}</span>
              </div>

                        {isYearly && savings > 0 && (
                          <p className="text-xs text-slate-500 font-light mb-2">
                            Save ${savings}/year
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-3.5 mb-8 min-h-[300px]">
                    {plan.features.map((feature, featureIdx) => (
                      <div key={featureIdx} className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          <Check size={18} className="text-[#E1463E]" />
                        </div>
                        <p className="text-sm text-slate-300 font-light leading-relaxed">{feature}</p>
                  </div>
                ))}
              </div>

                  <Link
                    to={plan.ctaLink}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-light text-sm tracking-wide transition-all duration-300 ${
                      plan.popular
                        ? 'bg-[#E1463E] hover:bg-[#E1463E]/90 text-white shadow-lg shadow-[#E1463E]/20 hover:shadow-xl hover:shadow-[#E1463E]/30'
                        : 'bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] text-white hover:border-white/[0.20]'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight size={16} />
                  </Link>
                </div>
              );
            })}
              </div>

          {/* Trust Badges */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { label: 'Secure Payment Processing' },
              { label: 'Instant Access After Purchase' },
              { label: 'Cancel Anytime, Hassle-Free' }
            ].map((badge, idx) => (
              <div key={idx} className="text-center">
                <p className="text-xs text-slate-400 font-light">{badge.label}</p>
              </div>
            ))}
                </div>
              </div>
      </section>

      {/* Comparison Table */}
      <section className="relative px-4 sm:px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-white mb-4">
              Compare plans
            </h2>
            <p className="text-base text-slate-400 font-light max-w-2xl mx-auto">
              See what's included in each plan
            </p>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left p-6 text-sm font-light text-slate-400 uppercase tracking-wider">Feature</th>
                    <th className="text-center p-6 text-sm font-light text-white">Intelligence</th>
                    <th className="text-center p-6 text-sm font-light text-white">Pro</th>
                    <th className="text-center p-6 text-sm font-light text-white">Ultimate</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, idx) => (
                    <tr key={idx} className="border-b border-white/[0.05] last:border-0">
                      <td className="p-6 text-sm text-slate-300 font-light">{row.feature}</td>
                      <td className="p-6 text-center text-sm text-slate-400 font-light">{row.intelligence}</td>
                      <td className="p-6 text-center text-sm text-slate-400 font-light">{row.pro}</td>
                      <td className="p-6 text-center text-sm text-slate-400 font-light">{row.ultimate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
                </div>
              </div>
      </section>

      {/* Custom Plan CTA */}
      <section className="relative px-4 sm:px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-12">
            <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
              Need a custom plan?
            </h3>
            <p className="text-base text-slate-400 font-light mb-8 max-w-2xl mx-auto">
              We can tailor limits, features, and infrastructure to match your team's requirements.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.10] hover:border-white/[0.20] text-white rounded-lg font-light text-sm tracking-wide transition-all duration-300"
            >
              Contact Sales
              <ArrowRight size={16} />
            </Link>
                </div>
              </div>
      </section>

      {/* FAQ Section */}
      <section className="relative px-4 sm:px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-light text-white mb-4">
              Got questions?<br />
              <span className="text-slate-300">We've got answers.</span>
            </h2>
            <p className="text-base text-slate-400 font-light">
              Here's everything you need to know before getting started.
            </p>
                </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 rounded-xl"
                  aria-expanded={expandedFaq === idx}
                >
                  <h3 className="text-base sm:text-lg font-light text-white pr-8">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    size={20}
                    className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                      expandedFaq === idx ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    expandedFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6">
                    <p className="text-sm text-slate-400 font-light leading-relaxed">
                      {faq.answer}
                    </p>
                </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-slate-400 font-light mb-4">
              Still have questions?
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm text-[#E1463E] font-light hover:text-[#E1463E]/80 transition-colors"
            >
              Contact us and we'll help you out.
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
