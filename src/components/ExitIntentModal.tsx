import { useState, useEffect } from 'react';
import { X, ArrowRight, Mail, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { submitAccessRequest } from '../lib/supabase';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExitIntentModal({ isOpen, onClose }: ExitIntentModalProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const emailLower = email.toLowerCase().trim();
      await submitAccessRequest({
        email: emailLower,
        name: name || undefined,
        source_page: 'exit_intent',
      });

      showToast('Thank you! We\'ll contact you soon.', 'success');
      setTimeout(() => {
        onClose();
        navigate(`/early-access-confirmation?email=${encodeURIComponent(emailLower)}`);
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit request';
      if (message.includes('already been registered') || message.includes('already exists')) {
        showToast('This email is already registered. We\'ll contact you soon!', 'success');
        onClose();
        navigate(`/early-access-confirmation?email=${encodeURIComponent(email.toLowerCase().trim())}`);
      } else {
        showToast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-md backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.06] border border-white/[0.20] rounded-2xl p-8 shadow-2xl shadow-black/50 animate-in fade-in zoom-in duration-300">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center mx-auto mb-4">
              <Zap size={32} className="text-[#E1463E]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-light text-white mb-3">
              Wait! Don't miss out
            </h2>
            <p className="text-base text-slate-400 font-light leading-relaxed mb-2">
              Get early access to market intelligence that predicts movements before they happen.
            </p>
            <p className="text-sm text-[#E1463E] font-medium">
              Limited to 1,200 spots for technical reasons and quality assurance
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 transition-all duration-200 text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full pl-12 pr-4 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-[#E1463E]/50 focus:ring-2 focus:ring-[#E1463E]/20 transition-all duration-200 text-sm font-light disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(225,70,62,0.4)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : 'Get Early Access'}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="text-xs text-slate-500 font-light text-center mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </>
  );
}

