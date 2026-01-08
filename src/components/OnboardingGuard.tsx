import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { hasCompletedOnboarding } from '../lib/supabase';

interface OnboardingGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * OnboardingGuard - Protège les routes en vérifiant que l'utilisateur a complété l'onboarding
 * Redirige automatiquement vers /onboarding si le profil n'est pas complété
 */
export default function OnboardingGuard({ 
  children, 
  redirectTo = '/onboarding' 
}: OnboardingGuardProps) {
  const { user, isLoaded: userLoaded } = useUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!userLoaded) {
        return;
      }

      if (!user?.id) {
        // User not authenticated, let ProtectedRoute handle it
        setChecking(false);
        return;
      }

      try {
        const isCompleted = await hasCompletedOnboarding(user.id);
        setCompleted(isCompleted);
        
        if (!isCompleted) {
          // Redirect to onboarding if not completed
          navigate(redirectTo, { replace: true });
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, allow access but log the issue
        setCompleted(true);
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [userLoaded, user?.id, navigate, redirectTo]);

  // Show loading state while checking
  if (checking || !userLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A] z-50">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Vérification du profil...</p>
        </div>
      </div>
    );
  }

  // If onboarding not completed, don't render children (redirect will happen)
  if (!completed) {
    return null;
  }

  // Onboarding completed, render children
  return <>{children}</>;
}


