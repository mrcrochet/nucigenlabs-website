/**
 * ResetPassword Page
 * 
 * Allows users to reset their password using a code from Clerk
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';
import PublicRoute from '../components/PublicRoute';

export default function ResetPassword() {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Get email from URL params or Clerk session
  const email = searchParams.get('email') || '';

  useEffect(() => {
    // Focus code input on mount
    codeInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoaded) {
      return;
    }

    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // First, prepare the reset with the code
      await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });

      // Then update the password
      const result = await signIn.resetPassword({
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setSuccess(true);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } else {
        setError('Password reset incomplete. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || err.message;
      if (errorMessage?.includes('expired')) {
        setError('This reset code has expired. Please request a new one.');
      } else if (errorMessage?.includes('invalid')) {
        setError('Invalid reset code. Please check and try again.');
      } else {
        setError(errorMessage || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <SEO 
          title="Reset Password — Nucigen Labs"
          description="Enter your reset code and new password"
        />

        <div className="max-w-md w-full">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-2xl p-8 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                <Lock className="w-8 h-8 text-[#E1463E]" />
              </div>
              <h1 className="text-3xl font-light text-white mb-2">
                Reset Password
              </h1>
              <p className="text-sm text-slate-400 font-light">
                Enter the code from your email and choose a new password.
              </p>
              {email && (
                <p className="text-xs text-slate-500 font-light mt-2">
                  {email}
                </p>
              )}
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-400 font-medium mb-1">
                      Password reset successful!
                    </p>
                    <p className="text-xs text-slate-400 font-light">
                      Redirecting to dashboard...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-400 font-light">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            {!success && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-1">
                    Verification Code*
                  </label>
                  <input
                    id="code"
                    ref={codeInputRef}
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none text-center text-2xl tracking-widest"
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1">
                    New Password*
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                    Confirm Password*
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isLoaded}
                  className="w-full bg-[#E1463E] text-white py-3 rounded-lg font-light hover:bg-[#E1463E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <Link
                to="/forgot-password"
                className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Request a new code
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
}

