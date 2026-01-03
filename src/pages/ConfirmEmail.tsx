import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>('');
  const [checking, setChecking] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    // Get email from location state or URL
    const stateEmail = location.state?.email;
    if (stateEmail) {
      setEmail(stateEmail);
    }

    // Check if session exists (user confirmed email)
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setConfirmed(true);
          // Wait a moment then redirect
          setTimeout(() => {
            navigate('/onboarding', { replace: true });
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setChecking(false);
      }
    };

    checkSession();

    // Listen for auth state changes (when user confirms email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setConfirmed(true);
        setTimeout(() => {
          navigate('/onboarding', { replace: true });
        }, 2000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <SEO 
        title="Confirm Your Email — Nucigen Labs"
        description="Please confirm your email address"
      />

      <div className="max-w-md w-full">
        <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl p-8 text-center">
          {checking ? (
            <>
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                <Mail className="w-8 h-8 text-[#E1463E]" />
              </div>
              <h1 className="text-2xl font-light text-white mb-4">
                Checking confirmation...
              </h1>
              <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
            </>
          ) : confirmed ? (
            <>
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-light text-white mb-4">
                Email confirmed!
              </h1>
              <p className="text-sm text-slate-400 font-light mb-6">
                Redirecting to onboarding...
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                <Mail className="w-8 h-8 text-[#E1463E]" />
              </div>
              <h1 className="text-2xl font-light text-white mb-4">
                Check your email
              </h1>
              <p className="text-sm text-slate-400 font-light mb-6">
                We've sent a confirmation link to
              </p>
              {email && (
                <p className="text-sm text-white font-medium mb-6">
                  {email}
                </p>
              )}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-sm text-blue-400 font-medium mb-1">
                      What to do next
                    </p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      <li>• Check your inbox (and spam folder)</li>
                      <li>• Click the confirmation link in the email</li>
                      <li>• You'll be automatically redirected here</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="flex-1 px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors text-sm font-light"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => {
                    // Resend confirmation email
                    if (email) {
                      supabase.auth.resend({
                        type: 'signup',
                        email: email,
                      });
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-[#E1463E] text-white rounded-lg hover:bg-[#E1463E]/90 transition-colors text-sm font-light"
                >
                  Resend Email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

