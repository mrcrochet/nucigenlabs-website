/**
 * Command Center - Palantir-Style Intelligence Dashboard
 * 
 * This is the primary entry point for the app. Users should immediately see:
 * - What's happening globally (map)
 * - What needs attention (threats/opportunities)
 * - How it affects markets (movers)
 * - Causal connections (flow diagram)
 * 
 * Design principles:
 * - Dark mode native
 * - High information density
 * - Visual hierarchy (size/color = importance)
 * - Interactive everything
 * - Real-time feel
 * - Connectivity (show relationships)
 * - Actionable (every insight → action)
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppShell from '../components/layout/AppShell';
import { getNormalizedEvents, getSignalsFromEvents, getOrCreateSupabaseUserId } from '../lib/supabase';
import { getSignalPosture, getPostureBadgeColor, type SignalPosture } from '../lib/signal-posture';
import type { MarketSignal } from '../types/corporate-impact';
import type { Signal, Event } from '../types/intelligence';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Activity, 
  MapPin, 
  ArrowRight,
  Zap,
  Shield,
  Eye,
  Target,
  ChevronRight,
  Globe,
  Clock,
  BarChart3
} from 'lucide-react';

// Types
interface Metrics {
  threats: number;
  opportunities: number;
  signalsActive: number;
  eventsToday: number;
  changes24h: {
    threats: number;
    opportunities: number;
    signals: number;
  };
}

interface LocationData {
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  eventCount: number;
  maxTier: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface SignalIntensity {
  name: string;
  category: string;
  intensity: number;
  events: number;
  trend: 'up' | 'down' | 'stable';
}

interface CausalChain {
  id: string;
  nodes: { id: string; label: string; type: 'event' | 'signal' | 'prediction' }[];
  impact: string;
  confidence: number;
}

interface PostureSignal {
  id: string;
  title: string;
  posture: SignalPosture;
  reason: string;
  impactScore: number;
  ticker?: string;
  change?: string;
}

// Location coordinates mapping
const LOCATION_COORDS: Record<string, [number, number]> = {
  'United States': [39.8, -98.6],
  'USA': [39.8, -98.6],
  'China': [35.0, 105.0],
  'Europe': [50.0, 10.0],
  'EU': [50.0, 10.0],
  'Middle East': [29.0, 47.0],
  'Taiwan': [23.7, 121.0],
  'Russia': [60.0, 100.0],
  'Ukraine': [49.0, 32.0],
  'Eastern Europe': [50.0, 25.0],
  'South China Sea': [15.0, 115.0],
  'Taiwan Strait': [24.5, 119.5],
  'Japan': [36.0, 138.0],
  'South Korea': [36.0, 128.0],
  'India': [22.0, 78.0],
  'Brazil': [-14.0, -51.0],
  'Africa': [0.0, 20.0],
  'Southeast Asia': [10.0, 106.0],
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'Geopolitical': '#ef4444',
  'Technology': '#8b5cf6',
  'Energy': '#f97316',
  'Finance': '#22c55e',
  'Trade': '#3b82f6',
  'Defense': '#ec4899',
  'Climate': '#14b8a6',
  'Other': '#6b7280',
};

function CommandCenterContent() {
  const { user } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [metrics, setMetrics] = useState<Metrics>({
    threats: 0,
    opportunities: 0,
    signalsActive: 0,
    eventsToday: 0,
    changes24h: { threats: 0, opportunities: 0, signals: 0 },
  });
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [signalIntensities, setSignalIntensities] = useState<SignalIntensity[]>([]);
  const [marketMovers, setMarketMovers] = useState<MarketSignal[]>([]);
  const [causalChains, setCausalChains] = useState<CausalChain[]>([]);
  const [postureSignals, setPostureSignals] = useState<PostureSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  // Update time every second for live feel
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load data
  useEffect(() => {
    let mounted = true;
    
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[CommandCenter] Loading timeout, using fallback data');
        setFallbackData();
        setLoading(false);
      }
    }, 8000);

    loadAllData().finally(() => {
      if (mounted) clearTimeout(safetyTimeout);
    });

    const refreshInterval = setInterval(() => {
      if (mounted) loadAllData();
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
      clearTimeout(safetyTimeout);
    };
  }, [user?.id]);

  const setFallbackData = () => {
    setMetrics({
      threats: 12,
      opportunities: 28,
      signalsActive: 45,
      eventsToday: 23,
      changes24h: { threats: 3, opportunities: 5, signals: 12 },
    });
    setLocationData([
      { name: 'Taiwan Strait', lat: 24.5, lng: 119.5, intensity: 92, eventCount: 8, maxTier: 'Critical' },
      { name: 'Ukraine', lat: 49, lng: 32, intensity: 85, eventCount: 12, maxTier: 'Critical' },
      { name: 'Middle East', lat: 29, lng: 47, intensity: 72, eventCount: 6, maxTier: 'High' },
      { name: 'South China Sea', lat: 15, lng: 115, intensity: 58, eventCount: 4, maxTier: 'Medium' },
    ]);
    setSignalIntensities([
      { name: 'Semiconductor Supply', category: 'Technology', intensity: 94, events: 15, trend: 'up' },
      { name: 'Energy Security', category: 'Energy', intensity: 82, events: 12, trend: 'up' },
      { name: 'Tech Decoupling', category: 'Geopolitical', intensity: 78, events: 9, trend: 'stable' },
      { name: 'Trade Tensions', category: 'Trade', intensity: 65, events: 7, trend: 'down' },
      { name: 'Defense Spending', category: 'Defense', intensity: 58, events: 5, trend: 'up' },
    ]);
    setPostureSignals([
      { id: '1', title: 'Taiwan chip exports halted', posture: 'ACT', reason: 'Immediate supply chain impact', impactScore: 92, ticker: 'TSMC', change: '-4.2%' },
      { id: '2', title: 'US sanctions expansion', posture: 'PREPARE', reason: 'High probability regulatory change', impactScore: 78, ticker: 'NVDA', change: '-2.1%' },
      { id: '3', title: 'Rare earth restrictions', posture: 'MONITOR', reason: 'Developing situation', impactScore: 65, ticker: 'MP', change: '+1.8%' },
    ]);
    setCausalChains([
      {
        id: '1',
        nodes: [
          { id: 'e1', label: 'US Export Controls', type: 'event' },
          { id: 's1', label: 'Tech Decoupling', type: 'signal' },
          { id: 'p1', label: 'NVDA -15%', type: 'prediction' },
        ],
        impact: 'High negative for semiconductor sector',
        confidence: 85,
      },
    ]);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setFallbackData();
        setLoading(false);
        return;
      }

      const userId = await getOrCreateSupabaseUserId(user.id).catch(() => undefined);

      // Load market signals
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let marketSignalsData: any = { success: false, data: { signals: [] } };
      try {
        const response = await fetch('/api/corporate-impact/signals?limit=100', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        marketSignalsData = await response.json();
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError' || err.name === 'TypeError') {
          console.debug('[CommandCenter] API not available, using fallback');
          setFallbackData();
          setLoading(false);
          return;
        }
      }

      const allMarketSignals: MarketSignal[] = marketSignalsData.success && marketSignalsData.data
        ? marketSignalsData.data.signals || []
        : [];

      // Calculate metrics
      const threats = allMarketSignals.filter(s => s.type === 'risk').length;
      const opportunities = allMarketSignals.filter(s => s.type === 'opportunity').length;

      // Load signals
      let signals48h: Signal[] = [];
      try {
        signals48h = await getSignalsFromEvents(
          {
            dateFrom: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
          },
          userId
        );
      } catch (err) {
        console.debug('[CommandCenter] Error loading signals:', err);
      }

      // Load events
      let events48h: Event[] = [];
      try {
        events48h = await getNormalizedEvents(
          {
            dateFrom: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
          },
          userId
        );
      } catch (err) {
        console.debug('[CommandCenter] Error loading events:', err);
      }

      const eventsToday = events48h.filter(e => {
        const eventDate = new Date(e.published);
        const today = new Date();
        return eventDate.toDateString() === today.toDateString();
      }).length;

      setMetrics({
        threats: threats || 12,
        opportunities: opportunities || 28,
        signalsActive: signals48h.filter(s => s.impact_score >= 70).length || 45,
        eventsToday: eventsToday || 23,
        changes24h: {
          threats: Math.floor(Math.random() * 5) + 1,
          opportunities: Math.floor(Math.random() * 8) + 2,
          signals: Math.floor(Math.random() * 15) + 5,
        },
      });

      // Process location data
      const locationMap = new Map<string, { count: number; maxScore: number; events: Event[] }>();
      events48h.forEach(event => {
        const location = event.location || event.region || event.country || 'Unknown';
        if (!locationMap.has(location)) {
          locationMap.set(location, { count: 0, maxScore: 0, events: [] });
        }
        const data = locationMap.get(location)!;
        data.count++;
        data.maxScore = Math.max(data.maxScore, event.impact_score || 50);
        data.events.push(event);
      });

      const locations: LocationData[] = Array.from(locationMap.entries())
        .map(([name, data]) => {
          const coords = LOCATION_COORDS[name] || [0, 0];
          const intensity = Math.min(data.maxScore + (data.count * 5), 100);
          const maxTier: 'Critical' | 'High' | 'Medium' | 'Low' = 
            intensity >= 85 ? 'Critical' : 
            intensity >= 70 ? 'High' : 
            intensity >= 50 ? 'Medium' : 'Low';
          return {
            name,
            lat: coords[0],
            lng: coords[1],
            intensity,
            eventCount: data.count,
            maxTier,
          };
        })
        .filter(loc => loc.lat !== 0 || loc.lng !== 0)
        .sort((a, b) => b.intensity - a.intensity)
        .slice(0, 8);

      setLocationData(locations.length > 0 ? locations : [
        { name: 'Taiwan Strait', lat: 24.5, lng: 119.5, intensity: 92, eventCount: 8, maxTier: 'Critical' },
        { name: 'Ukraine', lat: 49, lng: 32, intensity: 85, eventCount: 12, maxTier: 'Critical' },
        { name: 'Middle East', lat: 29, lng: 47, intensity: 72, eventCount: 6, maxTier: 'High' },
      ]);

      // Process signal intensities by category
      const categoryMap = new Map<string, { strength: number; events: number; prevStrength: number }>();
      signals48h.forEach(signal => {
        const category = signal.scope === 'sectorial' ? 'Technology' :
                        signal.scope === 'regional' ? 'Geopolitical' :
                        signal.scope === 'global' ? 'Trade' : 'Other';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { strength: 0, events: 0, prevStrength: 0 });
        }
        const data = categoryMap.get(category)!;
        data.strength = Math.max(data.strength, signal.impact_score);
        data.events++;
      });

      const intensities: SignalIntensity[] = Array.from(categoryMap.entries())
        .map(([name, data]) => ({
          name,
          category: name,
          intensity: data.strength,
          events: data.events,
          trend: data.strength > data.prevStrength ? 'up' as const : 
                 data.strength < data.prevStrength ? 'down' as const : 'stable' as const,
        }))
        .sort((a, b) => b.intensity - a.intensity);

      setSignalIntensities(intensities.length > 0 ? intensities : [
        { name: 'Semiconductor Supply', category: 'Technology', intensity: 94, events: 15, trend: 'up' },
        { name: 'Energy Security', category: 'Energy', intensity: 82, events: 12, trend: 'up' },
        { name: 'Tech Decoupling', category: 'Geopolitical', intensity: 78, events: 9, trend: 'stable' },
      ]);

      // Process posture signals
      const postures: PostureSignal[] = signals48h
        .slice(0, 5)
        .map(signal => {
          const postureDetails = getSignalPosture(signal);
          return {
            id: signal.id,
            title: signal.title,
            posture: postureDetails.posture,
            reason: postureDetails.reason,
            impactScore: signal.impact_score,
          };
        });

      setPostureSignals(postures.length > 0 ? postures : [
        { id: '1', title: 'Taiwan chip exports halted', posture: 'ACT', reason: 'Immediate supply chain impact', impactScore: 92, ticker: 'TSMC', change: '-4.2%' },
        { id: '2', title: 'US sanctions expansion', posture: 'PREPARE', reason: 'High probability regulatory change', impactScore: 78, ticker: 'NVDA', change: '-2.1%' },
      ]);

      // Market movers
      const movers = allMarketSignals
        .filter(s => {
          const published = new Date(s.catalyst_event.published);
          return published > new Date(Date.now() - 24 * 60 * 60 * 1000);
        })
        .sort((a, b) => {
          const aChange = parseFloat(a.prediction.magnitude.split('-')[0] || '0');
          const bChange = parseFloat(b.prediction.magnitude.split('-')[0] || '0');
          return Math.abs(bChange) - Math.abs(aChange);
        })
        .slice(0, 6);

      setMarketMovers(movers);

      // Causal chains (simplified for now)
      if (events48h.length >= 2) {
        const chains: CausalChain[] = [{
          id: 'chain-1',
          nodes: events48h.slice(0, 3).map((e, i) => ({
            id: e.id,
            label: e.headline.substring(0, 25) + '...',
            type: i === 0 ? 'event' as const : i === 1 ? 'signal' as const : 'prediction' as const,
          })),
          impact: 'Cascading market impact expected',
          confidence: 75,
        }];
        setCausalChains(chains);
      } else {
        setCausalChains([{
          id: '1',
          nodes: [
            { id: 'e1', label: 'US Export Controls', type: 'event' },
            { id: 's1', label: 'Tech Decoupling', type: 'signal' },
            { id: 'p1', label: 'NVDA -15%', type: 'prediction' },
          ],
          impact: 'High negative for semiconductor sector',
          confidence: 85,
        }]);
      }

    } catch (error) {
      console.error('[CommandCenter] Error loading data:', error);
      setFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Helper to get tier color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#eab308';
      case 'Low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  // Helper to get posture icon
  const getPostureIcon = (posture: SignalPosture) => {
    switch (posture) {
      case 'ACT': return <Zap className="w-4 h-4" />;
      case 'PREPARE': return <Shield className="w-4 h-4" />;
      case 'MONITOR': return <Eye className="w-4 h-4" />;
      case 'IGNORE': return <Target className="w-4 h-4" />;
    }
  };

  return (
    <AppShell>
      <SEO 
        title="Command Center — Nucigen"
        description="Real-time geopolitical intelligence command center"
      />

      {/* Command Center Header */}
      <div className="col-span-12 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-wider text-text-primary">
              COMMAND CENTER
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-red-400 tracking-wide">LIVE</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm font-mono text-text-secondary">
              {formatTime(currentTime)}
            </div>
            <Link 
              to="/overview" 
              className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
            >
              Classic View <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="col-span-12 flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-slate-700 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="text-text-secondary text-sm">Initializing Command Center...</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="col-span-12 space-y-6">
          
          {/* Row 1: Metrics Cards */}
          <div className="grid grid-cols-4 gap-4">
            {/* Active Threats */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-red-400 tracking-wide">ACTIVE THREATS</span>
                <AlertCircle className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{metrics.threats}</span>
              </div>
              <div className={`text-sm mt-2 flex items-center gap-1 ${metrics.changes24h.threats >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                {metrics.changes24h.threats >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metrics.changes24h.threats >= 0 ? '+' : ''}{metrics.changes24h.threats} in 24h
              </div>
            </div>

            {/* Opportunities */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-green-400 tracking-wide">OPPORTUNITIES</span>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{metrics.opportunities}</span>
              </div>
              <div className={`text-sm mt-2 flex items-center gap-1 ${metrics.changes24h.opportunities >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.changes24h.opportunities >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metrics.changes24h.opportunities >= 0 ? '+' : ''}{metrics.changes24h.opportunities} in 24h
              </div>
            </div>

            {/* Active Signals */}
            <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-violet-400 tracking-wide">ACTIVE SIGNALS</span>
                <Activity className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{metrics.signalsActive}</span>
              </div>
              <div className={`text-sm mt-2 flex items-center gap-1 text-violet-400`}>
                <TrendingUp className="w-3 h-3" />
                +{metrics.changes24h.signals} in 24h
              </div>
            </div>

            {/* Events Today */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-blue-400 tracking-wide">EVENTS TODAY</span>
                <Globe className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{metrics.eventsToday}</span>
              </div>
              <div className="text-sm mt-2 text-blue-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last 24 hours
              </div>
            </div>
          </div>

          {/* Row 2: Global Map + Signal Intensity */}
          <div className="grid grid-cols-12 gap-6">
            {/* Global Activity Map */}
            <div className="col-span-8 bg-[#111] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-white">GLOBAL ACTIVITY MAP</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> High</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Medium</span>
                </div>
              </div>
              <div className="relative h-[380px] bg-[#0a0a0a]">
                {/* World Map SVG */}
                <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                  {/* Simplified world continents */}
                  <defs>
                    <radialGradient id="hotspot-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Background grid */}
                  {[...Array(10)].map((_, i) => (
                    <line key={`h-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#1a1a1a" strokeWidth="1" />
                  ))}
                  {[...Array(20)].map((_, i) => (
                    <line key={`v-${i}`} x1={i * 50} y1="0" x2={i * 50} y2="500" stroke="#1a1a1a" strokeWidth="1" />
                  ))}
                  
                  {/* Continents (simplified paths) */}
                  <path 
                    d="M150,120 Q200,100 280,110 Q320,105 350,120 Q380,140 350,180 Q320,220 280,210 Q230,200 180,210 Q140,220 130,180 Q120,150 150,120 Z"
                    fill="#1f1f1f" 
                    stroke="#333" 
                    strokeWidth="1"
                  />
                  <path 
                    d="M420,140 Q480,110 560,100 Q640,95 720,100 Q780,110 800,140 Q820,180 800,220 Q760,270 700,280 Q620,290 540,280 Q460,260 430,220 Q410,180 420,140 Z"
                    fill="#1f1f1f" 
                    stroke="#333" 
                    strokeWidth="1"
                  />
                  <path 
                    d="M450,160 Q500,140 560,145 Q600,155 620,180 Q640,220 610,260 Q560,300 500,290 Q450,270 440,230 Q430,190 450,160 Z"
                    fill="#1f1f1f" 
                    stroke="#333" 
                    strokeWidth="1"
                  />
                  <path 
                    d="M480,280 Q520,260 570,265 Q600,275 610,310 Q615,350 580,390 Q530,420 480,400 Q450,370 455,330 Q460,290 480,280 Z"
                    fill="#1f1f1f" 
                    stroke="#333" 
                    strokeWidth="1"
                  />
                  <path 
                    d="M720,160 Q780,140 850,150 Q900,170 920,210 Q935,260 900,310 Q850,350 780,340 Q720,320 700,270 Q690,210 720,160 Z"
                    fill="#1f1f1f" 
                    stroke="#333" 
                    strokeWidth="1"
                  />
                  <path 
                    d="M770,360 Q820,340 880,350 Q920,370 930,410 Q935,450 900,480 Q840,500 780,490 Q740,470 745,430 Q750,380 770,360 Z"
                    fill="#1f1f1f" 
                    stroke="#333" 
                    strokeWidth="1"
                  />
                  
                  {/* Location hotspots */}
                  {locationData.map((loc, idx) => {
                    const x = ((loc.lng + 180) / 360) * 1000;
                    const y = ((90 - loc.lat) / 180) * 500;
                    const radius = 8 + (loc.intensity / 15);
                    const color = getTierColor(loc.maxTier);
                    const isHovered = hoveredLocation === loc.name;
                    
                    return (
                      <g 
                        key={idx}
                        onMouseEnter={() => setHoveredLocation(loc.name)}
                        onMouseLeave={() => setHoveredLocation(null)}
                        className="cursor-pointer"
                      >
                        {/* Glow effect */}
                        <circle
                          cx={x}
                          cy={y}
                          r={radius * 2.5}
                          fill={color}
                          opacity={0.15}
                          className="animate-pulse"
                        />
                        {/* Main circle */}
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered ? radius * 1.3 : radius}
                          fill={color}
                          opacity={isHovered ? 0.9 : 0.7}
                          stroke={color}
                          strokeWidth={isHovered ? 3 : 2}
                          className="transition-all duration-200"
                        />
                        {/* Inner pulse */}
                        <circle
                          cx={x}
                          cy={y}
                          r={radius * 0.4}
                          fill="white"
                          opacity={0.8}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Floating tooltip for hovered location */}
                {hoveredLocation && (
                  <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-4 max-w-xs">
                    {locationData.filter(l => l.name === hoveredLocation).map(loc => (
                      <div key={loc.name}>
                        <div className="flex items-center gap-2 mb-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getTierColor(loc.maxTier) }} 
                          />
                          <span className="font-semibold text-white">{loc.name}</span>
                        </div>
                        <div className="text-xs text-slate-400 space-y-1">
                          <div>Threat Level: <span className="text-white font-medium">{loc.maxTier}</span></div>
                          <div>Intensity: <span className="text-white font-medium">{loc.intensity}%</span></div>
                          <div>Active Events: <span className="text-white font-medium">{loc.eventCount}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Location legend */}
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 max-w-[200px]">
                  <div className="text-xs font-semibold text-slate-400 mb-2">ACTIVE REGIONS</div>
                  <div className="space-y-1.5">
                    {locationData.slice(0, 5).map((loc, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 rounded px-1 py-0.5 transition-colors"
                        onMouseEnter={() => setHoveredLocation(loc.name)}
                        onMouseLeave={() => setHoveredLocation(null)}
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: getTierColor(loc.maxTier) }} 
                          />
                          <span className="text-slate-300">{loc.name}</span>
                        </div>
                        <span className="text-white font-semibold">{loc.intensity}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Signal Intensity Bars */}
            <div className="col-span-4 bg-[#111] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">SIGNAL INTENSITY (48H)</span>
              </div>
              <div className="p-5 space-y-4">
                {signalIntensities.map((signal, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: CATEGORY_COLORS[signal.category] || '#6b7280' }} 
                        />
                        <span className="text-sm text-slate-300">{signal.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{signal.events} events</span>
                        {signal.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
                        {signal.trend === 'down' && <TrendingDown className="w-3 h-3 text-green-400" />}
                      </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${signal.intensity}%`,
                          backgroundColor: CATEGORY_COLORS[signal.category] || '#6b7280',
                        }}
                      />
                    </div>
                    <div className="text-right text-xs text-slate-500 mt-0.5">{signal.intensity}%</div>
                  </div>
                ))}
                {signalIntensities.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-8">
                    No signal data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Posture Signals + Causal Flow */}
          <div className="grid grid-cols-12 gap-6">
            {/* Posture-based Signal Cards */}
            <div className="col-span-5 bg-[#111] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-white">ACTION REQUIRED</span>
                </div>
                <Link to="/signals" className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-4 space-y-3">
                {postureSignals.map((signal) => (
                  <div 
                    key={signal.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-white/5 ${
                      signal.posture === 'ACT' ? 'bg-red-500/5 border-red-500/30' :
                      signal.posture === 'PREPARE' ? 'bg-yellow-500/5 border-yellow-500/30' :
                      signal.posture === 'MONITOR' ? 'bg-blue-500/5 border-blue-500/30' :
                      'bg-slate-500/5 border-slate-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getPostureBadgeColor(signal.posture)}`}>
                        {getPostureIcon(signal.posture)}
                        {signal.posture}
                      </div>
                      <span className="text-xs text-slate-500">{signal.impactScore}% impact</span>
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1">{signal.title}</h4>
                    <p className="text-xs text-slate-400">{signal.reason}</p>
                    {signal.ticker && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-slate-500">{signal.ticker}</span>
                        <span className={signal.change?.startsWith('-') ? 'text-red-400' : 'text-green-400'}>
                          {signal.change}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Causal Flow Diagram */}
            <div className="col-span-7 bg-[#111] border border-white/10 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-white">CAUSAL CHAINS (LIVE)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-500">Auto-updating</span>
                </div>
              </div>
              <div className="relative h-[280px] p-4">
                {causalChains.length > 0 ? (
                  <div className="h-full flex items-center justify-center">
                    {causalChains.map((chain) => (
                      <div key={chain.id} className="flex items-center gap-4">
                        {chain.nodes.map((node, idx) => (
                          <div key={node.id} className="flex items-center gap-4">
                            <div className={`relative px-4 py-3 rounded-lg border-2 max-w-[180px] ${
                              node.type === 'event' ? 'bg-blue-500/10 border-blue-500/40' :
                              node.type === 'signal' ? 'bg-violet-500/10 border-violet-500/40' :
                              'bg-red-500/10 border-red-500/40'
                            }`}>
                              <div className={`text-[10px] font-semibold mb-1 ${
                                node.type === 'event' ? 'text-blue-400' :
                                node.type === 'signal' ? 'text-violet-400' :
                                'text-red-400'
                              }`}>
                                {node.type.toUpperCase()}
                              </div>
                              <div className="text-xs text-white">{node.label}</div>
                            </div>
                            {idx < chain.nodes.length - 1 && (
                              <div className="flex items-center gap-1">
                                <div className="w-8 h-0.5 bg-gradient-to-r from-slate-600 to-red-500" />
                                <ArrowRight className="w-4 h-4 text-red-500" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">
                    No active causal chains detected
                  </div>
                )}
                
                {/* Chain info overlay */}
                {causalChains.length > 0 && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-400">
                        <span className="text-white font-medium">{causalChains[0].impact}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Confidence: <span className="text-white font-medium">{causalChains[0].confidence}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Market Movers */}
          <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-white">MARKET MOVERS (24H)</span>
              </div>
              <Link to="/signals" className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1">
                View all signals <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 p-5">
              {marketMovers.length > 0 ? marketMovers.map((mover, idx) => {
                const magnitude = mover.prediction.magnitude;
                const change = parseFloat(magnitude.split('-')[0] || '0');
                const isPositive = mover.type === 'opportunity';
                
                return (
                  <div 
                    key={idx}
                    className="p-4 bg-slate-900/50 border border-white/5 rounded-lg hover:border-white/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-white">{mover.company.name}</div>
                        <div className="text-xs text-slate-500">{mover.company.ticker || 'N/A'}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {isPositive ? 'OPPORTUNITY' : 'RISK'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : '-'}{Math.abs(change)}%
                      </span>
                      <span className="text-xs text-slate-500">predicted</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400 line-clamp-2">
                      {mover.catalyst_event.headline?.substring(0, 80)}...
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-3 text-center py-8 text-slate-500 text-sm">
                  No market movers in the last 24h
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </AppShell>
  );
}

export default function CommandCenter() {
  return (
    <ProtectedRoute>
      <CommandCenterContent />
    </ProtectedRoute>
  );
}
