import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '../lib/api-base';
import { logger } from '../utils/logger';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/newsletter'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setEmail('');
        toast.success('Merci, vous êtes inscrit.');
      } else if (res.status === 400 && (data.error === 'Already subscribed' || data.error?.toLowerCase?.().includes('already'))) {
        toast.info('Cet email est déjà inscrit.');
      } else {
        toast.error(data.error || 'Une erreur est survenue. Réessayez plus tard.');
      }
    } catch (error) {
      logger.error('Newsletter subscription error:', error);
      toast.error('Une erreur est survenue. Réessayez plus tard.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative px-4 sm:px-6 py-16 sm:py-20 border-t border-white/[0.08] bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Left: Stay in the loop */}
          <div className="md:col-span-4">
            <h3 className="text-2xl sm:text-3xl font-light text-white mb-4">
              Stay in the loop
            </h3>
            <p className="text-sm text-slate-400 font-light mb-6 leading-relaxed">
              Get insights on market intelligence, AI features, and product updates.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address for newsletter
              </label>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.10] rounded-lg text-white placeholder:text-slate-500 font-light text-sm focus:outline-none focus:border-[#E1463E]/50 focus:ring-1 focus:ring-[#E1463E]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={isSubmitting}
                aria-label="Email address for newsletter subscription"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 disabled:bg-[#E1463E]/50 disabled:cursor-not-allowed text-white rounded-lg font-light text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
                aria-label="Submit newsletter subscription"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
                {!isSubmitting && <ArrowRight size={16} aria-hidden="true" />}
              </button>
            </form>
          </div>

          {/* Center: Logo */}
          <div className="md:col-span-4 flex items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 border border-white/[0.15] rounded-full flex items-center justify-center backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01]">
                <span className="text-3xl sm:text-4xl font-light text-white">N</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#E1463E] rounded-full"></div>
            </div>
          </div>

          {/* Right: Navigation Links */}
          <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {/* Product */}
            <div>
              <h4 className="text-sm font-light text-white mb-4 tracking-wider uppercase">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/intelligence-page" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Intelligence
                  </Link>
                </li>
                <li>
                  <Link to="/case-studies" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link to="/papers" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Research
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#changelog" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Changelog
                  </a>
                </li>
                <li>
                  <Link to="/faq" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-light text-white mb-4 tracking-wider uppercase">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/about" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <a href="#blog" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#support" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#sales" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Sales
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-light text-white mb-4 tracking-wider uppercase">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/terms" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <a href="#cookies" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    Cookies
                  </a>
                </li>
                <li>
                  <a href="#404" className="text-sm text-slate-400 hover:text-white font-light transition-colors">
                    404
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="mt-12 pt-8 border-t border-white/[0.05]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-light">
              © 2025 Nucigen Labs. All rights reserved.
            </p>
            <p className="text-xs text-slate-500 font-light">
              Not a trading app. Not a sentiment model. Not a news aggregator.<br className="sm:hidden" />
              <span className="hidden sm:inline"> — </span>A causal intelligence platform.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
