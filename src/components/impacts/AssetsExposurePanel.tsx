/**
 * AssetsExposurePanel - Assets exposure panel
 */

import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import Sparkline from '../charts/Sparkline';
import type { Impact } from '../../types/intelligence';

interface AssetsExposurePanelProps {
  impact: Impact;
}

export default function AssetsExposurePanel({ impact }: AssetsExposurePanelProps) {
  const assets = impact.assets_exposure || [];

  return (
    <Card>
      <SectionHeader title="Assets Exposure" />
      
      <div className="mt-4 space-y-3">
        {assets.map((asset, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-background-glass-subtle rounded-lg"
          >
            <div className="flex-1">
              <span className="text-sm font-medium text-text-primary">
                {asset.symbol}
              </span>
              <div className="mt-1">
                <Badge
                  variant={
                    asset.exposure === 'high' ? 'critical' :
                    asset.exposure === 'medium' ? 'level' : 'neutral'
                  }
                >
                  {asset.exposure} exposure
                </Badge>
              </div>
            </div>
            {asset.sparkline_data && asset.sparkline_data.length > 0 && (
              <div className="w-20 h-8">
                <Sparkline data={asset.sparkline_data} />
              </div>
            )}
          </div>
        ))}

        {assets.length === 0 && (
          <div className="text-sm text-text-secondary text-center py-4">
            No assets exposure data
          </div>
        )}
      </div>
    </Card>
  );
}
