import { useState } from 'react';
import { FileText, Lock, X } from 'lucide-react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { submitAccessRequest } from '../lib/supabase';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import TypewriterText from '../components/TypewriterText';

import { Link } from 'react-router-dom';

export default function Papers() {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    company: '',
    researchInterests: '',
    intendedUse: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const researchCategories = [
    {
      title: 'Causal Modeling',
      items: ['Causal Discovery & Graphs', 'Bayesian Networks', 'Event → Industry → Supply → Market', 'Nonlinear propagation']
    },
    {
      title: 'Geopolitical Systems',
      items: ['Statecraft', 'Mining & Extraction', 'Energy Futures', 'Sanctions', 'Defense alliances']
    },
    {
      title: 'Industrial Chain Intelligence',
      items: ['Industrial Propagation', 'Economic Resilience', 'Supply Chain Mapping', 'Bottleneck detection']
    },
    {
      title: 'Supply Corridor Dynamics',
      items: ['Trade', 'Logistics', 'Infrastructure', 'Maritime Transport', 'Ports & Pipelines']
    },
    {
      title: 'Alpha Window Theory',
      items: ['Company Embedded Value', 'Market Structure', 'DRG & Alpha Propagation', 'Quantitative Forecasting']
    }
  ];

  const publicPapers = [
    {
      id: 'alpha-windows',
      title: 'Alpha Windows In Strategic Commodities',
      subtitle: 'Latent windows geopolitical shock and industrial reasoning.',
      abstract: 'This paper models the temporal gap between upstream geopolitical events, energy and transport markets.',
      tags: ['Energy Markets', 'Mining', 'Geopolitics', 'Macroeconomics']
    },
    {
      id: 'causal-graphs',
      title: 'Causal Graphs for Supply Chain Disruption',
      subtitle: 'Graph-based modeling of shock propagation.',
      abstract: 'Graph-based modeling on shock propagation across multi-tier industrial supply chains.',
      tags: ['Causal Graphs', 'Logistics', 'AI Modeling']
    },
    {
      id: 'political-volatility',
      title: 'The Political Origin of Market Volatility',
      subtitle: 'Markets do not move randomly. This paper identifies political causation as the primary driver of structural volatility.',
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
    'Pattern classification',
    'Industrial impact mapping',
    'Supply chain propagation',
    'Asset exposure scoring',
    'Alpha window detection'
  ];

  const handleApplicationClick = (paperId: string) => {
    setSelectedPaper(paperId);
    setShowApplicationForm(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      showToast('Name and email are required', 'error');
      return;
    }

    if (!validateEmail(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitAccessRequest({
        email: formData.email.toLowerCase().trim(),
        role: formData.role || undefined,
        company: formData.company || undefined,
        intended_use: `Research access request for: ${selectedPaper || 'general papers'}. Interests: ${formData.researchInterests || 'N/A'}. Intended use: ${formData.intendedUse || 'N/A'}`,
        source_page: 'papers',
      });

      showToast('Application submitted successfully. We will review your request and contact you soon.', 'success');
      setFormData({
        name: '',
        email: '',
        role: '',
        company: '',
        researchInterests: '',
        intendedUse: '',
      });
      setShowApplicationForm(false);
      setSelectedPaper(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit application';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <SEO
        title="Research Papers — Nucigen Labs"
        description="Original research papers on causal modeling, geopolitical analysis, and market intelligence. Access cutting-edge research on how events propagate through markets."
        keywords="market intelligence research, causal modeling papers, geopolitical analysis research, predictive analytics research, strategic intelligence papers"
        type="article"
      />

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <section className="relative min-h-screen px-6 py-32">
        <div className="max-w-6xl mx-auto w-full">
          {/* Hero Section */}
          <div className="text-center mb-24 max-w-5xl mx-auto">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-12 leading-[1.1] text-white">
              The causal layer beneath the markets.
            </h1>

            <p className="text-lg md:text-xl text-slate-400 leading-relaxed font-light mb-12 min-h-[3rem]">
              <TypewriterText
                texts={[
                  'Nucigen Labs publishes original research on geopolitical causality, industrial propagation, and systemic sequences.',
                  'The causal layer beneath the markets. Original research on geopolitical causality, industrial propagation, and systemic market consequences.',
                  'When consumer demand shifts abruptly, Nucigen Labs models the causal chain from demand signals to inventory pressure before it becomes visible in earnings.',
                  'Nucigen Labs does not forecast outcomes. It maps how decisions and disruptions propagate through real systems.'
                ]}
                typingSpeed={70}
                deletingSpeed={25}
                pauseDuration={5000}
                className="text-slate-400"
              />
            </p>

            <Link
              to="/request-access"
              className="inline-block px-8 py-3.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/20 hover:border-white/30 text-white font-light rounded-md transition-all duration-300 text-sm tracking-wide"
            >
              Request Access
            </Link>
          </div>

          {/* Research Categories */}
          <div className="mb-32">
            <p className="text-xs text-slate-600 mb-12 text-center tracking-[0.3em] font-normal uppercase">Research Categories</p>

            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
              {researchCategories.map((category, idx) => (
                <div key={idx} className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-lg p-6 hover:border-white/[0.12] transition-all">
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

          {/* Featured Papers */}
          <div className="mb-32">
            <p className="text-xs text-slate-600 mb-12 text-center tracking-[0.3em] font-normal uppercase">Featured Papers</p>

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

                  <button
                    onClick={() => handleApplicationClick(paper.id)}
                    className="px-6 py-3 bg-[#E1463E]/10 hover:bg-[#E1463E]/20 border border-[#E1463E]/20 hover:border-[#E1463E]/30 text-[#E1463E] text-sm font-light rounded-md transition-all"
                  >
                    Apply for Access
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Application Form Modal */}
          {showApplicationForm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => {
                  setShowApplicationForm(false);
                  setSelectedPaper(null);
                }}
              />

              <div className="relative w-full max-w-2xl backdrop-blur-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                <div className="flex items-center justify-between p-8 border-b border-white/[0.08]">
                  <div>
                    <h2 className="text-2xl font-light text-white tracking-tight mb-2">Research Access Application</h2>
                    <p className="text-sm text-slate-400 font-light">
                      Submit your application to access research papers. All applications are reviewed manually.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowApplicationForm(false);
                      setSelectedPaper(null);
                    }}
                    className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-lg"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="p-8">
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm text-slate-300 font-light mb-2">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm text-slate-300 font-light mb-2">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        placeholder="your@company.com"
                        className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm text-slate-300 font-light mb-2">
                        Role / Position
                      </label>
                      <input
                        type="text"
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        placeholder="e.g., Researcher, Analyst, Fund Manager"
                        className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm text-slate-300 font-light mb-2">
                        Institution / Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        placeholder="Your organization"
                        className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="researchInterests" className="block text-sm text-slate-300 font-light mb-2">
                        Research Interests
                      </label>
                      <textarea
                        id="researchInterests"
                        name="researchInterests"
                        value={formData.researchInterests}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        placeholder="What areas of research are you most interested in? (e.g., Geopolitical Systems, Causal Modeling, Supply Chain Dynamics)"
                        rows={3}
                        className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50 resize-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="intendedUse" className="block text-sm text-slate-300 font-light mb-2">
                        Intended Use
                      </label>
                      <textarea
                        id="intendedUse"
                        name="intendedUse"
                        value={formData.intendedUse}
                        onChange={handleFormChange}
                        disabled={isSubmitting}
                        placeholder="How do you plan to use this research? (e.g., Academic research, Investment analysis, Strategic planning)"
                        rows={3}
                        className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => {
                        setShowApplicationForm(false);
                        setSelectedPaper(null);
                      }}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 border border-white/20 hover:border-white/40 hover:bg-white/[0.05] rounded-lg text-white text-sm font-light transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_25px_rgba(225,70,62,0.35)] text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Restricted Research */}
          <div className="mb-32 max-w-4xl mx-auto">
            <p className="text-xs text-slate-600 mb-12 text-center tracking-[0.3em] font-normal uppercase">Restricted Research</p>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.08] rounded-lg p-12 relative overflow-hidden">
              {/* Blurred Content Behind */}
              <div className="absolute inset-0 p-8 z-0">
                <div className="space-y-4">
                  {restrictedPapers.map((paper, idx) => (
                    <div key={idx} className="p-4 bg-white/[0.05] border border-white/[0.08] rounded-md blur-sm select-none pointer-events-none">
                      <p className="text-sm text-slate-300 font-light">{paper}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overlay Content */}
              <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px]">
                <Lock size={40} className="text-slate-400 mb-6" />
                <h3 className="text-xl text-white font-light mb-3">Restricted Research</h3>
                <p className="text-sm text-slate-400 font-light mb-8 text-center max-w-md">
                  These reports require research accounts. Not accessible to retail users.
                </p>
                <Link
                  to="/request-access"
                  className="inline-block px-6 py-3 bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 hover:border-white/30 text-white font-light rounded-md transition-all text-sm tracking-wide"
                >
                  Request Access
                </Link>
              </div>
            </div>
          </div>

          {/* Scientific Pipeline */}
          <div className="mb-32 max-w-4xl mx-auto">
            <p className="text-xs text-slate-600 mb-12 text-center tracking-[0.3em] font-normal uppercase">The Nucigen Labs Research Method</p>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-lg p-10">
              <h3 className="text-2xl text-white font-light mb-10 text-center">Scientific Pipeline</h3>

              <div className="space-y-6 mb-10">
                {researchPipeline.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-light">{idx + 1}</span>
                    </div>
                    <p className="text-base text-slate-300 font-light">{step}</p>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/[0.08]">
                <p className="text-lg text-white font-light text-center">
                  Price is an output. Causality is the input.
                </p>
              </div>
            </div>
          </div>

          {/* What Makes Nucigen Different */}
          <div className="mb-32 max-w-4xl mx-auto">
            <p className="text-xs text-slate-600 mb-12 text-center tracking-[0.3em] font-normal uppercase">What Makes Nucigen Labs Research Different</p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Traditional Finance Research */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-8">
                <h3 className="text-lg text-slate-400 font-light mb-6">Traditional Finance Research</h3>
                <ul className="space-y-3">
                  {['Price-based', 'Heuristic correlation', 'Signal processing', 'Reactive'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-slate-500 font-light">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Nucigen Labs */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.12] rounded-lg p-8">
                <h3 className="text-lg text-white font-light mb-6">Nucigen Labs</h3>
                <ul className="space-y-3">
                  {['Event-based', 'Causal modeling', 'Structured finance', 'Predictive'].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E1463E] mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-slate-300 font-light">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-lg text-white font-light text-center">
              We don't analyze markets. We analyze reality.
            </p>
          </div>

          {/* Who These Papers Are For */}
          <div className="mb-32 max-w-4xl mx-auto">
            <p className="text-xs text-slate-600 mb-12 text-center tracking-[0.3em] font-normal uppercase">Who These Papers Are For</p>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-lg p-10">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  {['Strategic analysts', 'Energy & trading desks', 'Infrastructure operators'].map((audience, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                      <p className="text-base text-slate-300 font-light">{audience}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {['Hedge funds', 'Sovereign wealth funds', 'Defense-linked industries'].map((audience, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                      <p className="text-base text-slate-300 font-light">{audience}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-base text-slate-400 font-light text-center italic">
                If your decisions affect supply chains, these papers are for you.
              </p>
            </div>
          </div>

          {/* Closing Statement */}
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
