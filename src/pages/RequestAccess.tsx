import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, Building2, Briefcase, Target, FileText, Phone, Mail, Clock, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { submitAccessRequest } from '../lib/supabase';
import { sendEarlyAccessConfirmationEmail } from '../lib/email';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import SimpleWaitlistForm from '../components/SimpleWaitlistForm';
import TypewriterText from '../components/TypewriterText';

export default function RequestAccess() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: '',
    company: '',
    phone: '',
    companyNumber: '',
    exposure: '',
    intended_use: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

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
      showToast('Email is required', 'error');
      return;
    }

    if (!validateEmail(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (!formData.name) {
      showToast('Name is required', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const email = formData.email.toLowerCase().trim();
      
      // Submit to Supabase
      const result = await submitAccessRequest({
        email,
        name: formData.name || undefined,
        role: formData.role || undefined,
        company: formData.company || undefined,
        phone: formData.phone || undefined,
        company_number: formData.companyNumber || undefined,
        exposure: formData.exposure || undefined,
        intended_use: formData.intended_use || undefined,
        source_page: 'request-access',
      });

      // Send confirmation email (non-blocking)
      if (!result?.email_sent) {
        sendEarlyAccessConfirmationEmail({
          to: email,
          name: formData.name || formData.company || undefined,
          role: formData.role || undefined,
          company: formData.company || undefined,
        }).catch(err => {
          console.warn('Email sending failed:', err);
        });
      }

      // Clear form
      setFormData({
        email: '',
        name: '',
        role: '',
        company: '',
        phone: '',
        companyNumber: '',
        exposure: '',
        intended_use: '',
      });
      
      // Navigate to confirmation page
      navigate(`/early-access-confirmation?email=${encodeURIComponent(email)}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit request';
      
      if (message.includes('already been registered')) {
        showToast('This email is already registered. You can update your information or check your status.', 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <SEO
        title="Request Access — Nucigen Labs"
        description="Request professional access to Nucigen Labs. Provide your details for review."
      />

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <section className="relative px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-light mb-4 text-white">
              Request Access
            </h1>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto min-h-[3rem]">
              <TypewriterText
                texts={[
                  'All applications are reviewed manually. Please provide accurate information to expedite the review process.',
                  'When compute availability tightens, Nucigen maps how capacity constraints propagate across AI and cloud ecosystems.',
                  'Political uncertainty does not hit markets directly. It first alters permits, enforcement, financing, and movement.',
                  'Nucigen traces regulatory shifts through industrial and trade systems to surface their downstream effects.'
                ]}
                typingSpeed={70}
                deletingSpeed={25}
                pauseDuration={5000}
                className="text-slate-400"
              />
            </p>
          </div>

          {/* Alternative: Waitlist Option */}
          <div className="mb-8 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-12 h-12 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center flex-shrink-0">
                <Clock size={24} className="text-[#E1463E]" />
              </div>
              <div className="flex-1 w-full">
                <h3 className="text-xl font-light text-white mb-2">Join the Waiting List Instead</h3>
                <p className="text-sm text-slate-400 font-light mb-6 leading-relaxed">
                  If you prefer to wait, you can join our waiting list with just your email address. We'll notify you when access becomes available, and you can complete your application later.
                </p>
                <SimpleWaitlistForm variant="inline" className="max-w-none" />
              </div>
            </div>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.1]"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#0A0A0A] text-xs text-slate-500 font-light">OR</span>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.15] rounded-2xl shadow-2xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2">
                  <Mail size={20} className="text-[#E1463E]" />
                  Personal Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm text-slate-300 font-light mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm text-slate-300 font-light mb-2">
                      Email Address <span className="text-red-400">*</span>
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
                    <label htmlFor="phone" className="block text-sm text-slate-300 font-light mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        placeholder="+1 (555) 123-4567"
                        className="w-full pl-10 pr-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="pt-6 border-t border-white/[0.08]">
                <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2">
                  <Briefcase size={20} className="text-[#E1463E]" />
                  Professional Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="role" className="block text-sm text-slate-300 font-light mb-2">
                      Role / Position
                    </label>
                    <input
                      type="text"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      placeholder="e.g., Fund Manager, Analyst, Researcher, Trader"
                      className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm text-slate-300 font-light mb-2">
                      Company / Institution
                    </label>
                    <div className="relative">
                      <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        disabled={isSubmitting}
                        placeholder="Your organization"
                        className="w-full pl-10 pr-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyNumber" className="block text-sm text-slate-300 font-light mb-2">
                      Company Registration Number / Tax ID
                    </label>
                    <input
                      type="text"
                      id="companyNumber"
                      name="companyNumber"
                      value={formData.companyNumber}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      placeholder="Optional - for institutional verification"
                      className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Usage Information */}
              <div className="pt-6 border-t border-white/[0.08]">
                <h2 className="text-xl font-light text-white mb-6 flex items-center gap-2">
                  <Target size={20} className="text-[#E1463E]" />
                  Usage Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="exposure" className="block text-sm text-slate-300 font-light mb-2">
                      Current Exposure / Sector
                    </label>
                    <input
                      type="text"
                      id="exposure"
                      name="exposure"
                      value={formData.exposure}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      placeholder="e.g., Energy, Defense, Commodities, Technology"
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
                      placeholder="How do you intend to use Nucigen Labs intelligence? Please provide details about your use case, trading strategy, or research needs."
                      rows={5}
                      className="w-full px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-slate-700 focus:outline-none focus:border-white/30 transition-all text-sm font-light disabled:opacity-50 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-white/[0.08]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-8 py-4 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_25px_rgba(225,70,62,0.35)] text-base tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-[#E1463E] focus:ring-offset-2 focus:ring-offset-black"
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Access Request'}
                </button>
                <p className="text-xs text-slate-500 font-light mt-4 text-center">
                  By submitting, you agree to our review process. We typically respond within 2-3 business days.
                </p>
                <p className="text-xs text-slate-600 font-light mt-3 text-center">
                  Don't want to fill this form?{' '}
                  <Link to="/" className="text-[#E1463E] hover:text-[#E1463E]/80 underline underline-offset-4 transition-colors">
                    Join the waiting list instead
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

