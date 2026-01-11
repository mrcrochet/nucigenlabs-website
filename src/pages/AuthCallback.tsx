import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { hasCompletedOnboarding } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (!isLoaded) {
        return;
      }

      try {
        if (isSignedIn && user) {
          // Always redirect to dashboard - onboarding is now optional
          // Users can complete it later via the banner
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, isLoaded, isSignedIn, user]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 font-light">Completing sign in...</p>
      </div>
    </div>
  );
}

