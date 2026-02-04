import { useState, useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Show after user scrolls down 300px
    const handleScroll = () => {
      if (window.scrollY > 300 && !isDismissed) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  // Check localStorage for dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem('sticky-cta-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('sticky-cta-dismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom-5 duration-300 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6 sm:px-0 sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
      <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.06] border border-white/[0.20] rounded-xl px-4 py-3 sm:px-6 sm:py-4 shadow-2xl shadow-black/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-md mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium mb-0.5 sm:mb-1">
            Get early access to market intelligence
          </p>
          <p className="text-xs text-slate-400 font-light">
            Join the early analyst cohort
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/request-access"
            className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm whitespace-nowrap min-h-[44px]"
          >
            Request Access
            <ArrowRight size={16} />
          </Link>
          <button
            onClick={handleDismiss}
            className="p-2.5 sm:p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}


