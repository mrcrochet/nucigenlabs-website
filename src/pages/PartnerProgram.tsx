import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Clock, Mail, Zap, BarChart3, Link2, DollarSign, TrendingUp, Users, Shield, ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import { submitPartnerApplication } from '../lib/supabase';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function PartnerProgram() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    platform: '',
    audienceSize: '',
    contentFocus: '',
    whyInterested: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0); // First FAQ open by default
  const [openStep, setOpenStep] = useState<number | null>(0); // First step open by default
  const { toast, showToast, hideToast } = useToast();

  // Smooth scroll to form
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#apply') {
        const element = document.getElementById('apply');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitPartnerApplication(formData);
      showToast('Application submitted successfully. We\'ll review and contact you soon.', 'success');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        platform: '',
        audienceSize: '',
        contentFocus: '',
        whyInterested: ''
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit application';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pt-24">
      <SEO 
        title="Partner Program — Nucigen Labs"
        description="Join the Nucigen Partner Program. Open to analysts, content creators, and influencers. Earn 20-30% recurring commissions with automated tracking and payouts via Tolt."
        faqItems={[
          {
            question: 'What commission rate do partners earn?',
            answer: 'Partners earn 20-30% recurring commission on every active subscriber they refer. The exact rate depends on your audience size and engagement.'
          },
          {
            question: 'How do I track my referrals?',
            answer: 'Once approved, you\'ll receive access to your Tolt partner dashboard where you can track all referrals, commissions, and performance metrics in real-time. The dashboard shows detailed analytics, conversion rates, and revenue generated from your referrals.'
          },
          {
            question: 'Is there a minimum audience size requirement?',
            answer: 'No, we evaluate partners based on content quality and audience engagement, not just size. If your audience values intelligence and insight, we want to hear from you.'
          },
          {
            question: 'How often are commissions paid?',
            answer: 'Commissions are paid automatically each month via Tolt\'s automated payout system. Payments are processed through PayPal or Wise, typically within 30 days of the end of each month. No manual processing required.'
          },
          {
            question: 'Can I use Nucigen Labs for my own analysis?',
            answer: 'Yes! Approved partners receive full access to Nucigen Labs at no cost, so you can use it for your own research and content creation.'
          }
        ]}
      />

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      {/* Hero Section - Ultra Simple */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-6 py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-light mb-8 text-white leading-tight">
            Become a Nucigen Partner
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
            Help your audience understand global events before markets react.
          </p>

          <a
            href="#apply"
            className="inline-flex items-center gap-2 px-10 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(225,70,62,0.4)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-black"
          >
            Apply to Become a Partner
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* What is Nucigen - Simple */}
      <section className="relative px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-6 text-center">
            What is Nucigen?
          </h2>
          <p className="text-base md:text-lg text-slate-400 font-light leading-relaxed text-center">
            Nucigen Labs is an intelligence platform that transforms geopolitics, industry news, and macro events into structured causal insights and second-order impacts.
          </p>
        </div>
      </section>

      {/* We're Inviting Partners - Simple */}
      <section className="relative px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-6 text-center">
            We're inviting partners
          </h2>
          <p className="text-base md:text-lg text-slate-400 font-light leading-relaxed text-center">
            We're inviting analysts, researchers, students, content creators, and influencers to help distribute a better way of understanding the world.
          </p>
          <p className="text-sm text-slate-500 font-light italic text-center mt-4">
            This is not a mass affiliate program.
          </p>
        </div>
      </section>

      {/* Why Join - Feature Cards */}
      <section className="relative px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4 text-center">
            Why become a Nucigen Partner
          </h2>
          <p className="text-base text-slate-400 font-light text-center mb-12 max-w-2xl mx-auto">
            Everything you need to grow your audience while earning recurring revenue
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: DollarSign,
                title: 'Recurring Commissions',
                description: 'Earn 20-30% recurring commission on every active subscriber you bring',
                highlight: '20-30% commission'
              },
              {
                icon: BarChart3,
                title: 'Real-Time Dashboard',
                description: 'Track all your referrals, conversions, and earnings in real-time through Tolt',
                highlight: 'Real-time tracking'
              },
              {
                icon: Zap,
                title: 'Automatic Payouts',
                description: 'Get paid automatically each month via PayPal or Wise. No manual processing.',
                highlight: 'Auto payouts'
              },
              {
                icon: Link2,
                title: 'Custom Referral Links',
                description: 'Personalized referral links with full tracking and analytics',
                highlight: 'Custom links'
              },
              {
                icon: Users,
                title: 'Curated Network',
                description: 'Join a network of analytical thinkers and thought leaders',
                highlight: 'Exclusive network'
              },
              {
                icon: Shield,
                title: 'Full Platform Access',
                description: 'Use Nucigen Labs for your own research and content creation at no cost',
                highlight: 'Free access'
              }
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-6 hover:border-white/[0.20] hover:shadow-xl hover:shadow-white/[0.05] transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-4">
                    <Icon size={24} className="text-[#E1463E]" />
                  </div>
                  <div className="inline-block mb-2 px-2 py-1 rounded bg-[#E1463E]/10 border border-[#E1463E]/20">
                    <span className="text-xs text-[#E1463E] font-medium">{benefit.highlight}</span>
                  </div>
                  <h3 className="text-lg text-white font-light mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who This Is For - Simple */}
      <section className="relative px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-6 text-center">
            Who this is for
          </h2>
          <p className="text-base text-slate-400 font-light leading-relaxed mb-6 text-center">
            This program is open to anyone who creates content and has an engaged audience, including:
          </p>
          <ul className="space-y-3 text-base text-slate-400 font-light mb-6">
            <li className="text-center">• Financial analysts, macro economists, and researchers</li>
            <li className="text-center">• Content creators and influencers (YouTube, TikTok, Instagram, Twitter)</li>
            <li className="text-center">• Newsletter writers (Substack, Medium, personal blogs)</li>
            <li className="text-center">• Podcasters and thought leaders</li>
            <li className="text-center">• Anyone covering markets, geopolitics, supply chains, or technology</li>
          </ul>
          <p className="text-sm text-slate-500 font-light italic text-center">
            Whether you're a macro analyst or a finance influencer, if your audience values intelligence and insight, this is for you.
          </p>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section className="relative px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              How it works
            </h2>
            <p className="text-base text-slate-400 font-light max-w-2xl mx-auto">
              Get your partner program up and running in minutes
            </p>
          </div>
          <div className="space-y-2">
            {[
              { 
                step: '1', 
                title: 'Apply', 
                description: 'Submit your application. We review each partner individually to ensure quality.',
                icon: Mail
              },
              { 
                step: '2', 
                title: 'Get approved', 
                description: 'Receive access to your Tolt partner dashboard with personal referral links and tracking tools.',
                icon: CheckCircle2
              },
              { 
                step: '3', 
                title: 'Share', 
                description: 'Share Nucigen Labs with your audience through your content using your unique referral links.',
                icon: Link2
              },
              { 
                step: '4', 
                title: 'Track & earn', 
                description: 'Monitor referrals in real-time. Earn 20-30% commission with automatic monthly payouts.',
                icon: TrendingUp
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              const isOpen = openStep === idx;
              return (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden hover:border-white/[0.20] transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenStep(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-black"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-[#E1463E]" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#E1463E]/10 border border-[#E1463E]/20 flex items-center justify-center">
                        <span className="text-[#E1463E] font-bold text-sm">{item.step}</span>
                      </div>
                      <h3 className="text-lg text-white font-light">{item.title}</h3>
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
                    <div className="px-6 pb-4 pl-20">
                      <p className="text-sm text-slate-400 font-light leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tolt Integration Section - Enhanced */}
      <section className="relative px-6 py-20 section-light">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-1 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-sm">
              <span className="text-[10px] text-slate-600 font-light tracking-[0.25em] uppercase">POWERED BY</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              Professional affiliate infrastructure
            </h2>
            <p className="text-base text-slate-400 font-light max-w-2xl mx-auto">
              Our partner program is managed through <span className="text-white font-medium">Tolt</span>, a professional affiliate marketing platform trusted by leading SaaS companies.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-8 hover:border-white/[0.20] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center">
                  <BarChart3 size={20} className="text-[#E1463E]" />
                </div>
                <h3 className="text-xl text-white font-light">Real-Time Dashboard</h3>
              </div>
              <p className="text-sm text-slate-400 font-light leading-relaxed mb-4">
                Track all your referrals, commissions, and performance metrics in real-time. Monitor conversion rates, revenue generated, and detailed analytics.
              </p>
              <div className="flex items-center gap-2 text-sm text-[#E1463E] font-light">
                <span>View dashboard</span>
                <ArrowRight size={16} />
              </div>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-8 hover:border-white/[0.20] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center">
                  <Zap size={20} className="text-[#E1463E]" />
                </div>
                <h3 className="text-xl text-white font-light">Auto Payouts</h3>
              </div>
              <p className="text-sm text-slate-400 font-light leading-relaxed mb-4">
                Automatic monthly payouts via PayPal and Wise. No manual processing required. Get paid reliably every month.
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 font-light">
                <span>PayPal</span>
                <span>•</span>
                <span>Wise</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-8 hover:border-white/[0.20] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center">
                  <Link2 size={20} className="text-[#E1463E]" />
                </div>
                <h3 className="text-xl text-white font-light">Branded Portal</h3>
              </div>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Custom branded partner portal with personalized referral links, marketing materials, and tracking tools.
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-8 hover:border-white/[0.20] transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center">
                  <TrendingUp size={20} className="text-[#E1463E]" />
                </div>
                <h3 className="text-xl text-white font-light">Seamless Integration</h3>
              </div>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Fully integrated with our subscription system. Automatic tracking of conversions and recurring commissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Happens Next Section - Enhanced */}
      <section className="relative px-6 py-20 section-light">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-12 text-center">
            What happens next?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-6 hover:border-white/[0.20] transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-4">
                <Clock size={24} className="text-[#E1463E]" />
              </div>
              <h3 className="text-lg text-white font-light mb-2">Review process</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed mb-3">
                We review applications within 3-5 business days. We'll contact you via email with our decision.
              </p>
              <div className="inline-block px-2 py-1 rounded bg-[#E1463E]/10 border border-[#E1463E]/20">
                <span className="text-xs text-[#E1463E] font-medium">3-5 days</span>
              </div>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-6 hover:border-white/[0.20] transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-4">
                <Mail size={24} className="text-[#E1463E]" />
              </div>
              <h3 className="text-lg text-white font-light mb-2">Onboarding</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed mb-3">
                Receive access to your Tolt partner dashboard, personalized referral links, tracking tools, and marketing materials.
              </p>
              <div className="inline-block px-2 py-1 rounded bg-[#E1463E]/10 border border-[#E1463E]/20">
                <span className="text-xs text-[#E1463E] font-medium">Instant access</span>
              </div>
            </div>
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-6 hover:border-white/[0.20] transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mb-4">
                <CheckCircle2 size={24} className="text-[#E1463E]" />
              </div>
              <h3 className="text-lg text-white font-light mb-2">Start earning</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed mb-3">
                Begin sharing Nucigen Labs with your audience and earn recurring commissions on every active subscriber.
              </p>
              <div className="inline-block px-2 py-1 rounded bg-[#E1463E]/10 border border-[#E1463E]/20">
                <span className="text-xs text-[#E1463E] font-medium">20-30% commission</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Accordion */}
      <section className="relative px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-light text-white mb-8 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {[
              {
                q: 'What commission rate do partners earn?',
                a: 'Partners earn 20-30% recurring commission on every active subscriber they refer. The exact rate depends on your audience size and engagement.'
              },
              {
                q: 'How do I track my referrals?',
                a: 'Once approved, you\'ll receive access to your Tolt partner dashboard where you can track all referrals, commissions, and performance metrics in real-time. The dashboard shows detailed analytics, conversion rates, and revenue generated from your referrals.'
              },
              {
                q: 'Is there a minimum audience size requirement?',
                a: 'No, we evaluate partners based on content quality and audience engagement, not just size. If your audience values intelligence and insight, we want to hear from you.'
              },
              {
                q: 'How often are commissions paid?',
                a: 'Commissions are paid automatically each month via Tolt\'s automated payout system. Payments are processed through PayPal or Wise, typically within 30 days of the end of each month. No manual processing required.'
              },
              {
                q: 'Can I use Nucigen Labs for my own analysis?',
                a: 'Yes! Approved partners receive full access to Nucigen Labs at no cost, so you can use it for your own research and content creation.'
              }
            ].map((faq, idx) => {
              const isOpen = openFAQ === idx;
              return (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl overflow-hidden hover:border-white/[0.20] transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFAQ(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-black rounded-xl"
                    aria-expanded={isOpen}
                  >
                    <h3 className="text-lg text-white font-light pr-4">{faq.q}</h3>
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
                    <div className="px-6 pb-4">
                      <p className="text-sm text-slate-400 font-light leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application Form - Simple & Clean */}
      <section id="apply" className="relative px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4 text-white">
              Become a Nucigen Partner
            </h2>
            <p className="text-base text-slate-400 font-light">
              Apply to join a curated network of intelligence-driven partners.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 transition-all duration-200 text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Name"
              />
            </div>

            <div>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 transition-all duration-200 text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Email"
              />
            </div>

            <div>
              <input
                type="text"
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 transition-all duration-200 text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Platform / Channel (e.g., YouTube, TikTok, Instagram, Substack, Medium, Twitter)"
              />
            </div>

            <div>
              <input
                type="text"
                id="audienceSize"
                value={formData.audienceSize}
                onChange={(e) => setFormData({ ...formData, audienceSize: e.target.value })}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 transition-all duration-200 text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Audience Size (e.g., 5K subscribers, 10K followers)"
              />
            </div>

            <div>
              <input
                type="text"
                id="contentFocus"
                value={formData.contentFocus}
                onChange={(e) => setFormData({ ...formData, contentFocus: e.target.value })}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 transition-all duration-200 text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Content Focus (e.g., Macroeconomics, Geopolitics, Supply Chains)"
              />
            </div>

            <div>
              <textarea
                id="whyInterested"
                value={formData.whyInterested}
                onChange={(e) => setFormData({ ...formData, whyInterested: e.target.value })}
                required
                disabled={isSubmitting}
                rows={4}
                className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 transition-all duration-200 text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                placeholder="Why are you interested in becoming a partner?"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(225,70,62,0.4)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Apply Now'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}
