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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.06] border border-white/[0.20] rounded-xl px-6 py-4 shadow-2xl shadow-black/50 flex items-center gap-4 max-w-md mx-auto">
        <div className="flex-1">
          <p className="text-sm text-white font-medium mb-1">
            Get early access to market intelligence
          </p>
          <p className="text-xs text-slate-400 font-light">
            Join the early analyst cohort
          </p>
        </div>
        <Link
          to="/request-access"
          className="px-4 py-2 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-medium rounded-lg transition-all duration-200 hover:scale-[1.05] hover:shadow-[0_0_20px_rgba(225,70,62,0.4)] active:scale-[0.95] flex items-center gap-2 text-sm whitespace-nowrap"
        >
          Request Access
          <ArrowRight size={16} />
        </Link>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}


