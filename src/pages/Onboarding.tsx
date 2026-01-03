import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { updateUserProfile, getSession, updateUserPreferences } from '../lib/supabase';
import { Building2, Briefcase, Target, TrendingUp, Zap, X } from 'lucide-react';
import SEO from '../components/SEO';
import MultiSelect from '../components/ui/MultiSelect';

// Available options for multi-select
const SECTOR_OPTIONS = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Finance', label: 'Finance / Investment' },
  { value: 'Commodities', label: 'Commodities' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Logistics', label: 'Logistics / Supply Chain' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Telecommunications', label: 'Telecommunications' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Academia', label: 'Academia / Research' },
  { value: 'Government', label: 'Government / Policy' },
];

const REGION_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'EU', label: 'European Union' },
  { value: 'UK', label: 'United Kingdom' },
  { value: 'China', label: 'China' },
  { value: 'Japan', label: 'Japan' },
  { value: 'India', label: 'India' },
  { value: 'Middle East', label: 'Middle East' },
  { value: 'Asia Pacific', label: 'Asia Pacific' },
  { value: 'Latin America', label: 'Latin America' },
  { value: 'Africa', label: 'Africa' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Other', label: 'Other' },
];

const EVENT_TYPE_OPTIONS = [
  { value: 'Geopolitical', label: 'Geopolitical' },
  { value: 'Industrial', label: 'Industrial' },
  { value: 'SupplyChain', label: 'Supply Chain' },
  { value: 'Regulatory', label: 'Regulatory' },
  { value: 'Security', label: 'Security' },
  { value: 'Market', label: 'Market' },
];

const TIME_HORIZON_OPTIONS = [
  { value: 'hours', label: 'Hours (immediate impact)' },
  { value: 'days', label: 'Days (short-term)' },
  { value: 'weeks', label: 'Weeks (medium-term)' },
];

