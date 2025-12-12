import { useState } from 'react';
import CountdownTimer from './CountdownTimer';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { submitAccessRequest } from '../lib/supabase';

export default function Hero() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitAccessRequest({
        email: email.toLowerCase().trim(),
        source_page: 'home',
      });

      showToast('Request submitted successfully. We will review your application.', 'success');
      setEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit request';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light mb-12 leading-[1.1] text-white max-w-5xl mx-auto">
            We transform real events into predictive intelligence
            <span className="block mt-6 text-slate-400">before the market reacts</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto font-light">
            Nucigen Labs captures consequences before they become prices
          </p>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08] rounded-lg p-10 md:p-14 shadow-2xl mb-32 relative max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-radial from-slate-700/5 via-transparent to-transparent rounded-lg pointer-events-none"></div>

          <div className="relative">
            <div className="mb-16 text-center">
              <p className="text-sm text-slate-400 mb-8 font-light tracking-wider">LAUNCH — JANUARY 30, 2026 • 15:00 UTC</p>
              <div className="py-6">
                <CountdownTimer />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mb-10">
              <div className="flex flex-col sm:flex-row gap-4 items-center max-w-2xl mx-auto">
                <input
                  type="email"
                  placeholder="your@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-md text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-base font-light disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-md transition-all duration-150 hover:scale-105 hover:shadow-[0_0_25px_rgba(225,70,62,0.35)] text-base whitespace-nowrap tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Submitting...' : 'Request Access'}
                </button>
              </div>
            </form>

            <div className="text-center">
              <p className="text-sm text-slate-500 font-light">
                Access restricted to professional operators and analysts
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-32">
          <p className="text-xs text-slate-600 mb-16 text-center tracking-[0.3em] font-normal">HOW WE CAPTURE ALPHA</p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-8 text-center">
              <div className="text-4xl mb-6">⚡</div>
              <h3 className="text-xl text-white font-light mb-4">Event</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                A geopolitical treaty, an industrial decision, a resource movement
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.12] rounded-lg p-8 text-center">
              <div className="text-4xl mb-6">🧠</div>
              <h3 className="text-xl text-white font-light mb-4">Analysis</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                Nucigen Labs models cascading consequences across industrial chains
              </p>
            </div>

            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.08] rounded-lg p-8 text-center">
              <div className="text-4xl mb-6">💎</div>
              <h3 className="text-xl text-white font-light mb-4">Alpha</h3>
              <p className="text-sm text-slate-400 font-light leading-relaxed">
                You position before the market prices in the information
              </p>
            </div>
          </div>
        </div>

        <div className="text-center max-w-4xl mx-auto">
          <p className="text-2xl md:text-4xl font-light leading-relaxed text-slate-300">
            When the media reports the event,<br />
            <span className="text-white">we've already captured the consequences</span>
          </p>
        </div>
      </div>
    </section>
  );
}
