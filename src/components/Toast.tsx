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
    <div className="fixed top-24 right-6 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={`backdrop-blur-xl border rounded-xl px-6 py-4 shadow-2xl min-w-[320px] max-w-md ${
        type === 'success'
          ? 'bg-green-950/40 border-green-500/30'
          : 'bg-red-950/40 border-red-500/30'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
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
            className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
