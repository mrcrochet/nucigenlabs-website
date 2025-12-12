import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { submitAccessRequest } from '../lib/supabase';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

export default function WaitingListSection() {
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
        source_page: 'home-waiting-list',
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
    <section className="relative px-6 py-24">
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.15] rounded-2xl p-12">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-light text-white mb-4">
              Get Early Access
            </h2>
            <p className="text-base text-slate-400 font-light">
              Early users will receive priority access and special pricing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="mb-6">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-white/30 transition-all text-base font-light disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Email address"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full inline-flex items-center justify-center gap-3 px-10 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_35px_rgba(225,70,62,0.4)] text-base tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Submitting...' : 'Join the Waiting List'}
              {!isSubmitting && (
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
