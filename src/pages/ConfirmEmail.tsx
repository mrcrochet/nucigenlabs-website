import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { useSignUp } from '@clerk/clerk-react';
import SEO from '../components/SEO';

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState<string>('');
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']); // 6 digits for Clerk
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Get email from location state
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    } else if (signUp?.emailAddress) {
      setEmail(signUp.emailAddress);
    }

    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, [location, signUp]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    if (!isLoaded || !signUp) {
      return;
    }

    const codeString = codeToVerify || code.join('');
    
    if (codeString.length !== 6 || !/^\d{6}$/.test(codeString)) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: codeString,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setVerified(true);
        setTimeout(() => {
          navigate('/onboarding', { replace: true });
        }, 2000);
      } else {
        setError('Invalid or expired code. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Failed to verify code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !signUp) {
      return;
    }

    setResending(true);
    setError('');

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      // Show success message (you can add a toast here)
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <SEO 
        title="Verify Your Email — Nucigen Labs"
        description="Enter the verification code sent to your email"
      />

      <div className="max-w-md w-full">
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl p-8">
          {verified ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-light text-white mb-4">
                Email verified!
              </h1>
              <p className="text-sm text-slate-400 font-light mb-6">
                Redirecting to onboarding...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                  <Mail className="w-8 h-8 text-[#E1463E]" />
                </div>
                <h1 className="text-2xl font-light text-white mb-2">
                  Enter verification code
                </h1>
                <p className="text-sm text-slate-400 font-light mb-4">
                  We've sent a 6-digit code to
                </p>
                {email && (
                  <p className="text-sm text-white font-medium mb-6">
                    {email}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-[#E1463E]/10 border border-[#E1463E]/20 rounded-lg">
                  <p className="text-sm text-[#E1463E] text-center">{error}</p>
                </div>
              )}

              {/* Code Input Fields */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3 text-center">
                  Verification Code
                </label>
                <div className="flex gap-2 justify-center">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      disabled={verifying || !isLoaded}
                      className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm text-blue-400 font-medium mb-1">
                      Can't find the code?
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• Check your spam folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• Click "Resend Code" to get a new one</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => handleVerify()}
                  disabled={verifying || !isLoaded || code.join('').length !== 6}
                  className="w-full bg-[#E1463E] text-white py-3 rounded-lg font-light hover:bg-[#E1463E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors text-sm font-light"
                  >
                    Back to Login
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={resending || !isLoaded}
                    className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors text-sm font-light flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Resend Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

