import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import { submitAccessRequest, createVerificationCode } from '../lib/supabase';
import { sendEarlyAccessConfirmationEmail, sendVerificationCodeEmail } from '../lib/email';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import EmailRecoveryModal from './EmailRecoveryModal';
import EmailVerificationCode from './EmailVerificationCode';

interface SimpleWaitlistFormProps {
  variant?: 'inline' | 'modal' | 'section';
  className?: string;
}

export default function SimpleWaitlistForm({ variant = 'inline', className = '' }: SimpleWaitlistFormProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
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
      
      // Create and send verification code
      const code = await createVerificationCode(emailLower);
      await sendVerificationCodeEmail({
        to: emailLower,
        code,
        name: name || undefined,
      });

      showToast('Verification code sent! Check your email.', 'success');
      setShowVerification(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send verification code';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailVerified = async () => {
    setIsSubmitting(true);

    try {
      const emailLower = email.toLowerCase().trim();
      
      // Submit to Supabase (simple waitlist entry)
      await submitAccessRequest({
        email: emailLower,
        name: name || undefined,
        company: name || undefined,
        source_page: 'waitlist',
      });

      // Send confirmation email (non-blocking)
      sendEarlyAccessConfirmationEmail({
        to: emailLower,
        name: name || undefined,
      }).catch(err => {
        console.warn('Email sending failed:', err);
      });

      // Redirect to confirmation page
      navigate(`/early-access-confirmation?email=${encodeURIComponent(emailLower)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join waitlist';
      
      if (message.includes('already been registered')) {
        showToast('This email is already registered. Use "Check your email" below.', 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show verification code input if verification is needed
  if (showVerification) {
    return (
      <div className={className}>
        {toast.isVisible && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
        <div className={variant === 'section' ? 'max-w-xl mx-auto' : ''}>
          <EmailVerificationCode
            email={email}
            name={name}
            onVerified={handleEmailVerified}
            onResend={async () => {
              try {
                const code = await createVerificationCode(email.toLowerCase().trim());
                await sendVerificationCodeEmail({
                  to: email.toLowerCase().trim(),
                  code,
                  name: name || undefined,
                });
              } catch (error) {
                console.error('Failed to resend code:', error);
              }
            }}
          />
        </div>
      </div>
    );
  }

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
        {(variant === 'section' || variant === 'inline') && (
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
              className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
            />
          </div>
        )}

        <div className={variant === 'inline' ? 'flex flex-col sm:flex-row gap-4 items-center' : 'mb-4'}>
          <div className={variant === 'inline' ? 'flex-1 w-full' : 'w-full'}>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className={`w-full ${variant === 'inline' ? 'pl-10 pr-4' : 'px-4'} py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Email address"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${variant === 'inline' ? 'w-full sm:w-auto px-10' : 'w-full px-6'} py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_25px_rgba(225,70,62,0.35)] text-sm whitespace-nowrap tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2`}
          >
            {isSubmitting ? 'Joining...' : variant === 'section' ? 'Join Waitlist' : 'Join Waitlist'}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </div>

        {variant !== 'inline' && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowRecoveryModal(true)}
              className="text-xs text-slate-500 hover:text-slate-300 font-light transition-colors underline underline-offset-4"
            >
              Already registered? Check your email
            </button>
          </div>
        )}
      </form>

      <EmailRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        onEmailFound={(email) => {
          navigate(`/early-access-confirmation?email=${encodeURIComponent(email)}`);
        }}
      />
    </>
  );

  if (variant === 'section') {
    return (
      <section className={`relative px-6 py-24 ${className}`}>
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-2xl p-12">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-light mb-4">
                Join the Waitlist
              </h2>
              <p className="text-base text-slate-400 font-light">
                Be among the first to access Nucigen Labs when we launch.
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

