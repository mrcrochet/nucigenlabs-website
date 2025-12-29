import { useEffect, useRef } from 'react';

export function useExitIntent(onExitIntent: () => void) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse is moving upward (toward top of screen)
      if (e.clientY <= 0 && !hasTriggered.current) {
        hasTriggered.current = true;
        onExitIntent();
      }
    };

    // Only add listener if user has scrolled down (engaged)
    const handleScroll = () => {
      if (window.scrollY > 500 && !hasTriggered.current) {
        document.addEventListener('mouseleave', handleMouseLeave);
      }
    };

    window.addEventListener('scroll', handleScroll, { once: true });

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [onExitIntent]);
}

