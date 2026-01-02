import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, hasCompletedOnboarding } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          navigate('/login?error=auth_failed');
          return;
        }

        if (session) {
          await refreshUser();
          
          // Check if user has completed onboarding
          const completed = await hasCompletedOnboarding();
          
          if (completed) {
            navigate('/app', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/login?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 font-light">Completing sign in...</p>
      </div>
    </div>
  );
}

