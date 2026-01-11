import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { hasCompletedOnboarding } from '../lib/supabase';
import { X, Sparkles, ArrowRight } from 'lucide-react';

/**
 * OnboardingBanner - Bannière encourageante pour compléter l'onboarding
 * Affiche une bannière visible si l'utilisateur n'a pas complété son profil
 * L'onboarding est maintenant optionnel mais recommandé pour un feed personnalisé
 */
export default function OnboardingBanner() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!isLoaded || !user?.id) {
        setChecking(false);
        return;
      }

      // Check if user has dismissed the banner in this session
      const dismissedKey = `onboarding-banner-dismissed-${user.id}`;
      const wasDismissed = sessionStorage.getItem(dismissedKey) === 'true';
      
      if (wasDismissed) {
        setDismissed(true);
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

  const handleDismiss = () => {
    if (user?.id) {
      const dismissedKey = `onboarding-banner-dismissed-${user.id}`;
      sessionStorage.setItem(dismissedKey, 'true');
    }
    setDismissed(true);
    setShow(false);
  };

  if (checking || !show || dismissed) {
    return null;
  }

  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-[#E1463E]/15 via-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/30 rounded-xl backdrop-blur-sm relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E1463E]/5 to-transparent pointer-events-none" />
      
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E1463E]/20 to-[#E1463E]/10 flex items-center justify-center border border-[#E1463E]/30">
            <Sparkles className="w-6 h-6 text-[#E1463E]" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-light text-white mb-2 flex items-center gap-2">
            Personnalisez votre feed
          </h3>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            Complétez votre profil pour activer le scraping personnalisé. Vos réponses serviront à générer des prompts personnalisés qui alimenteront votre feed avec du contenu adapté à vos secteurs, régions et intérêts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg transition-all duration-300 text-sm font-light flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#E1463E]/20 focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
            >
              Compléter mon profil
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white rounded-lg transition-all duration-300 text-sm font-light focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Plus tard
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white transition-colors flex-shrink-0 p-1 rounded hover:bg-white/5"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}


