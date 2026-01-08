import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { hasCompletedOnboarding } from '../lib/supabase';
import { X, AlertCircle } from 'lucide-react';

/**
 * OnboardingBanner - Affiche une bannière si l'utilisateur n'a pas complété l'onboarding
 * Visible sur les pages Profile et Settings
 */
export default function OnboardingBanner() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !user?.id) {
        setChecking(false);
        return;
      }

      try {
        const completed = await hasCompletedOnboarding(user.id);
        setShow(!completed);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setShow(false);
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, [isLoaded, user?.id]);

  if (checking || !show) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/20 rounded-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-[#E1463E] flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-white mb-1">
          Profil incomplet
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Complétez votre profil pour bénéficier du scraping personnalisé et d'un contenu adapté à vos intérêts.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="px-4 py-2 bg-[#E1463E] text-white rounded-lg hover:bg-[#E1463E]/90 transition-colors text-sm font-light"
        >
          Compléter mon profil
        </button>
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}


