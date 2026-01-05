/**
 * ForgotPassword Page
 * 
 * Allows users to request a password reset via Clerk
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';
import PublicRoute from '../components/PublicRoute';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { isLoaded, signIn } = useSignIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!isLoaded) {
      return;
    }

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      // Initiate password reset with Clerk
      const result = await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      if (result.status === 'needs_first_factor') {
        // Email sent successfully
        setSuccess(true);
      } else {
        setError('Unexpected response. Please try again.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicRoute>
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <SEO 
          title="Forgot Password — Nucigen Labs"
          description="Reset your password"
        />

        <div className="max-w-md w-full">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-2xl p-8 shadow-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                <Mail className="w-8 h-8 text-[#E1463E]" />
              </div>
              <h1 className="text-3xl font-light text-white mb-2">
                Reset Password
              </h1>
              <p className="text-sm text-slate-400 font-light">
                Enter your email address and we'll send you a code to reset your password.
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-400 font-medium mb-1">
                      Reset code sent!
                    </p>
                    <p className="text-xs text-slate-400 font-light">
                      Check your email ({email}) for a verification code. Click the link in the email or enter the code to reset your password.
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
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                    Email Address*
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hello@nucigenlabs.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isLoaded}
                  className="w-full bg-[#E1463E] text-white py-3 rounded-lg font-light hover:bg-[#E1463E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
                >
                  Back to Login
                </Link>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
}

