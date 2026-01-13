/**
 * KeyMetricsPanel - Key metrics panel
 */

import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import VolatilityIndicator from '../charts/VolatilityIndicator';
import VolumeBars from '../charts/VolumeBars';

interface KeyMetricsPanelProps {
  symbol: string;
}

export default function KeyMetricsPanel({ symbol }: KeyMetricsPanelProps) {
  // Placeholder volume data
  const volumeData = Array.from({ length: 10 }, (_, i) => ({
    timestamp: new Date(Date.now() - (9 - i) * 24 * 60 * 60 * 1000).toISOString(),
    volume: Math.floor(Math.random() * 10000000) + 10000000,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader title="Key Metrics" />
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Market Cap</span>
            <span className="text-sm font-medium text-text-primary">$2.5T</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">P/E Ratio</span>
            <span className="text-sm font-medium text-text-primary">28.5</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">52W High</span>
            <span className="text-sm font-medium text-text-primary">$180.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">52W Low</span>
            <span className="text-sm font-medium text-text-primary">$120.0</span>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Volatility" />
        <div className="mt-4">
          <VolatilityIndicator symbol={symbol} timeframe="1M" />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Volume" />
        <div className="mt-4">
          <VolumeBars data={volumeData} />
        </div>
      </Card>
    </div>
  );
}
