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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';
        const response = await fetch(`${API_BASE}/api/market-data/${symbol}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `Failed to fetch data: ${response.statusText}`;
          
          if (errorMessage.includes('TWELVEDATA_API_KEY') || errorMessage.includes('not configured')) {
            throw new Error('Twelve Data API key not configured');
          }
          
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch asset data');
        }
        
        if (result.data) {
          setPrice(parseFloat(result.data.price || result.data.close || 0));
          setChange(parseFloat(result.data.change || 0));
          setChangePercent(parseFloat(result.data.percent_change || result.data.change_percent || 0));
        } else {
          throw new Error('No data available for this symbol');
        }
      } catch (error: any) {
        console.error('Error loading asset header data:', error);
        setError(error.message || 'Failed to load asset data');
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
          ) : error ? (
            <div className="text-sm text-red-400">
              {error}
              {error.includes('API key') && (
                <span className="block text-xs text-text-secondary mt-1">
                  Check TWELVEDATA_SETUP.md
                </span>
              )}
            </div>
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
