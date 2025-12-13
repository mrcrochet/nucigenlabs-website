import { useState } from 'react';
import { X } from 'lucide-react';
import { submitAccessRequest } from '../lib/supabase';

interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  sourcePage?: string;
}

export default function AccessRequestModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  sourcePage = 'unknown',
}: AccessRequestModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    role: '',
    company: '',
    exposure: '',
    intended_use: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      onError('Email is required');
      return;
    }

    if (!validateEmail(formData.email)) {
      onError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitAccessRequest({
        email: formData.email.toLowerCase().trim(),
        role: formData.role || undefined,
        company: formData.company || undefined,
        exposure: formData.exposure || undefined,
        intended_use: formData.intended_use || undefined,
        source_page: sourcePage,
      });

      onSuccess('Request submitted successfully. We will review your application.');
      setFormData({
        email: '',
        role: '',
        company: '',
        exposure: '',
        intended_use: '',
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit request';
      onError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl backdrop-blur-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300">
        <div className="flex items-center justify-between p-8 border-b border-white/[0.08]">
          <div>
            <h2 id="modal-title" className="text-2xl font-light text-white tracking-tight mb-2">Request Clearance</h2>
            <p id="modal-description" className="text-sm text-slate-400 font-light">All applications are reviewed manually.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm text-slate-300 font-light mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="your@company.com"
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm text-slate-300 font-light mb-2">
                Role
              </label>
              <input
                type="text"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="e.g., Fund Manager, Analyst, Researcher"
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm text-slate-300 font-light mb-2">
                Company / Institution
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Your organization"
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="exposure" className="block text-sm text-slate-300 font-light mb-2">
                Current Exposure
              </label>
              <input
                type="text"
                id="exposure"
                name="exposure"
                value={formData.exposure}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="e.g., Energy, Defense, Commodities"
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="intended_use" className="block text-sm text-slate-300 font-light mb-2">
                Intended Use
              </label>
              <textarea
                id="intended_use"
                name="intended_use"
                value={formData.intended_use}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="How do you intend to use Nucigen Labs intelligence?"
                rows={4}
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-white/20 hover:border-white/40 hover:bg-white/[0.05] rounded-lg text-white text-sm font-light transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_25px_rgba(225,70,62,0.35)] text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-[#E1463E] focus:ring-offset-2 focus:ring-offset-black"
              aria-label={isSubmitting ? 'Submitting request...' : 'Submit access request'}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
