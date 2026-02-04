import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div 
      className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:top-24 z-[100] animate-in slide-in-from-top-5 fade-in duration-300"
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className={`backdrop-blur-xl border rounded-xl px-4 sm:px-6 py-4 shadow-2xl w-[calc(100vw-2rem)] max-w-md min-w-0 transition-all duration-300 ${
        type === 'success'
          ? 'bg-green-950/40 border-green-500/30'
          : 'bg-red-950/40 border-red-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
            {type === 'success' ? (
              <CheckCircle size={20} className="text-green-400" />
            ) : (
              <XCircle size={20} className="text-red-400" />
            )}
          </div>
          <p className={`flex-1 text-sm font-light leading-relaxed ${
            type === 'success' ? 'text-green-100' : 'text-red-100'
          }`}>
            {message}
          </p>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent rounded"
            aria-label="Close notification"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