export default function Onboarding() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Basic profile data
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    sector: '', // Keep for backward compatibility
    intended_use: '',
    exposure: '',
  });

  // Preferences data (Phase 5)
  const [preferences, setPreferences] = useState({
    preferred_sectors: [] as string[],
    preferred_regions: [] as string[],
    preferred_event_types: [] as string[],
    focus_areas: [] as string[],
    feed_priority: 'balanced' as 'relevance' | 'recency' | 'impact' | 'balanced',
    min_impact_score: 0.3,
    min_confidence_score: 0.5,
    preferred_time_horizons: [] as string[],
  });

  const [focusAreaInput, setFocusAreaInput] = useState('');

  // Refresh user on mount to ensure we have the latest session
  useEffect(() => {
    const checkSession = async () => {
      if (!authLoading && !user) {
        const session = await getSession();
        if (session) {
          await refreshUser();
        } else {
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFocusAreaAdd = () => {
    if (focusAreaInput.trim() && !preferences.focus_areas.includes(focusAreaInput.trim())) {
      setPreferences((prev: typeof preferences) => ({
        ...prev,
        focus_areas: [...prev.focus_areas, focusAreaInput.trim()],
      }));
      setFocusAreaInput('');
    }
  };

  const handleFocusAreaRemove = (area: string) => {
    setPreferences((prev: typeof preferences) => ({
      ...prev,
      focus_areas: prev.focus_areas.filter((a: string) => a !== area),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Update basic profile (backward compatibility)
      await updateUserProfile({
        ...formData,
        // Use first selected sector for backward compatibility
        sector: preferences.preferred_sectors[0] || formData.sector,
      });

      // Step 2: Save preferences (Phase 5)
      await updateUserPreferences({
        preferred_sectors: preferences.preferred_sectors,
        preferred_regions: preferences.preferred_regions,
        preferred_event_types: preferences.preferred_event_types,
        focus_areas: preferences.focus_areas,
        feed_priority: preferences.feed_priority,
        min_impact_score: preferences.min_impact_score,
        min_confidence_score: preferences.min_confidence_score,
        preferred_time_horizons: preferences.preferred_time_horizons,
      });

      await refreshUser();
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
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
          <p className="text-slate-400 font-light max-w-lg mx-auto mb-4">
            This information helps us prioritize relevant signals and tune the platform to your analytical needs.
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all ${
                  step <= currentStep
                    ? 'bg-[#E1463E] w-8'
                    : 'bg-white/10 w-1.5'
                }`}
              />
            ))}
          </div>
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

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-light text-white mb-2">Basic Information</h2>
                <p className="text-sm text-slate-400 font-light">Tell us about yourself and your organization.</p>
              </div>

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
          )}

          {/* Step 2: Interests & Focus Areas */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-light text-white mb-2">Your Interests</h2>
                <p className="text-sm text-slate-400 font-light">Select what matters most to you. We'll prioritize these in your feed.</p>
              </div>

              {/* Preferred Sectors */}
              <div>
                <MultiSelect
                  options={SECTOR_OPTIONS}
                  selected={preferences.preferred_sectors}
                  onChange={(selected) => setPreferences((prev: typeof preferences) => ({ ...prev, preferred_sectors: selected }))}
                  label="Economic sectors you follow"
                  placeholder="Select sectors (e.g., Technology, Energy, Finance)..."
                  helperText="Select all sectors relevant to your work. This helps us surface the most relevant events."
                />
              </div>

              {/* Preferred Regions */}
              <div>
                <MultiSelect
                  options={REGION_OPTIONS}
                  selected={preferences.preferred_regions}
                  onChange={(selected) => setPreferences((prev: typeof preferences) => ({ ...prev, preferred_regions: selected }))}
                  label="Geographic regions you monitor"
                  placeholder="Select regions (e.g., US, EU, China)..."
                  helperText="Select all regions where you track developments. Events from these regions will be prioritized."
                />
              </div>

              {/* Preferred Event Types */}
              <div>
                <MultiSelect
                  options={EVENT_TYPE_OPTIONS}
                  selected={preferences.preferred_event_types}
                  onChange={(selected) => setPreferences((prev: typeof preferences) => ({ ...prev, preferred_event_types: selected }))}
                  label="Types of events you care about"
                  placeholder="Select event types (e.g., Geopolitical, Supply Chain)..."
                  helperText="Choose the types of events most relevant to your analysis."
                />
              </div>

              {/* Focus Areas */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Target className="inline w-4 h-4 mr-2" />
                  Specific focus areas
                  <span className="ml-2 text-xs text-slate-500 font-normal">(optional)</span>
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={focusAreaInput}
                      onChange={(e) => setFocusAreaInput(e.target.value)}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFocusAreaAdd();
                        }
                      }}
                      placeholder="e.g., semiconductor supply chains, energy geopolitics..."
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleFocusAreaAdd}
                      className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15 transition-colors text-sm font-light"
                    >
                      Add
                    </button>
                  </div>
                  {preferences.focus_areas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {preferences.focus_areas.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-md text-sm text-white"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => handleFocusAreaRemove(area)}
                            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-slate-500 font-light">
                  Add specific topics or themes you want to track closely. These will boost relevance scores for matching events.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Feed Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-light text-white mb-2">Feed Preferences</h2>
                <p className="text-sm text-slate-400 font-light">Customize how events are prioritized in your feed.</p>
              </div>

              {/* Feed Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Zap className="inline w-4 h-4 mr-2" />
                  How should we prioritize events?
                </label>
                <select
                  value={preferences.feed_priority}
                    onChange={(e) => setPreferences((prev: typeof preferences) => ({ ...prev, feed_priority: e.target.value as 'relevance' | 'recency' | 'impact' | 'balanced' }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#E1463E] focus:border-[#E1463E] outline-none"
                >
                  <option value="balanced">Balanced (relevance + recency + impact)</option>
                  <option value="relevance">Relevance (match your interests)</option>
                  <option value="recency">Recency (newest first)</option>
                  <option value="impact">Impact (highest impact first)</option>
                </select>
                <p className="mt-1.5 text-xs text-slate-500 font-light">
                  Choose how events are sorted in your intelligence feed.
                </p>
              </div>

              {/* Time Horizons */}
              <div>
                <MultiSelect
                  options={TIME_HORIZON_OPTIONS}
                  selected={preferences.preferred_time_horizons}
                  onChange={(selected) => setPreferences((prev: typeof preferences) => ({ ...prev, preferred_time_horizons: selected }))}
                  label="Time horizons you focus on"
                  placeholder="Select time horizons..."
                  helperText="Choose the timeframes that matter most for your analysis."
                />
              </div>

              {/* Minimum Impact Score */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Minimum impact score
                  <span className="ml-2 text-xs text-slate-500 font-normal">(0.0 - 1.0)</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={preferences.min_impact_score}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferences((prev: typeof preferences) => ({ ...prev, min_impact_score: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0.0 (all events)</span>
                    <span className="text-white font-medium">{preferences.min_impact_score.toFixed(1)}</span>
                    <span>1.0 (critical only)</span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 font-light">
                  Filter out events below this impact threshold.
                </p>
              </div>

              {/* Minimum Confidence Score */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Minimum confidence score
                  <span className="ml-2 text-xs text-slate-500 font-normal">(0.0 - 1.0)</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={preferences.min_confidence_score}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPreferences((prev: typeof preferences) => ({ ...prev, min_confidence_score: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>0.0 (all events)</span>
                    <span className="text-white font-medium">{preferences.min_confidence_score.toFixed(1)}</span>
                    <span>1.0 (high confidence only)</span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 font-light">
                  Filter out events below this confidence threshold.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex gap-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 px-6 py-3 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors font-light"
              >
                Previous
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="flex-1 px-6 py-3 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors font-light"
              >
                I'll complete this later
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 px-6 py-3 bg-[#E1463E] text-white rounded-lg hover:bg-[#E1463E]/90 transition-colors font-light"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#E1463E] text-white rounded-lg hover:bg-[#E1463E]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light"
              >
                {loading ? 'Saving...' : 'Save and proceed'}
              </button>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
