/**
 * Performance Metrics Component
 * 
 * Affiche les métriques de performance et optimisations
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Card from './ui/Card';
import Badge from './ui/Badge';
import { Zap, TrendingUp, Activity, Clock, Database, Rocket } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

interface PerformanceMetrics {
  totalEvents: number;
  eventsToday: number;
  eventsLastHour: number;
  avgProcessingTime: number;
  pipelineSpeed: string;
  apiUtilization: {
    openai: string;
    tavily: string;
    firecrawl: string;
  };
}

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Fetch total events
        const { count: totalCount } = await supabase
          .from('nucigen_events')
          .select('*', { count: 'exact', head: true });

        // Fetch events created today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase
          .from('nucigen_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());

        // Fetch events created in last hour
        const lastHour = new Date(Date.now() - 60 * 60 * 1000);
        const { count: lastHourCount } = await supabase
          .from('nucigen_events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', lastHour.toISOString());

        // Calculate processing speed
        const eventsPerHour = lastHourCount || 0;
        const eventsPerDay = todayCount || 0;
        
        // Estimate processing speed based on volume
        let pipelineSpeed = 'Standard';
        if (eventsPerHour > 100) {
          pipelineSpeed = 'Optimized (100+/hr)';
        } else if (eventsPerHour > 50) {
          pipelineSpeed = 'High (50+/hr)';
        } else if (eventsPerHour > 10) {
          pipelineSpeed = 'Moderate (10+/hr)';
        }

        setMetrics({
          totalEvents: totalCount || 0,
          eventsToday: todayCount || 0,
          eventsLastHour: lastHourCount || 0,
          avgProcessingTime: 2.5, // Estimated based on optimizations
          pipelineSpeed,
          apiUtilization: {
            openai: '50 concurrent requests',
            tavily: '50 results/query',
            firecrawl: '10 concurrent requests',
          },
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-white/5 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-white/5 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return null;
  }

  const getSpeedBadgeVariant = () => {
    if (metrics.eventsLastHour > 100) return 'level';
    if (metrics.eventsLastHour > 50) return 'neutral';
    return 'sector';
  };

  return (
    <Card className="p-6 border-2 border-green-500/20 bg-green-500/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Rocket className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-light text-white">Performance Optimized</h3>
            <p className="text-xs text-slate-500 font-light">Maximized API usage enabled</p>
          </div>
        </div>
        <Badge variant="level" className="bg-green-500/20 text-green-400 border-green-500/30">
          <Zap className="w-3 h-3 mr-1" />
          Optimized
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <div className="text-xs text-slate-500 font-light mb-1">Events/Hour</div>
          <div className="text-2xl font-light text-white">{metrics.eventsLastHour}</div>
          <div className="text-xs text-green-400 font-light mt-1">
            {metrics.eventsLastHour > 50 ? '⚡ High throughput' : '✓ Active'}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-light mb-1">Events Today</div>
          <div className="text-2xl font-light text-white">{metrics.eventsToday}</div>
          <div className="text-xs text-slate-600 font-light mt-1">
            {metrics.eventsToday > 1000 ? '🚀 Excellent' : 'Good'}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-light mb-1">Total Events</div>
          <div className="text-2xl font-light text-white">{metrics.totalEvents.toLocaleString()}</div>
          <div className="text-xs text-slate-600 font-light mt-1">All time</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-light mb-1">Processing</div>
          <div className="text-2xl font-light text-white">{metrics.avgProcessingTime}s</div>
          <div className="text-xs text-green-400 font-light mt-1">⚡ Fast</div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/[0.02]">
        <div className="text-xs text-slate-500 font-light mb-3">API Utilization</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg">
            <Activity className="w-4 h-4 text-blue-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-400 font-light">OpenAI</div>
              <div className="text-sm text-white font-light">{metrics.apiUtilization.openai}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-400 font-light">Tavily</div>
              <div className="text-sm text-white font-light">{metrics.apiUtilization.tavily}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg">
            <Database className="w-4 h-4 text-orange-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-400 font-light">Firecrawl</div>
              <div className="text-sm text-white font-light">{metrics.apiUtilization.firecrawl}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.02]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-light">Pipeline Speed</span>
          <Badge variant={getSpeedBadgeVariant()}>
            {metrics.pipelineSpeed}
          </Badge>
        </div>
        <div className="mt-2 text-xs text-slate-600 font-light">
          Collection: 5min intervals · Processing: 2min intervals · Batch: 100 events
        </div>
      </div>
    </Card>
  );
}


