import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile, getSession } from '../lib/supabase';
import { Building2, Briefcase, Target, TrendingUp } from 'lucide-react';
import SEO from '../components/SEO';

export default function Onboarding() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    sector: '',
    intended_use: '',
    exposure: '',
  });

  // Refresh user on mount to ensure we have the latest session
  useEffect(() => {
    const checkSession = async () => {
      if (!authLoading && !user) {
        // Try to get session directly
        const session = await getSession();
        if (session) {
          // Session exists, refresh user
          await refreshUser();
        } else {
          // No session, redirect to login after a short delay
          setTimeout(() => {
            navigate('/login', { 
              replace: true,
              state: { from: { pathname: '/onboarding' } }
            });
          }, 2000);
        }
      }
    };
    
    checkSession();
  }, [authLoading, user, refreshUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateUserProfile(formData);
      await refreshUser();
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12">
      <SEO 
        title="Complete Your Profile — Nucigen Labs"
        description="Tell us about yourself to get started"
      />

      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-light text-white mb-4">
            Complete your profile
          </h1>
          <p className="text-slate-400 font-light max-w-lg mx-auto">
            This information helps us prioritize relevant signals and tune the platform to your analytical needs.
          </p>
        </div>

        {/* Show loading state while checking auth */}
        {authLoading ? (
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl p-8 text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 font-light">Verifying authentication...</p>
          </div>
        ) : !user ? (
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl p-8 text-center">
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400 mb-2">User not authenticated</p>
              <p className="text-xs text-slate-500 mb-4">Please log in to continue.</p>
              <button
                onClick={() => navigate('/login', { 
                  state: { from: { pathname: '/onboarding' } }
                })}
                className="px-4 py-2 bg-[#E1463E] text-white rounded-lg hover:bg-[#E1463E]/90 transition-colors text-sm font-light"
              >
                Go to Login
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-2">
                <Building2 className="inline w-4 h-4 mr-2" />
                Organization or institution you represent
              </label>
              <input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="BlackRock, Goldman Sachs, MIT, etc."
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none"
              />
              <p className="mt-1.5 text-xs text-slate-500 font-light">
                We use this to understand institutional context and exposure patterns.
              </p>
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                <Briefcase className="inline w-4 h-4 mr-2" />
                Your analytical role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none"
              >
                <option value="">Choose your primary function</option>
                <option value="analyst">Analyst</option>
                <option value="trader">Trader</option>
                <option value="portfolio_manager">Portfolio Manager</option>
                <option value="researcher">Researcher</option>
                <option value="executive">Executive / Decision Maker</option>
                <option value="consultant">Consultant</option>
                <option value="student">Student / Academic</option>
                <option value="other">Other</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-500 font-light">
                This determines which signal types and timeframes we prioritize for you.
              </p>
            </div>

            {/* Sector */}
            <div>
              <label htmlFor="sector" className="block text-sm font-medium text-slate-300 mb-2">
                <Target className="inline w-4 h-4 mr-2" />
                Primary economic domain you follow
              </label>
              <select
                id="sector"
                value={formData.sector}
                onChange={(e) => handleChange('sector', e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none"
              >
                <option value="">Choose your primary domain</option>
                <option value="finance">Finance / Investment</option>
                <option value="commodities">Commodities</option>
                <option value="energy">Energy</option>
                <option value="technology">Technology</option>
                <option value="logistics">Logistics / Supply Chain</option>
                <option value="consulting">Consulting</option>
                <option value="academia">Academia / Research</option>
                <option value="government">Government / Policy</option>
                <option value="other">Other</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-500 font-light">
                We use this to tune signal relevance and exposure mapping for your domain.
              </p>
            </div>

            {/* Intended Use */}
            <div>
              <label htmlFor="intended_use" className="block text-sm font-medium text-slate-300 mb-2">
                <TrendingUp className="inline w-4 h-4 mr-2" />
                What kind of decisions or analyses do you want Nucigen to support?
              </label>
              <textarea
                id="intended_use"
                value={formData.intended_use}
                onChange={(e) => handleChange('intended_use', e.target.value)}
                placeholder="Monitor geopolitical risks affecting energy markets, track semiconductor supply chain disruptions before they impact pricing, identify regulatory changes that could affect commodity flows..."
                required
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none resize-none"
              />
              <p className="mt-1.5 text-xs text-slate-500 font-light">
                This helps us remember what matters to you and prioritize relevant signals in your feed.
              </p>
            </div>

            {/* Exposure (Optional) */}
            <div>
              <label htmlFor="exposure" className="block text-sm font-medium text-slate-300 mb-2">
                Scale of market exposure
                <span className="ml-2 text-xs text-slate-500 font-normal">(optional)</span>
              </label>
              <select
                id="exposure"
                value={formData.exposure}
                onChange={(e) => handleChange('exposure', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none"
              >
                <option value="">Choose if applicable</option>
                <option value="retail">Retail / Individual</option>
                <option value="institutional">Institutional</option>
                <option value="enterprise">Enterprise / Corporate</option>
                <option value="academic">Academic / Research</option>
              </select>
              <p className="mt-1.5 text-xs text-slate-500 font-light">
                Helps us calibrate risk thresholds and signal sensitivity to your operational scale.
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/app')}
              className="flex-1 px-6 py-3 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors font-light"
            >
              I'll complete this later
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#E1463E] text-white rounded-lg hover:bg-[#E1463E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light"
            >
              {loading ? 'Saving...' : 'Save and proceed'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

