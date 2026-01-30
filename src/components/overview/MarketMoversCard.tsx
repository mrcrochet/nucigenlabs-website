/**
 * MarketMoversCard - List 8 items
 * Data: GET /api/markets/movers?range=24h&limit=8
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Sparkline from '../charts/Sparkline';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { apiUrl } from '../../lib/api-base';

interface Mover {
  symbol: string;
  name: string;
  changePercent: number;
  volume: number;
  sparklineData: number[];
}

const FALLBACK_MOVERS: Mover[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', changePercent: 2.5, volume: 50000000, sparklineData: [150, 152, 151, 153, 155, 154, 153] },
  { symbol: 'MSFT', name: 'Microsoft Corp.', changePercent: -1.2, volume: 30000000, sparklineData: [300, 298, 299, 297, 296, 295, 294] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', changePercent: 3.1, volume: 20000000, sparklineData: [100, 102, 101, 103, 105, 104, 103] },
];

export default function MarketMoversCard() {
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const url = apiUrl('/api/markets/movers?range=24h&limit=8');
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        if (json?.success && Array.isArray(json.data?.movers)) {
          setMovers(
            json.data.movers.map((m: { symbol: string; name?: string; change_percent?: number; volume?: number; sparkline_data?: number[] }) => ({
              symbol: m.symbol,
              name: m.name ?? `${m.symbol} Inc.`,
              changePercent: Number(m.change_percent) || 0,
              volume: Number(m.volume) || 0,
              sparklineData: Array.isArray(m.sparkline_data) && m.sparkline_data.length > 0
                ? m.sparkline_data
                : Array.from({ length: 10 }, () => Math.random() * 100),
            }))
          );
        } else {
          setMovers(FALLBACK_MOVERS);
        }
      })
      .catch(() => {
        if (!cancelled) setMovers(FALLBACK_MOVERS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="h-96 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Market Movers (24h)" />
      
      <div className="mt-4 space-y-2">
        {movers.map((mover) => (
          <div
            key={mover.symbol}
            className="flex items-center justify-between p-3 bg-background-glass-subtle rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-text-primary">{mover.symbol}</span>
                <span className="text-xs text-text-tertiary truncate">{mover.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {mover.changePercent > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <span className={`text-sm ${mover.changePercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {mover.changePercent > 0 ? '+' : ''}{mover.changePercent.toFixed(2)}%
                </span>
                <span className="text-xs text-text-tertiary">
                  Vol: {(mover.volume / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
            <div className="w-16 h-8 ml-4">
              <Sparkline data={mover.sparklineData} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
