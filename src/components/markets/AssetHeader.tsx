/**
 * AssetHeader - Asset detail header
 */

import { useState, useEffect } from 'react';
import Badge from '../ui/Badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AssetHeaderProps {
  symbol: string;
}

export default function AssetHeader({ symbol }: AssetHeaderProps) {
  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [changePercent, setChangePercent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        const response = await fetch(`${API_BASE}/api/market-data/${symbol}`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setPrice(parseFloat(result.data.price || result.data.close || 0));
            setChange(parseFloat(result.data.change || 0));
            setChangePercent(parseFloat(result.data.percent_change || 0));
          }
        }
      } catch (error) {
        console.error('Error loading asset header data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol]);

  const isPositive = change >= 0;

  return (
    <div className="bg-background-glass-subtle border border-borders-subtle rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {symbol}
          </h1>
          {loading ? (
            <div className="h-8 w-48 bg-background-glass-subtle rounded animate-pulse" />
          ) : (
            <div className={`flex items-center gap-2 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="text-xl font-semibold">
                ${price.toFixed(2)}
              </span>
              <span className="text-lg">
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral">Active</Badge>
        </div>
      </div>
    </div>
  );
}
