import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InstitutionalAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function InstitutionalAccessModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: InstitutionalAccessModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    sector: '',
    country: '',
    capital_size: '',
    timeline: '',
    interests: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    if (!formData.name || !formData.email) {
      onError('Name and email are required');
      return;
    }

    if (!validateEmail(formData.email)) {
      onError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('institutional_requests')
        .insert([{
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          role: formData.role || null,
          sector: formData.sector || null,
          country: formData.country || null,
          capital_size: formData.capital_size || null,
          timeline: formData.timeline || null,
          interests: formData.interests || null,
          status: 'pending',
        }])
        .select()
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This email has already been submitted');
        }
        throw new Error(error.message || 'Failed to submit request');
      }

      onSuccess('Request submitted. You will be contacted if shortlisted.');
      setFormData({
        name: '',
        email: '',
        role: '',
        sector: '',
        country: '',
        capital_size: '',
        timeline: '',
        interests: '',
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl backdrop-blur-2xl bg-gradient-to-br from-slate-900/90 to-black/90 border border-white/[0.15] rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300">
        <div className="flex items-center justify-between p-8 border-b border-white/[0.08]">
          <div>
            <h2 className="text-2xl font-light text-white tracking-tight mb-2">Request Institutional Access</h2>
            <p className="text-sm text-slate-400 font-light">You will be contacted if shortlisted.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/[0.05] rounded-lg"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm text-slate-300 font-light mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                required
              />
            </div>

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
                placeholder="your@institution.com"
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
                placeholder="e.g., CIO, Strategy Director"
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="sector" className="block text-sm text-slate-300 font-light mb-2">
                Sector
              </label>
              <select
                id="sector"
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
              >
                <option value="">Select sector</option>
                <option value="fund">Fund / Asset Management</option>
                <option value="vc">Venture Capital</option>
                <option value="mining">Mining / Extraction</option>
                <option value="energy">Energy</option>
                <option value="defense">Defense</option>
                <option value="government">Government</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm text-slate-300 font-light mb-2">
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Operating country"
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="capital_size" className="block text-sm text-slate-300 font-light mb-2">
                Capital Size
              </label>
              <select
                id="capital_size"
                name="capital_size"
                value={formData.capital_size}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
              >
                <option value="">Select range</option>
                <option value="<50M">&lt; $50M</option>
                <option value="50M-200M">$50M - $200M</option>
                <option value="200M-1B">$200M - $1B</option>
                <option value="1B-10B">$1B - $10B</option>
                <option value=">10B">&gt; $10B</option>
              </select>
            </div>

            <div className="col-span-2">
              <label htmlFor="timeline" className="block text-sm text-slate-300 font-light mb-2">
                Timeline
              </label>
              <input
                type="text"
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Expected deployment timeline"
                className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="interests" className="block text-sm text-slate-300 font-light mb-2">
                Areas of Interest
              </label>
              <textarea
                id="interests"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Geopolitical vectors, supply chains, specific sectors..."
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
              className="flex-1 px-6 py-3 border border-white/20 hover:border-white/40 hover:bg-white/[0.05] rounded-lg text-white text-sm font-light transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 text-white font-light rounded-lg transition-all duration-150 text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>

          <p className="text-xs text-slate-500 font-light text-center mt-6 italic">
            Next review: April 2026
          </p>
        </form>
      </div>
    </div>
  );
}
