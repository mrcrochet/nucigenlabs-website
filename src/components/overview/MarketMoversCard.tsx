/**
 * MarketMoversCard - List 8 items
 * symbol, % change, sparkline, volume
 * 
 * Data: GET /markets/movers?range=24h
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Sparkline from '../charts/Sparkline';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Mover {
  symbol: string;
  name: string;
  changePercent: number;
  volume: number;
  sparklineData: number[];
}

export default function MarketMoversCard() {
  const [movers, setMovers] = useState<Mover[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMovers = async () => {
      try {
        // TODO: Create dedicated endpoint for market movers
        // For now, fetch data for common symbols
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        
        const moversData = await Promise.all(
          symbols.map(async (symbol) => {
            try {
              const response = await fetch(`${API_BASE}/api/market-data/${symbol}`);
              if (!response.ok) throw new Error('Failed to fetch');
              
              const result = await response.json();
              if (result.success && result.data) {
                // Fetch timeseries for sparkline
                const tsResponse = await fetch(`${API_BASE}/api/market-data/${symbol}/timeseries?interval=1h&days=1`);
                let sparklineData: number[] = [];
                
                if (tsResponse.ok) {
                  const tsResult = await tsResponse.json();
                  if (tsResult.success && tsResult.data && tsResult.data.values) {
                    sparklineData = tsResult.data.values.map((point: any) => 
                      parseFloat(point.close || point.price || 0)
                    );
                  }
                }
                
                return {
                  symbol,
                  name: `${symbol} Inc.`, // TODO: Get real name from API
                  changePercent: parseFloat(result.data.percent_change || 0),
                  volume: parseInt(result.data.volume || 0),
                  sparklineData: sparklineData.length > 0 ? sparklineData : Array.from({ length: 10 }, () => Math.random() * 100),
                };
              }
            } catch (error) {
              console.warn(`Failed to fetch data for ${symbol}:`, error);
              return null;
            }
            return null;
          })
        );

        const validMovers = moversData.filter((m): m is NonNullable<typeof m> => m !== null);
        setMovers(validMovers.slice(0, 8));
      } catch (error) {
        console.error('Error loading market movers:', error);
        // Fallback to placeholder
        setMovers([
          { symbol: 'AAPL', name: 'Apple Inc.', changePercent: 2.5, volume: 50000000, sparklineData: [150, 152, 151, 153, 155, 154, 153] },
          { symbol: 'MSFT', name: 'Microsoft Corp.', changePercent: -1.2, volume: 30000000, sparklineData: [300, 298, 299, 297, 296, 295, 294] },
          { symbol: 'GOOGL', name: 'Alphabet Inc.', changePercent: 3.1, volume: 20000000, sparklineData: [100, 102, 101, 103, 105, 104, 103] },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadMovers();
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
