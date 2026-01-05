/**
 * Settings Page - Advanced User Preferences Management
 * 
 * Allows users to manage their preferences for personalized feed
 * These preferences are used by Tavily to generate personalized queries
 * and help the AI understand what the user cares about
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserPreferences, updateUserPreferences } from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import MultiSelect from '../components/ui/MultiSelect';
import { 
  Bell, 
  Sparkles, 
  TrendingUp,
  Save,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Lock
} from 'lucide-react';

// Available options (same as onboarding)
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

function SettingsContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [preferences, setPreferences] = useState({
    preferred_sectors: [] as string[],
    preferred_regions: [] as string[],
    preferred_event_types: [] as string[],
    focus_areas: [] as string[],
    feed_priority: 'balanced' as 'relevance' | 'recency' | 'impact' | 'balanced',
    min_impact_score: 0.3,
    min_confidence_score: 0.5,
    preferred_time_horizons: [] as string[],
    notify_on_new_event: true,
    notify_frequency: 'realtime' as 'realtime' | 'hourly' | 'daily' | 'weekly',
  });

  const [focusAreaInput, setFocusAreaInput] = useState('');

  // Load existing preferences
  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        const data = await getUserPreferences();
        if (data) {
          setPreferences({
            preferred_sectors: data.preferred_sectors || [],
            preferred_regions: data.preferred_regions || [],
            preferred_event_types: data.preferred_event_types || [],
            focus_areas: data.focus_areas || [],
            feed_priority: data.feed_priority || 'balanced',
            min_impact_score: data.min_impact_score || 0.3,
            min_confidence_score: data.min_confidence_score || 0.5,
            preferred_time_horizons: data.preferred_time_horizons || [],
            notify_on_new_event: data.notify_on_new_event ?? true,
            notify_frequency: data.notify_frequency || 'realtime',
          });
        }
      } catch (err: any) {
        console.error('Error loading preferences:', err);
        setError('Failed to load preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      await updateUserPreferences({
        preferred_sectors: preferences.preferred_sectors,
        preferred_regions: preferences.preferred_regions,
        preferred_event_types: preferences.preferred_event_types,
        focus_areas: preferences.focus_areas,
        feed_priority: preferences.feed_priority,
        min_impact_score: preferences.min_impact_score,
        min_confidence_score: preferences.min_confidence_score,
        preferred_time_horizons: preferences.preferred_time_horizons,
        notify_on_new_event: preferences.notify_on_new_event,
        notify_frequency: preferences.notify_frequency,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addFocusArea = () => {
    if (focusAreaInput.trim() && !preferences.focus_areas.includes(focusAreaInput.trim())) {
      setPreferences({
        ...preferences,
        focus_areas: [...preferences.focus_areas, focusAreaInput.trim()],
      });
      setFocusAreaInput('');
    }
  };

  const removeFocusArea = (area: string) => {
    setPreferences({
      ...preferences,
      focus_areas: preferences.focus_areas.filter(a => a !== area),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Settings — Nucigen Labs"
        description="Manage your preferences and feed settings"
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <SectionHeader
              title="Settings"
              subtitle="Customize your intelligence feed and preferences"
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
          {/* Success/Error Messages */}
          {success && (
            <Card className="p-4 mb-6 bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-sm text-green-400 font-light">Preferences saved successfully!</p>
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-4 mb-6 bg-red-500/10 border-red-500/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-sm text-red-400 font-light">{error}</p>
              </div>
            </Card>
          )}

          <div className="space-y-6">
            {/* Feed Preferences */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[#E1463E]" />
                <h3 className="text-lg font-light text-white">Feed Personalization</h3>
              </div>
              <p className="text-sm text-slate-400 font-light mb-6">
                These preferences help our AI understand what you care about and generate personalized queries using Tavily.
                Your feed will be tailored to show events most relevant to your interests.
              </p>

              <div className="space-y-6">
                {/* Preferred Sectors */}
                <div>
                  <MultiSelect
                    label="Sectors of Interest"
                    options={SECTOR_OPTIONS}
                    selected={preferences.preferred_sectors}
                    onChange={(selected) => setPreferences({ ...preferences, preferred_sectors: selected })}
                    placeholder="Select sectors you're interested in..."
                    helperText="These sectors will be prioritized in your feed and used for personalized Tavily queries."
                  />
                </div>

                {/* Preferred Regions */}
                <div>
                  <MultiSelect
                    label="Regions of Interest"
                    options={REGION_OPTIONS}
                    selected={preferences.preferred_regions}
                    onChange={(selected) => setPreferences({ ...preferences, preferred_regions: selected })}
                    placeholder="Select regions you monitor..."
                    helperText="Events from these regions will be prioritized in your feed."
                  />
                </div>

                {/* Preferred Event Types */}
                <div>
                  <MultiSelect
                    label="Event Types"
                    options={EVENT_TYPE_OPTIONS}
                    selected={preferences.preferred_event_types}
                    onChange={(selected) => setPreferences({ ...preferences, preferred_event_types: selected })}
                    placeholder="Select event types you want to track..."
                    helperText="Filter events by type (geopolitical, regulatory, supply chain, etc.)."
                  />
                </div>

                {/* Focus Areas */}
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Focus Areas
                  </label>
                  <p className="text-xs text-slate-500 font-light mb-3">
                    Add specific topics, keywords, or areas you want to track (e.g., "semiconductor supply chains", "energy geopolitics").
                    These are used to generate highly targeted Tavily queries.
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={focusAreaInput}
                      onChange={(e) => setFocusAreaInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFocusArea()}
                      placeholder="e.g., semiconductor supply chains"
                      className="flex-1 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-white/10 focus:bg-white/[0.03] transition-all font-light text-sm"
                    />
                    <button
                      onClick={addFocusArea}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
                    >
                      Add
                    </button>
                  </div>
                  {preferences.focus_areas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {preferences.focus_areas.map((area: string) => (
                        <span
                          key={area}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-light"
                        >
                          {area}
                          <button
                            onClick={() => removeFocusArea(area)}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Time Horizons */}
                <div>
                  <MultiSelect
                    label="Time Horizons"
                    options={TIME_HORIZON_OPTIONS}
                    selected={preferences.preferred_time_horizons}
                    onChange={(selected) => setPreferences({ ...preferences, preferred_time_horizons: selected })}
                    placeholder="Select time horizons you care about..."
                    helperText="Filter events by their expected time horizon (immediate, short-term, medium-term)."
                  />
                </div>
              </div>
            </Card>

            {/* Feed Display Preferences */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-5 h-5 text-[#E1463E]" />
                <h3 className="text-lg font-light text-white">Feed Display</h3>
              </div>

              <div className="space-y-6">
                {/* Feed Priority */}
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Feed Priority
                  </label>
                  <p className="text-xs text-slate-500 font-light mb-3">
                    How should events be sorted in your feed?
                  </p>
                  <select
                    value={preferences.feed_priority}
                    onChange={(e) => setPreferences({ ...preferences, feed_priority: e.target.value as any })}
                    className="w-full px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white focus:outline-none focus:border-white/10 focus:bg-white/[0.03] transition-all font-light"
                  >
                    <option value="relevance">Relevance (most relevant to you first)</option>
                    <option value="recency">Recency (newest first)</option>
                    <option value="impact">Impact (highest impact first)</option>
                    <option value="balanced">Balanced (combination of relevance, recency, and impact)</option>
                  </select>
                </div>

                {/* Minimum Impact Score */}
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Minimum Impact Score: {(preferences.min_impact_score * 100).toFixed(0)}%
                  </label>
                  <p className="text-xs text-slate-500 font-light mb-3">
                    Only show events with impact score above this threshold.
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={preferences.min_impact_score}
                    onChange={(e) => setPreferences({ ...preferences, min_impact_score: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Minimum Confidence Score */}
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Minimum Confidence Score: {(preferences.min_confidence_score * 100).toFixed(0)}%
                  </label>
                  <p className="text-xs text-slate-500 font-light mb-3">
                    Only show events with confidence score above this threshold.
                  </p>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={preferences.min_confidence_score}
                    onChange={(e) => setPreferences({ ...preferences, min_confidence_score: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </Card>

            {/* Account Security */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-5 h-5 text-[#E1463E]" />
                <h3 className="text-lg font-light text-white">Account Security</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-slate-300 mb-2">
                    Change Password
                  </label>
                  <p className="text-xs text-slate-500 font-light mb-3">
                    Update your password to keep your account secure.
                  </p>
                  <Link
                    to="/forgot-password"
                    className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
                  >
                    Change Password
                  </Link>
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-[#E1463E]" />
                <h3 className="text-lg font-light text-white">Notifications</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-1">
                      Notify on New Events
                    </label>
                    <p className="text-xs text-slate-500 font-light">
                      Receive notifications when new events match your preferences.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.notify_on_new_event}
                      onChange={(e) => setPreferences({ ...preferences, notify_on_new_event: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E1463E]"></div>
                  </label>
                </div>

                {preferences.notify_on_new_event && (
                  <div>
                    <label className="block text-sm font-light text-slate-300 mb-2">
                      Notification Frequency
                    </label>
                    <select
                      value={preferences.notify_frequency}
                      onChange={(e) => setPreferences({ ...preferences, notify_frequency: e.target.value as any })}
                      className="w-full px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white focus:outline-none focus:border-white/10 focus:bg-white/[0.03] transition-all font-light"
                    >
                      <option value="realtime">Real-time (immediate)</option>
                      <option value="hourly">Hourly digest</option>
                      <option value="daily">Daily digest</option>
                      <option value="weekly">Weekly digest</option>
                    </select>
                  </div>
                )}

                <div className="pt-4 border-t border-white/[0.02]">
                  <Link
                    to="/settings/alerts"
                    className="text-sm text-[#E1463E] hover:text-[#E1463E]/80 transition-colors font-light"
                  >
                    Configure detailed alert preferences →
                  </Link>
                </div>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="p-6 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-light text-blue-400 mb-2">How Preferences Work</h4>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    Your preferences are used to generate personalized Tavily queries that search for events specifically relevant to you.
                    The more specific your preferences (sectors, regions, focus areas), the better our AI can understand what you care about
                    and deliver a feed that's 10X more relevant than a generic feed. These preferences are also used to calculate relevance scores
                    and prioritize events in your intelligence feed.
                  </p>
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg transition-colors font-light flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
