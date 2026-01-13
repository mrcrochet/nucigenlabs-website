/**
 * Markets Page
 * 
 * Purpose: Offer market reading + explain moves by events
 * 
 * Layout:
 * - Row 1 (12): MarketHeader (search + timeframe)
 * - Row 2: Left (8): MainMarketChart | Right (4): AssetStatsCard + RelatedEventsCard
 * - Row 3 (12): AssetTable (watchlist)
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import AppShell from '../components/layout/AppShell';
import MarketHeader from '../components/markets/MarketHeader';
import MainMarketChart from '../components/markets/MainMarketChart';
import AssetStatsCard from '../components/markets/AssetStatsCard';
import RelatedEventsCard from '../components/markets/RelatedEventsCard';
import AssetTable from '../components/markets/AssetTable';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';

function MarketsPageContent() {
  const { user } = useUser();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M' | '6M' | '1Y'>('1M');

  return (
    <AppShell>
      <SEO 
        title="Markets — Nucigen"
        description="Market intelligence and analysis"
      />

      {/* Row 1: MarketHeader */}
      <div className="col-span-1 sm:col-span-12">
        <MarketHeader
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
      </div>

      {/* Row 2: Left (8) + Right (4) */}
      <div className="col-span-1 sm:col-span-8">
        <MainMarketChart
          symbol={selectedSymbol}
          timeframe={timeframe}
        />
      </div>
      <div className="col-span-1 sm:col-span-4 space-y-6">
        <AssetStatsCard symbol={selectedSymbol} />
        <RelatedEventsCard symbol={selectedSymbol} />
      </div>

      {/* Row 3: AssetTable */}
      <div className="col-span-1 sm:col-span-12">
        <AssetTable
          selectedSymbol={selectedSymbol}
          onSymbolSelect={setSelectedSymbol}
        />
      </div>
    </AppShell>
  );
}

export default function MarketsPage() {
  return (
    <ProtectedRoute>
      <MarketsPageContent />
    </ProtectedRoute>
  );
}
