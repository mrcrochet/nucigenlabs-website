/**
 * KPIGrid - 4 KPI cards
 * Cards: Events24h, Signals24h, HighProbImpacts7d, WatchlistVolatility
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import KPIStatCard, { KPIData } from '../ui/KPIStatCard';
import { getNormalizedEvents, getSignalsFromEvents, getOrCreateSupabaseUserId } from '../../lib/supabase';

export default function KPIGrid() {
  const { user } = useUser();
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKPIs = async () => {
      try {
        const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
        
        // Get events from last 24h
        const events24h = await getNormalizedEvents(
          {
            dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
          },
          userId
        );

        // Get signals from last 24h
        const signals24h = await getSignalsFromEvents(
          {
            dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
          },
          userId
        );

        // Get high-impact impacts (7d) - placeholder for now
        const impacts7d = await getSignalsFromEvents(
          {
            dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString(),
            minImpact: 70,
          },
          userId
        );

        // Calculate trends (last 7 days)
        const trendDataEvents = await Promise.all(
          Array.from({ length: 7 }, async (_, i) => {
            const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
            const dayEvents = await getNormalizedEvents(
              {
                dateFrom: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
                dateTo: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
              },
              userId
            );
            return dayEvents.length;
          })
        );

        const trendDataSignals = await Promise.all(
          Array.from({ length: 7 }, async (_, i) => {
            const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
            const daySignals = await getSignalsFromEvents(
              {
                dateFrom: new Date(date.setHours(0, 0, 0, 0)).toISOString(),
                dateTo: new Date(date.setHours(23, 59, 59, 999)).toISOString(),
              },
              userId
            );
            return daySignals.length;
          })
        );

        // Calculate deltas (vs previous period)
        const eventsPrev24h = await getNormalizedEvents(
          {
            dateFrom: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          userId
        );
        const deltaEvents = events24h.length > 0 && eventsPrev24h.length > 0
          ? ((events24h.length - eventsPrev24h.length) / eventsPrev24h.length) * 100
          : 0;

        const signalsPrev24h = await getSignalsFromEvents(
          {
            dateFrom: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          userId
        );
        const deltaSignals = signals24h.length > 0 && signalsPrev24h.length > 0
          ? ((signals24h.length - signalsPrev24h.length) / signalsPrev24h.length) * 100
          : 0;

        // Calculate interpretations
        const eventsInterpretation = events24h.length > 40 ? 'Above average' : events24h.length > 20 ? 'Normal activity' : 'Below average';
        const signalsInterpretation = signals24h.length > 15 ? 'Elevated signal activity' : signals24h.length > 5 ? 'Normal activity' : 'Low activity';
        const impactsInterpretation = impacts7d.length > 20 ? 'Elevated risk environment' : impacts7d.length > 10 ? 'Moderate risk' : 'Low risk';

        setKpis([
          {
            label: 'Events (24h)',
            value: events24h.length.toString(),
            delta: deltaEvents,
            trendData: trendDataEvents,
            interpretation: eventsInterpretation,
          },
          {
            label: 'Signals (24h)',
            value: signals24h.length.toString(),
            delta: deltaSignals,
            trendData: trendDataSignals,
            interpretation: signalsInterpretation,
          },
          {
            label: 'High-Impact Impacts (7d)',
            value: impacts7d.length.toString(),
            delta: 0, // TODO: Calculate when impacts are implemented
            trendData: Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)),
            interpretation: impactsInterpretation,
          },
          {
            label: 'Watchlist Volatility',
            value: '0%', // TODO: Calculate from watchlist
            delta: 0,
            trendData: Array.from({ length: 7 }, () => Math.floor(Math.random() * 25) + 10),
            interpretation: 'Stable',
          },
        ]);
      } catch (error) {
        console.error('Error loading KPIs:', error);
        // Fallback to placeholder data
        setKpis([
          {
            label: 'Events (24h)',
            value: '0',
            delta: 0,
            trendData: [10, 15, 12, 18, 20, 16, 14],
            interpretation: 'Normal activity',
          },
          {
            label: 'Signals (24h)',
            value: '0',
            delta: 0,
            trendData: [5, 8, 6, 10, 12, 9, 7],
            interpretation: 'Normal activity',
          },
          {
            label: 'High-Impact Impacts (7d)',
            value: '0',
            delta: 0,
            trendData: [2, 3, 2, 4, 5, 3, 2],
            interpretation: 'Low risk',
          },
          {
            label: 'Watchlist Volatility',
            value: '0%',
            delta: 0,
            trendData: [15, 18, 16, 20, 22, 19, 17],
            interpretation: 'Stable',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadKPIs();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-background-glass-subtle rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {kpis.map((kpi, index) => (
        <KPIStatCard key={index} data={kpi} />
      ))}
    </div>
  );
}
