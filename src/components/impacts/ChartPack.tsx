/**
 * ChartPack - Chart pack for impact
 * 
 * Price trend
 * Volatility
 * Correlation vs benchmark
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import PriceChart from '../charts/PriceChart';
import VolatilityIndicator from '../charts/VolatilityIndicator';
import type { Impact } from '../../types/intelligence';

interface ChartPackProps {
  impact: Impact;
}

export default function ChartPack({ impact }: ChartPackProps) {
  // Placeholder data
  const priceData = Array.from({ length: 30 }, (_, i) => ({
    timestamp: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    price: 150 + Math.random() * 10,
  }));

  return (
    <Card>
      <SectionHeader title="Chart Pack" />
      
      <div className="mt-4 space-y-4">
        {/* Price Trend */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">Price Trend</h4>
          <div className="h-32">
            <PriceChart
              data={priceData}
              eventTimestamp={new Date().toISOString()}
              symbol="AAPL"
              timeframe="1M"
            />
          </div>
        </div>

        {/* Volatility */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">Volatility</h4>
          <VolatilityIndicator symbol="AAPL" timeframe="1M" />
        </div>

        {/* Correlation vs Benchmark (placeholder) */}
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">Correlation vs Benchmark</h4>
          <div className="h-16 flex items-center justify-center text-text-tertiary text-sm">
            Correlation chart placeholder
          </div>
        </div>
      </div>
    </Card>
  );
}
