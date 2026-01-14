/**
 * CorrelationMatrix - Correlation matrix visualization for multiple assets
 * Shows correlation coefficients between assets in a portfolio/basket
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { fetchMarketTimeSeries } from '../../lib/api/market-data-api';
import { Loader2 } from 'lucide-react';

interface CorrelationMatrixProps {
  symbols: string[];
  timeframe?: '1D' | '5D' | '1M' | '6M' | '1Y';
  className?: string;
}

interface CorrelationData {
  symbol1: string;
  symbol2: string;
  correlation: number;
}

export default function CorrelationMatrix({ 
  symbols, 
  timeframe = '1M',
  className = '' 
}: CorrelationMatrixProps) {
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateCorrelations = async () => {
      if (symbols.length < 2) {
        setCorrelations([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const daysMap: Record<typeof timeframe, number> = {
          '1D': 1,
          '5D': 5,
          '1M': 30,
          '6M': 180,
          '1Y': 365,
        };
        const days = daysMap[timeframe];

        // Fetch price data for all symbols
        const priceDataMap: Record<string, number[]> = {};
        
        await Promise.all(
          symbols.map(async (symbol) => {
            try {
              const { data, error: marketError } = await fetchMarketTimeSeries(symbol, {
                interval: '1h',
                days,
              });

              if (!marketError && data && data.values) {
                priceDataMap[symbol] = data.values.map((point: any) => 
                  parseFloat(point.close || point.price || 0)
                );
              }
            } catch (err) {
              console.warn(`Failed to fetch data for ${symbol}:`, err);
            }
          })
        );

        // Calculate correlations
        const correlationPairs: CorrelationData[] = [];
        
        for (let i = 0; i < symbols.length; i++) {
          for (let j = i + 1; j < symbols.length; j++) {
            const symbol1 = symbols[i];
            const symbol2 = symbols[j];
            const data1 = priceDataMap[symbol1];
            const data2 = priceDataMap[symbol2];

            if (data1 && data2 && data1.length > 0 && data2.length > 0) {
              const correlation = calculateCorrelation(data1, data2);
              correlationPairs.push({
                symbol1,
                symbol2,
                correlation: isNaN(correlation) ? 0 : correlation,
              });
            }
          }
        }

        setCorrelations(correlationPairs);
      } catch (err: any) {
        setError(err.message || 'Failed to calculate correlations');
      } finally {
        setLoading(false);
      }
    };

    calculateCorrelations();
  }, [symbols, timeframe]);

  const calculateCorrelation = (x: number[], y: number[]): number => {
    const minLength = Math.min(x.length, y.length);
    const xSlice = x.slice(-minLength);
    const ySlice = y.slice(-minLength);

    const n = minLength;
    const sumX = xSlice.reduce((a, b) => a + b, 0);
    const sumY = ySlice.reduce((a, b) => a + b, 0);
    const sumXY = xSlice.reduce((sum, xi, i) => sum + xi * ySlice[i], 0);
    const sumX2 = xSlice.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = ySlice.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  };

  const getCorrelationColor = (correlation: number): string => {
    if (correlation > 0.7) return 'bg-green-500/30 border-green-500/50';
    if (correlation > 0.3) return 'bg-yellow-500/30 border-yellow-500/50';
    if (correlation > -0.3) return 'bg-slate-500/30 border-slate-500/50';
    if (correlation > -0.7) return 'bg-orange-500/30 border-orange-500/50';
    return 'bg-red-500/30 border-red-500/50';
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

  if (symbols.length < 2) {
    return (
      <Card className={className}>
        <div className="text-center py-8 text-text-secondary text-sm">
          Select at least 2 assets to view correlations
        </div>
      </Card>
    );
  }

  // Create matrix grid
  const matrix: (number | null)[][] = [];
  for (let i = 0; i < symbols.length; i++) {
    const row: (number | null)[] = [];
    for (let j = 0; j < symbols.length; j++) {
      if (i === j) {
        row.push(1); // Perfect correlation with itself
      } else {
        const pair = correlations.find(
          (c) =>
            (c.symbol1 === symbols[i] && c.symbol2 === symbols[j]) ||
            (c.symbol1 === symbols[j] && c.symbol2 === symbols[i])
        );
        row.push(pair ? pair.correlation : null);
      }
    }
    matrix.push(row);
  }

  return (
    <Card className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Correlation Matrix</h3>
        <p className="text-sm text-text-secondary">Price correlation between assets ({timeframe})</p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-text-tertiary font-medium p-2"></th>
                {symbols.map((symbol) => (
                  <th
                    key={symbol}
                    className="text-xs text-text-secondary font-medium p-2 text-center min-w-[60px]"
                  >
                    {symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map((symbol, i) => (
                <tr key={symbol}>
                  <td className="text-xs text-text-secondary font-medium p-2 text-right">
                    {symbol}
                  </td>
                  {matrix[i].map((corr, j) => (
                    <td key={j} className="p-1">
                      {corr !== null ? (
                        <div
                          className={`w-full h-10 rounded border flex items-center justify-center ${getCorrelationColor(
                            corr
                          )}`}
                          title={`${symbol} vs ${symbols[j]}: ${(corr * 100).toFixed(1)}%`}
                        >
                          <span className="text-xs text-text-primary font-medium">
                            {(corr * 100).toFixed(0)}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-10 rounded bg-background-glass-subtle border border-borders-subtle flex items-center justify-center">
                          <span className="text-xs text-text-tertiary">—</span>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-text-tertiary">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50"></div>
          <span>High correlation (&gt;0.7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-500/30 border border-slate-500/50"></div>
          <span>Low correlation (-0.3 to 0.3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50"></div>
          <span>Negative correlation (&lt;-0.7)</span>
        </div>
      </div>
    </Card>
  );
}
