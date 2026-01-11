import { ReactNode } from 'react';

interface OnboardingGuardProps {
  children: ReactNode;
  redirectTo?: string; // Deprecated: no longer redirects
}

/**
 * OnboardingGuard - NOUVELLE VERSION: Ne bloque plus l'accès
 * L'onboarding est maintenant optionnel. Les utilisateurs peuvent accéder au dashboard
 * et compléter leur profil quand ils le souhaitent via la bannière OnboardingBanner.
 * 
 * Ce composant est maintenant un simple wrapper qui rend les enfants.
 * La logique de vérification et d'affichage de la bannière est dans OnboardingBanner.
 */
export default function OnboardingGuard({ 
  children,
  redirectTo // Ignored - kept for backward compatibility
}: OnboardingGuardProps) {
  // Always allow access - onboarding is now optional
  return <>{children}</>;
}


