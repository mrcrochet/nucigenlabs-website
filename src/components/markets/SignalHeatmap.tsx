/**
 * SignalHeatmap - Heatmap visualization showing signal impact across a basket of assets
 * Shows how different signals affect different assets in a portfolio
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { getSignalsFromEvents } from '../../lib/supabase';
import { fetchMarketPrice } from '../../lib/api/market-data-api';
import type { Signal } from '../../types/intelligence';
import { Loader2 } from 'lucide-react';

interface SignalHeatmapProps {
  symbols: string[];
  signalIds?: string[]; // Optional: filter specific signals
  className?: string;
}

interface HeatmapCell {
  signalId: string;
  signalTitle: string;
  symbol: string;
  impact: number; // 0-100, derived from signal impact_score and asset relevance
  change: number; // Price change % since signal
}

export default function SignalHeatmap({ 
  symbols, 
  signalIds,
  className = '' 
}: SignalHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHeatmapData = async () => {
      if (symbols.length === 0) {
        setHeatmapData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Load recent signals
        const recentSignals = await getSignalsFromEvents({ limit: 20 });
        const filteredSignals = signalIds
          ? recentSignals.filter((s) => signalIds.includes(s.id))
          : recentSignals.slice(0, 10); // Top 10 by default

        setSignals(filteredSignals);

        // For each signal-asset pair, calculate impact
        const cells: HeatmapCell[] = [];

        for (const signal of filteredSignals) {
          for (const symbol of symbols) {
            try {
              // Fetch current price
              const { data: priceData } = await fetchMarketPrice(symbol);
              
              // Calculate impact based on signal strength and asset relevance
              // This is a simplified calculation - in production, you'd use more sophisticated logic
              const baseImpact = signal.impact_score || 0;
              
              // Check if signal mentions this asset or related sector
              const signalText = `${signal.title} ${signal.summary || ''}`.toLowerCase();
              const symbolLower = symbol.toLowerCase();
              const relevance = signalText.includes(symbolLower) ? 1.0 : 0.3;

              const impact = Math.min(100, baseImpact * relevance);

              // For demo: simulate price change (in production, calculate from historical data)
              const change = impact > 50 ? (Math.random() * 5 - 2.5) : (Math.random() * 2 - 1);

              cells.push({
                signalId: signal.id,
                signalTitle: signal.title,
                symbol,
                impact,
                change,
              });
            } catch (err) {
              console.warn(`Failed to process ${symbol} for signal ${signal.id}:`, err);
            }
          }
        }

        setHeatmapData(cells);
      } catch (err: any) {
        setError(err.message || 'Failed to load heatmap data');
      } finally {
        setLoading(false);
      }
    };

    loadHeatmapData();
  }, [symbols, signalIds]);

  const getImpactColor = (impact: number): string => {
    if (impact >= 80) return 'bg-red-500/40 border-red-500/60';
    if (impact >= 60) return 'bg-orange-500/40 border-orange-500/60';
    if (impact >= 40) return 'bg-yellow-500/40 border-yellow-500/60';
    if (impact >= 20) return 'bg-blue-500/40 border-blue-500/60';
    return 'bg-slate-500/20 border-slate-500/40';
  };

  const getChangeColor = (change: number): string => {
    if (change > 2) return 'text-green-400';
    if (change > 0) return 'text-green-500/70';
    if (change < -2) return 'text-red-400';
    if (change < 0) return 'text-red-500/70';
    return 'text-text-secondary';
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="text-center py-8 text-text-secondary text-sm">
          {error}
        </div>
      </Card>
    );
  }

  if (symbols.length === 0 || signals.length === 0) {
    return (
      <Card className={className}>
        <div className="text-center py-8 text-text-secondary text-sm">
          Select assets and ensure signals are available
        </div>
      </Card>
    );
  }

  // Group cells by signal
  const cellsBySignal = signals.map((signal) => ({
    signal,
    cells: heatmapData.filter((cell) => cell.signalId === signal.id),
  }));

  return (
    <Card className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Signal Impact Heatmap</h3>
        <p className="text-sm text-text-secondary">
          Signal impact across selected assets
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-text-tertiary font-medium p-2 sticky left-0 bg-background-overlay z-10">
                  Signal
                </th>
                {symbols.map((symbol) => (
                  <th
                    key={symbol}
                    className="text-xs text-text-secondary font-medium p-2 text-center min-w-[100px]"
                  >
                    {symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cellsBySignal.map(({ signal, cells }) => (
                <tr key={signal.id} className="border-t border-borders-subtle">
                  <td className="text-xs text-text-secondary p-2 sticky left-0 bg-background-overlay z-10 max-w-[200px]">
                    <div className="truncate" title={signal.title}>
                      {signal.title}
                    </div>
                    <div className="text-text-tertiary text-[10px] mt-1">
                      Impact: {signal.impact_score || 0}%
                    </div>
                  </td>
                  {symbols.map((symbol) => {
                    const cell = cells.find((c) => c.symbol === symbol);
                    return (
                      <td key={symbol} className="p-1">
                        {cell ? (
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={`w-full h-12 rounded border flex flex-col items-center justify-center ${getImpactColor(
                                cell.impact
                              )}`}
                              title={`${signal.title} → ${symbol}: ${cell.impact.toFixed(0)}% impact`}
                            >
                              <span className="text-xs text-text-primary font-medium">
                                {cell.impact.toFixed(0)}%
                              </span>
                            </div>
                            <span className={`text-xs font-medium ${getChangeColor(cell.change)}`}>
                              {cell.change > 0 ? '+' : ''}
                              {cell.change.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-12 rounded bg-background-glass-subtle border border-borders-subtle flex items-center justify-center">
                            <span className="text-xs text-text-tertiary">—</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-text-tertiary flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/40 border border-red-500/60"></div>
          <span>High impact (≥80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/40 border border-yellow-500/60"></div>
          <span>Medium impact (40-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-500/20 border border-slate-500/40"></div>
          <span>Low impact (&lt;20%)</span>
        </div>
      </div>
    </Card>
  );
}
