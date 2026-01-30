/**
 * AssetTable - Asset table (watchlist)
 * Loads symbols from GET /api/watchlists when user is logged in; otherwise default list.
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Sparkline from '../charts/Sparkline';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { apiUrl } from '../../lib/api-base';

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  sparkline: number[];
}

interface AssetTableProps {
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
}

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];

export default function AssetTable({ selectedSymbol, onSymbolSelect }: AssetTableProps) {
  const { user } = useUser();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        let symbols: Array<{ symbol: string; name: string }> = DEFAULT_SYMBOLS.map((s) => ({ symbol: s, name: `${s} Inc.` }));

        if (user?.id) {
          const res = await fetch(apiUrl(`/api/watchlists?userId=${encodeURIComponent(user.id)}`));
          const data = await res.json().catch(() => ({}));
          if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
            const fromWatchlist = data.data
              .filter((w: { entity_type?: string; entity_id?: string; entity_name?: string }) => w.entity_id && (w.entity_type === 'company' || w.entity_type === 'asset' || !w.entity_type))
              .map((w: { entity_id: string; entity_name?: string }) => ({ symbol: w.entity_id, name: w.entity_name || `${w.entity_id} Inc.` }));
            if (fromWatchlist.length > 0) symbols = fromWatchlist;
          }
        }

        const assetsData = await Promise.all(
          symbols.map(async ({ symbol, name: entityName }) => {
            try {
              const [priceResponse, tsResponse] = await Promise.all([
                fetch(apiUrl(`/api/market-data/${symbol}`)),
                fetch(apiUrl(`/api/market-data/${symbol}/timeseries?interval=1h&days=1`)),
              ]);

              let priceData: any = null;
              let sparkline: number[] = [];

              if (priceResponse.ok) {
                const priceResult = await priceResponse.json();
                if (priceResult.success && priceResult.data) priceData = priceResult.data;
              }
              if (tsResponse.ok) {
                const tsResult = await tsResponse.json();
                if (tsResult.success && tsResult.data?.values) {
                  sparkline = tsResult.data.values.map((point: any) => parseFloat(point.close || point.price || 0));
                }
              }

              if (priceData) {
                return {
                  symbol,
                  name: entityName,
                  price: parseFloat(priceData.price || priceData.close || 0),
                  change: parseFloat(priceData.change || 0),
                  changePercent: parseFloat(priceData.percent_change || 0),
                  volume: parseInt(priceData.volume || 0),
                  sparkline: sparkline.length > 0 ? sparkline : Array.from({ length: 10 }, () => Math.random() * 100),
                };
              }
            } catch (error) {
              console.warn(`Failed to fetch data for ${symbol}:`, error);
              return null;
            }
            return null;
          })
        );

        const validAssets = assetsData.filter((a): a is Asset => a !== null);
        setAssets(validAssets.length > 0 ? validAssets : [{
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 150.5,
          change: 2.5,
          changePercent: 1.69,
          volume: 50000000,
          sparkline: Array.from({ length: 10 }, () => 150 + Math.random() * 5),
        }]);
      } catch (error) {
        console.error('Error loading assets:', error);
        setAssets([{
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 150.5,
          change: 2.5,
          changePercent: 1.69,
          volume: 50000000,
          sparkline: Array.from({ length: 10 }, () => 150 + Math.random() * 5),
        }]);
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [user?.id]);

  return (
    <Card>
      <SectionHeader title="Watchlist" />
      
      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-borders-subtle">
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Symbol</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Name</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Price</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Change</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Volume</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Trend</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const isPositive = asset.change >= 0;
              const isSelected = asset.symbol === selectedSymbol;

              return (
                <tr
                  key={asset.symbol}
                  className={`border-b border-borders-subtle hover:bg-background-glass-subtle transition-colors cursor-pointer ${
                    isSelected ? 'bg-background-glass-medium' : ''
                  }`}
                  onClick={() => onSymbolSelect(asset.symbol)}
                >
                  <td className="py-3 px-4">
                    <Link
                      to={`/markets/${asset.symbol}`}
                      className="font-medium text-text-primary hover:text-primary-red transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {asset.symbol}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">{asset.name}</td>
                  <td className="py-3 px-4 text-sm font-medium text-text-primary">
                    ${asset.price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-text-secondary">
                    {(asset.volume / 1000000).toFixed(1)}M
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-24 h-8">
                      <Sparkline data={asset.sparkline} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
