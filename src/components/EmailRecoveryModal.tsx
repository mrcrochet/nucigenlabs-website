import { useState, useEffect } from 'react';
import { X, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { checkEmailExists } from '../lib/supabase';

interface EmailRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailFound: (email: string) => void;
}

export default function EmailRecoveryModal({
  isOpen,
  onClose,
  onEmailFound,
}: EmailRecoveryModalProps) {
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'found' | 'not-found' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setEmail('');
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsChecking(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const emailLower = email.toLowerCase().trim();
      const existing = await checkEmailExists(emailLower);

      if (existing) {
        setStatus('found');
        // Call callback after a short delay to show success state
        setTimeout(() => {
          onEmailFound(emailLower);
        }, 1500);
      } else {
        setStatus('not-found');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md backdrop-blur-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <h2 id="recovery-modal-title" className="text-xl font-light text-white tracking-tight">
            Check Your Email
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {status === 'found' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 border border-[#E1463E]/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-[#E1463E]" />
              </div>
              <h3 className="text-lg font-light text-white mb-2">Email Found!</h3>
              <p className="text-sm text-slate-400 font-light">
                Redirecting to your confirmation page...
              </p>
            </div>
          ) : status === 'not-found' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-500/20 to-slate-500/10 border border-slate-500/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-light text-white mb-2">Email Not Found</h3>
              <p className="text-sm text-slate-400 font-light mb-6">
                This email is not registered for early access.
              </p>
              <button
                onClick={() => {
                  setStatus('idle');
                  setEmail('');
                }}
                className="px-6 py-2 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all text-sm"
              >
                Try Another Email
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 font-light mb-6">
                Enter your email address to check if you're already registered for early access.
              </p>

              <form onSubmit={handleCheck} className="space-y-4">
                <div>
                  <label htmlFor="recovery-email" className="block text-sm text-slate-300 font-light mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      type="email"
                      id="recovery-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isChecking}
                      placeholder="your@company.com"
                      className="w-full pl-10 pr-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                      required
                    />
                  </div>
                  {errorMessage && (
                    <p className="mt-2 text-xs text-red-400 font-light">{errorMessage}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isChecking}
                    className="flex-1 px-6 py-3 border border-white/20 hover:border-white/40 hover:bg-white/[0.05] rounded-lg text-white text-sm font-light transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChecking}
                    className="flex-1 px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_25px_rgba(225,70,62,0.35)] text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isChecking ? 'Checking...' : 'Check Email'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

