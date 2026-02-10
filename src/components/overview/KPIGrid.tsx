/**
 * KPIGrid - KPI cards from Overview API (nucigen_events)
 * Cards: Total events, High impact, Top region, Top sector, Avg impact, Avg confidence
 */

import { useState, useEffect } from 'react';
import type { KPIData } from '../ui/KPIStatCard';
import { getOverviewKpis } from '../../lib/api/overview-kpi-api';

export interface KPIGridProps {
  dateRange?: '24h' | '7d' | '30d';
}

export default function KPIGrid({ dateRange = '24h' }: KPIGridProps) {
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOverviewKpis({ dateRange })
      .then((data) => {
        if (cancelled) return;
        setKpis([
          { label: `Events (${dateRange})`, value: data.total_events },
          { label: 'High impact (≥0.75)', value: data.high_impact_events },
          { label: 'Top region', value: data.top_region ?? '—' },
          { label: 'Top sector', value: data.top_sector ?? '—' },
          { label: 'Avg impact score', value: data.avg_impact_score.toFixed(2) },
          { label: 'Avg confidence', value: data.avg_confidence.toFixed(2) },
        ]);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load KPIs');
        setKpis([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-[11px] text-zinc-500 uppercase tracking-wider">
        {error}
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <div className="p-3 text-[11px] text-zinc-500 uppercase tracking-wider">
        No data
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
        >
          <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest truncate">
            {kpi.label}
          </p>
          <p className="text-[13px] font-semibold text-zinc-200 mt-0.5 tabular-nums">
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}
