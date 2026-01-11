import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { prefersReducedMotion } from '../utils/accessibility';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition component
 * Provides smooth page transitions with fade-in effect
 * Respects user's motion preferences
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const shouldAnimate = !prefersReducedMotion();

  useEffect(() => {
    // Reset visibility on route change
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!shouldAnimate) {
    return <>{children}</>;
  }

  return (
    <div
      className={`transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
}

