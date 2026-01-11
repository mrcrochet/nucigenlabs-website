import { useState } from 'react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const toggleItem = (index: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqCategories = [
    {
      title: 'General Questions',
      description: 'Learn more about Nucigen Labs, how the platform operates, and how it helps teams understand market movements.',
      items: [
        {
          question: 'What is Nucigen Labs?',
          answer: 'Nucigen Labs is a strategic intelligence platform that transforms global news into predictive market signals in real-time. We detect geopolitical and industrial events and predict their market impact before prices adjust through causal analysis.'
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
      ] as FAQItem[]
    },
    {
      title: 'Setup & Onboarding',
      description: 'Everything you need to get started with Nucigen Labs and configure your intelligence preferences.',
      items: [
        {
          question: 'How do I get started with Nucigen Labs?',
          answer: 'Sign up for an account, complete the onboarding process to set your preferences (sectors, regions, event types), and start receiving personalized intelligence signals. The setup takes less than 10 minutes.'
        },
        {
          question: 'What information do I need to provide during onboarding?',
          answer: 'During onboarding, we ask for basic profile information (company, sector, intended use) and your intelligence preferences (sectors of interest, regions to monitor, event types). This helps us personalize your feed.'
        },
        {
          question: 'Can I change my preferences after onboarding?',
          answer: 'Yes. You can update your preferences at any time through your Settings page. Changes will immediately affect your personalized intelligence feed.'
        },
        {
          question: 'How do I connect external data sources?',
          answer: 'Nucigen Labs automatically monitors global news sources and events. For Pro and Ultimate plans, you can integrate custom data sources through our API.'
        },
        {
          question: 'Is there a mobile app?',
          answer: 'Currently, Nucigen Labs is optimized for web browsers. Mobile apps are planned for future releases. The web interface is fully responsive and works well on mobile devices.'
        }
      ] as FAQItem[]
    },
    {
      title: 'Intelligence & Features',
      description: 'Understand how Nucigen Labs generates intelligence signals and what features are available.',
      items: [
        {
          question: 'How does Nucigen Labs detect events?',
          answer: 'We use advanced LLM-based systems to scan global news sources in real-time, extract structured events, and identify high-impact occurrences. Our system processes millions of articles daily.'
        },
        {
          question: 'What is causal chain analysis?',
          answer: 'Causal chain analysis maps how events propagate through systems. For example, a factory closure in Taiwan → lithium shortage → battery production impact → EV manufacturing costs. We identify these chains before markets react.'
        },
        {
          question: 'How accurate are the market predictions?',
          answer: 'Our predictions focus on causal relationships and timing windows rather than exact price movements. We identify which assets are likely to be affected and when, based on historical patterns and causal analysis.'
        },
        {
          question: 'Can I customize my intelligence feed?',
          answer: 'Yes. You can set preferences for sectors, regions, event types, and alert frequency. Your feed is personalized based on these preferences to show only relevant intelligence.'
        },
        {
          question: 'How do alerts work?',
          answer: 'You receive alerts via email and in-app notifications when events match your preferences and exceed impact thresholds. You can configure alert frequency and types in Settings.'
        },
        {
          question: 'Can I export intelligence data?',
          answer: 'Yes. Pro and Ultimate plans include API access for exporting data. You can also download reports and event summaries from the dashboard.'
        }
      ] as FAQItem[]
    },
    {
      title: 'Billing & Plans',
      description: 'Find answers about pricing, subscriptions, upgrades, and payment options.',
      items: [
        {
          question: 'Do you offer a free plan?',
          answer: 'Currently, Nucigen Labs operates on a subscription model. We offer early access pricing starting at $59/month for the Intelligence plan. Contact us to discuss enterprise options.'
        },
        {
          question: 'How is usage calculated?',
          answer: 'Subscription plans include unlimited event monitoring and intelligence signals. API usage limits vary by plan (Intelligence: 1,000/month, Pro: 10,000/month, Ultimate: Unlimited).'
        },
        {
          question: 'Can I upgrade or downgrade anytime?',
          answer: 'Yes. You can change your plan at any time. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period.'
        },
        {
          question: 'Do you offer refunds?',
          answer: 'Refunds are handled on a case-by-case basis. Contact support@nucigenlabs.com to discuss your situation. We typically offer refunds within 30 days of subscription for unused portions.'
        },
        {
          question: 'Do you support team billing?',
          answer: 'Yes. Pro and Ultimate plans support team billing with multiple users. Contact sales@nucigenlabs.com for enterprise team pricing and setup.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept major credit cards and process payments securely through Stripe. Enterprise customers can arrange invoicing and wire transfers.'
        }
      ] as FAQItem[]
    }
  ];

  let globalIndex = 0;

  return (
    <main className="min-h-screen">
      <SEO
        title="FAQs — Nucigen Labs"
        description="Frequently Asked Questions about Nucigen Labs. Find clear answers about our platform, features, pricing, and how to get started."
        keywords="FAQ, frequently asked questions, help, support, questions, answers"
      />

      <section className="relative px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <div className="inline-block backdrop-blur-xl bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-full px-4 py-2 mb-6">
              <p className="text-xs text-[#E1463E] font-light tracking-[0.15em] uppercase">FAQs</p>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-slate-400 font-light leading-relaxed">
              Find clear answers about our intelligence platform, pricing, and how to get started.
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-16">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-light text-white mb-3">
                    {category.title}
                  </h2>
                  <p className="text-base text-slate-400 font-light leading-relaxed">
                    {category.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {category.items.map((item, itemIndex) => {
                    const currentIndex = globalIndex++;
                    const isExpanded = expandedItems[currentIndex] || false;

                    return (
                      <div
                        key={itemIndex}
                        className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(currentIndex)}
                          className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 rounded-xl"
                          aria-expanded={isExpanded}
                        >
                          <h3 className="text-base sm:text-lg font-light text-white pr-8">
                            {item.question}
                          </h3>
                          <ChevronDown
                            size={20}
                            className={`text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                              isExpanded ? 'transform rotate-180' : ''
                            }`}
                          />
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ${
                            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="px-6 pb-6">
                            <p className="text-sm text-slate-400 font-light leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-16 text-center">
            <p className="text-base text-slate-400 font-light mb-4">
              Still have questions?
            </p>
            <a
              href="mailto:support@nucigenlabs.com"
              className="inline-flex items-center gap-2 text-sm text-[#E1463E] font-light hover:text-[#E1463E]/80 transition-colors"
            >
              Contact us and we'll help you out.
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

