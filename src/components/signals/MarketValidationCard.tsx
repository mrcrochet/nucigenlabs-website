/**
 * MarketValidationCard - Market validation card
 * 
 * assets list + sparklines
 * correlation simple (optionnel)
 * note: "validation based on price/volume changes, not causality."
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Sparkline from '../charts/Sparkline';
import { Link } from 'react-router-dom';
import type { Signal } from '../../types/intelligence';

interface MarketValidationCardProps {
  signal: Signal;
}

export default function MarketValidationCard({ signal }: MarketValidationCardProps) {
  // Placeholder assets data
  const assets = [
    { symbol: 'AAPL', correlation: 0.75, sparkline: Array.from({ length: 10 }, () => Math.random() * 100) },
    { symbol: 'MSFT', correlation: 0.65, sparkline: Array.from({ length: 10 }, () => Math.random() * 100) },
  ];

  return (
    <Card>
      <SectionHeader title="Market Validation" />
      
      <div className="mt-4 space-y-4">
        {assets.map((asset) => (
          <div
            key={asset.symbol}
            className="flex items-center justify-between p-3 bg-background-glass-subtle rounded-lg"
          >
            <div className="flex-1">
              <Link
                to={`/markets/${asset.symbol}`}
                className="text-sm font-medium text-text-primary hover:text-primary-red transition-colors"
              >
                {asset.symbol}
              </Link>
              <p className="text-xs text-text-tertiary mt-1">
                Correlation: {(asset.correlation * 100).toFixed(0)}%
              </p>
            </div>
            <div className="w-20 h-8">
              <Sparkline data={asset.sparkline} />
            </div>
          </div>
        ))}

        {assets.length === 0 && (
          <div className="text-sm text-text-secondary text-center py-4">
            No market data available
          </div>
        )}

        <div className="pt-4 border-t border-borders-subtle">
          <p className="text-xs text-text-tertiary italic">
            Validation based on price/volume changes, not causality.
          </p>
        </div>
      </div>
    </Card>
  );
}
