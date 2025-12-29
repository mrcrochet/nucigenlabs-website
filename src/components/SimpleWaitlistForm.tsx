import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, CheckCircle2 } from 'lucide-react';
import { submitAccessRequest } from '../lib/supabase';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import UrgencyBadge from './UrgencyBadge';

interface SimpleWaitlistFormProps {
  variant?: 'inline' | 'modal' | 'section';
  className?: string;
}

export default function SimpleWaitlistForm({ variant = 'inline', className = '' }: SimpleWaitlistFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
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
      const emailLower = email.toLowerCase().trim();
      
      // Save to access_requests table (just store the information)
      await submitAccessRequest({
        email: emailLower,
        name: name || undefined,
        company: name || undefined,
        source_page: 'early_access',
      });

      // Show success message and redirect
      showToast('Thank you! We\'ll contact you soon.', 'success');
      
      // Redirect to confirmation page
      setTimeout(() => {
        navigate(`/early-access-confirmation?email=${encodeURIComponent(emailLower)}`);
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit request';
      console.error('Error in handleSubmit:', error);
      
      if (message.includes('already been registered') || message.includes('already exists')) {
        showToast('This email is already registered. We\'ll contact you soon!', 'success');
        navigate(`/early-access-confirmation?email=${encodeURIComponent(email.toLowerCase().trim())}`);
      } else {
        showToast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <>
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <form onSubmit={handleSubmit} className={variant === 'section' ? 'max-w-xl mx-auto' : ''}>
        {variant === 'section' && (
          <div className="mb-4">
            <label htmlFor="waitlist-name" className="block text-sm text-slate-300 font-light mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              id="waitlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Your name"
              className="w-full px-4 py-3.5 sm:py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 transition-all duration-200 text-base sm:text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            />
          </div>
        )}

          <div className={variant === 'inline' 
          ? 'flex flex-col sm:flex-row gap-3 items-stretch sm:items-center max-w-2xl mx-auto backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-xl p-2' 
          : 'mb-4'}>
          <div className={variant === 'inline' ? 'flex-1 w-full' : 'w-full'}>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-200 pointer-events-none"
              />
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={variant === 'inline' ? "Enter your email" : "your@email.com"}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsEmailValid(validateEmail(e.target.value));
                }}
                onBlur={() => setIsEmailValid(validateEmail(email))}
                disabled={isSubmitting}
                className={`w-full min-h-[44px] ${variant === 'inline' ? `pl-12 ${isEmailValid && email ? 'pr-10' : 'pr-4'} py-3.5 sm:py-4 bg-transparent border-0 text-white placeholder:text-slate-500 focus:outline-none focus:placeholder:text-slate-400 text-base sm:text-sm` : `pl-10 ${isEmailValid && email ? 'pr-10' : 'pr-4'} py-3.5 sm:py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 text-base sm:text-sm`} ${isEmailValid && email ? 'border-green-500/50' : ''} transition-all duration-200 font-light disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Email address"
                required
              />
              {isEmailValid && email && (
                <CheckCircle2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${variant === 'inline' 
              ? 'w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-medium rounded-lg min-h-[44px]' 
              : 'w-full px-6 py-3.5 sm:py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg min-h-[44px]'} transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(225,70,62,0.4)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-black text-sm sm:text-base whitespace-nowrap tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
          >
            {isSubmitting ? 'Submitting...' : variant === 'section' ? 'Get early access to market intelligence' : 'Get early access to market intelligence'}
            {!isSubmitting && <ArrowRight size={18} className="flex-shrink-0" />}
          </button>
        </div>

      </form>
    </>
  );

  if (variant === 'section') {
    return (
      <section className={`relative px-4 sm:px-6 py-16 sm:py-24 ${className}`}>
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-6 sm:p-12">
            <div className="text-center mb-8 sm:mb-10">
              <div className="mb-4 flex justify-center">
                <UrgencyBadge type="spots" />
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-light mb-3 sm:mb-4 px-2">
                Get early access to market intelligence
              </h2>
              <p className="text-sm sm:text-base text-slate-400 font-light mb-3 sm:mb-4 px-2">
                Join the early analyst cohort. Be ahead of the market, not behind it.
              </p>
              <p className="text-xs sm:text-sm text-slate-500 font-light px-2">
                Limited to 1,200 spots for technical reasons and quality assurance. Apply now for priority access.
              </p>
            </div>
            {formContent}
          </div>
        </div>
      </section>
    );
  }

  return <div className={className}>{formContent}</div>;
}

