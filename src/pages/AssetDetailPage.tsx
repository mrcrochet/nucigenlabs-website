/**
 * Asset Detail Page (markets/:symbol)
 * 
 * Purpose: See asset + "why it moves" + links to events/signals/impacts
 * 
 * Layout:
 * - Header (12): AssetHeader
 * - Row 2: Left (8): PriceChartWithMarkers | Right (4): KeyMetricsPanel
 * - Row 3: Left (6): RelatedEventsList | Right (6): ActiveSignalsList
 * - Row 4 (12): AttributionPanel (explanation moves)
 * 
 * AttributionPanel: temporal proximity, not "caused by"
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import AppShell from '../components/layout/AppShell';
import AssetHeader from '../components/markets/AssetHeader';
import PriceChartWithMarkers from '../components/markets/PriceChartWithMarkers';
import KeyMetricsPanel from '../components/markets/KeyMetricsPanel';
import RelatedEventsList from '../components/markets/RelatedEventsList';
import ActiveSignalsList from '../components/markets/ActiveSignalsList';
import AttributionPanel from '../components/markets/AttributionPanel';
import AlphaSignalsPanel from '../components/alpha/AlphaSignalsPanel';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import SkeletonCard from '../components/ui/SkeletonCard';

function AssetDetailContent() {
  const { symbol } = useParams<{ symbol: string }>();
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load asset data
    setLoading(false);
  }, [symbol]);

  if (loading) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 space-y-6">
          <SkeletonCard />
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-1 sm:col-span-8">
              <SkeletonCard />
            </div>
            <div className="col-span-1 sm:col-span-4">
              <SkeletonCard />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!symbol) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12">
          <div className="text-center py-12">
            <p className="text-text-primary mb-2">Symbol required</p>
            <button
              onClick={() => navigate('/markets')}
              className="px-4 py-2 bg-primary-red text-text-primary rounded-lg hover:bg-primary-redHover transition-colors"
            >
              Back to Markets
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO 
        title={`${symbol} — Nucigen`}
        description={`Market analysis for ${symbol}`}
      />

      {/* Header: AssetHeader */}
      <div className="col-span-1 sm:col-span-12">
        <AssetHeader symbol={symbol} />
      </div>

      {/* Row 2: Left (8) + Right (4) */}
      <div className="col-span-1 sm:col-span-8">
        <PriceChartWithMarkers symbol={symbol} />
      </div>
      <div className="col-span-1 sm:col-span-4 space-y-6">
        <KeyMetricsPanel symbol={symbol} />
        <AlphaSignalsPanel 
          symbol={symbol}
          autoRefresh={true}
          refreshInterval={300}
        />
      </div>

      {/* Row 3: Left (6) + Right (6) */}
      <div className="col-span-1 sm:col-span-6">
        <RelatedEventsList symbol={symbol} />
      </div>
      <div className="col-span-1 sm:col-span-6">
        <ActiveSignalsList symbol={symbol} />
      </div>

      {/* Row 4: AttributionPanel */}
      <div className="col-span-1 sm:col-span-12">
        <AttributionPanel symbol={symbol} />
      </div>
    </AppShell>
  );
}

export default function AssetDetailPage() {
  return (
    <ProtectedRoute>
      <AssetDetailContent />
    </ProtectedRoute>
  );
}
