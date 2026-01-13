/**
 * PHASE 3C: Alert Settings Page
 * 
 * Configure user alert preferences
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppShell from '../components/layout/AppShell';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import { createClient } from '@supabase/supabase-js';
import { Save } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AlertPreferences {
  enabled: boolean;
  min_impact_score: number;
  min_confidence: number;
  sectors: string[];
  regions: string[];
  event_types: string[];
  notify_on_new_event: boolean;
  notify_on_high_impact: boolean;
  notify_on_sector_match: boolean;
  notify_on_region_match: boolean;
  notification_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
}

const AVAILABLE_SECTORS = [
  'Technology', 'Energy', 'Finance', 'Healthcare', 'Manufacturing',
  'Agriculture', 'Transportation', 'Retail', 'Real Estate', 'Telecommunications'
];

const AVAILABLE_REGIONS = [
  'North America', 'Europe', 'Asia', 'Middle East', 'Africa',
  'South America', 'Oceania', 'Arctic'
];

const AVAILABLE_EVENT_TYPES = [
  'Geopolitical', 'Industrial', 'SupplyChain', 'Regulatory', 'Security', 'Market'
];

function AlertSettingsContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<AlertPreferences>({
    enabled: true,
    min_impact_score: 0.5,
    min_confidence: 0.6,
    sectors: [],
    regions: [],
    event_types: [],
    notify_on_new_event: true,
    notify_on_high_impact: true,
    notify_on_sector_match: true,
    notify_on_region_match: true,
    notification_frequency: 'realtime',
  });

  useEffect(() => {
    async function fetchPreferences() {
      if (!user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('alert_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

        if (data) {
          setPreferences({
            enabled: data.enabled ?? true,
            min_impact_score: data.min_impact_score ?? 0.5,
            min_confidence: data.min_confidence ?? 0.6,
            sectors: data.sectors || [],
            regions: data.regions || [],
            event_types: data.event_types || [],
            notify_on_new_event: data.notify_on_new_event ?? true,
            notify_on_high_impact: data.notify_on_high_impact ?? true,
            notify_on_sector_match: data.notify_on_sector_match ?? true,
            notify_on_region_match: data.notify_on_region_match ?? true,
            notification_frequency: data.notification_frequency || 'realtime',
          });
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPreferences();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('alert_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      alert('Alert preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 font-light">Loading settings...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO
        title="Alert Settings — Nucigen Labs"
        description="Configure your alert preferences"
      />

      <div className="col-span-1 sm:col-span-12">
        <header className="mb-6">
          <SectionHeader
            title="Alert Settings"
            subtitle="Configure when and how you receive alerts"
          />
        </header>
          <Card className="p-8 space-y-8">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.02]">
              <div>
                <h3 className="text-lg font-light text-white mb-1">Enable Alerts</h3>
                <p className="text-sm text-slate-500 font-light">Turn alerts on or off</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.enabled}
                  onChange={(e) => setPreferences({ ...preferences, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/[0.05] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E1463E]"></div>
              </label>
            </div>

            {/* Thresholds */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-light text-slate-400 mb-2">
                  Minimum Impact Score: {(preferences.min_impact_score * 100).toFixed(0)}%
                </label>
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

              <div>
                <label className="block text-sm font-light text-slate-400 mb-2">
                  Minimum Confidence: {(preferences.min_confidence * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={preferences.min_confidence}
                  onChange={(e) => setPreferences({ ...preferences, min_confidence: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Sectors */}
            <div>
              <label className="block text-sm font-light text-white mb-3">Monitor Sectors</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SECTORS.map(sector => (
                  <button
                    key={sector}
                    onClick={() => setPreferences({
                      ...preferences,
                      sectors: toggleArrayItem(preferences.sectors, sector)
                    })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-light transition-all ${
                      preferences.sectors.includes(sector)
                        ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
                        : 'bg-white/[0.02] text-slate-400 border border-white/[0.05] hover:bg-white/[0.03] hover:text-white'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            {/* Regions */}
            <div>
              <label className="block text-sm font-light text-white mb-3">Monitor Regions</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_REGIONS.map(region => (
                  <button
                    key={region}
                    onClick={() => setPreferences({
                      ...preferences,
                      regions: toggleArrayItem(preferences.regions, region)
                    })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-light transition-all ${
                      preferences.regions.includes(region)
                        ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
                        : 'bg-white/[0.02] text-slate-400 border border-white/[0.05] hover:bg-white/[0.03] hover:text-white'
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Types */}
            <div>
              <label className="block text-sm font-light text-white mb-3">Monitor Event Types</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EVENT_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setPreferences({
                      ...preferences,
                      event_types: toggleArrayItem(preferences.event_types, type)
                    })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-light transition-all ${
                      preferences.event_types.includes(type)
                        ? 'bg-[#E1463E]/20 text-[#E1463E] border border-[#E1463E]/30'
                        : 'bg-white/[0.02] text-slate-400 border border-white/[0.05] hover:bg-white/[0.03] hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4 pt-6 border-t border-white/[0.02]">
              <h3 className="text-lg font-light text-white mb-4">Notification Settings</h3>
              
              <label className="flex items-center justify-between">
                <span className="text-sm font-light text-slate-300">Notify on new events</span>
                <input
                  type="checkbox"
                  checked={preferences.notify_on_new_event}
                  onChange={(e) => setPreferences({ ...preferences, notify_on_new_event: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm font-light text-slate-300">Notify on high impact</span>
                <input
                  type="checkbox"
                  checked={preferences.notify_on_high_impact}
                  onChange={(e) => setPreferences({ ...preferences, notify_on_high_impact: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm font-light text-slate-300">Notify on sector match</span>
                <input
                  type="checkbox"
                  checked={preferences.notify_on_sector_match}
                  onChange={(e) => setPreferences({ ...preferences, notify_on_sector_match: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm font-light text-slate-300">Notify on region match</span>
                <input
                  type="checkbox"
                  checked={preferences.notify_on_region_match}
                  onChange={(e) => setPreferences({ ...preferences, notify_on_region_match: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>

              <div>
                <label className="block text-sm font-light text-slate-400 mb-2">Notification Frequency</label>
                <select
                  value={preferences.notification_frequency}
                  onChange={(e) => setPreferences({ ...preferences, notification_frequency: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-xl text-white focus:outline-none focus:border-white/10"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly digest</option>
                  <option value="daily">Daily digest</option>
                  <option value="weekly">Weekly digest</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 border-t border-white/[0.02]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#E1463E] text-white rounded-xl hover:bg-[#E1463E]/90 transition-all font-light disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </Card>
      </div>
    </AppShell>
  );
}

export default function AlertSettings() {
  return (
    <ProtectedRoute>
      <AlertSettingsContent />
    </ProtectedRoute>
  );
}

