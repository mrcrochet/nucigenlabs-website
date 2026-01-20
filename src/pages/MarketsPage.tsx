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
import CorrelationMatrix from '../components/markets/CorrelationMatrix';
import SignalHeatmap from '../components/markets/SignalHeatmap';
import AlphaSignalsPanel from '../components/alpha/AlphaSignalsPanel';
import FullscreenWrapper from '../components/ui/FullscreenWrapper';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';

function MarketsPageContent() {
  const { user } = useUser();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M' | '6M' | '1Y'>('1M');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']);

  // Update selectedSymbols when user selects from table
  useEffect(() => {
    if (!selectedSymbols.includes(selectedSymbol)) {
      setSelectedSymbols([...selectedSymbols, selectedSymbol]);
    }
  }, [selectedSymbol]);

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
        <FullscreenWrapper title={`${selectedSymbol} Price Chart`}>
          <MainMarketChart
            symbol={selectedSymbol}
            timeframe={timeframe}
          />
        </FullscreenWrapper>
      </div>
      <div className="col-span-1 sm:col-span-4 space-y-4">
        <AssetStatsCard symbol={selectedSymbol} />
        <RelatedEventsCard symbol={selectedSymbol} />
        <AlphaSignalsPanel 
          symbol={selectedSymbol}
          autoRefresh={true}
          refreshInterval={300}
        />
      </div>

      {/* Row 3: Multi-asset visualizations */}
      <div className="col-span-1 sm:col-span-6">
        <FullscreenWrapper title="Correlation Matrix">
          <CorrelationMatrix 
            symbols={selectedSymbols} 
            timeframe={timeframe}
          />
        </FullscreenWrapper>
      </div>
      <div className="col-span-1 sm:col-span-6">
        <FullscreenWrapper title="Signal Impact Heatmap">
          <SignalHeatmap symbols={selectedSymbols} />
        </FullscreenWrapper>
      </div>

      {/* Row 4: AssetTable */}
      <div className="col-span-1 sm:col-span-12">
        <FullscreenWrapper title="Asset Watchlist">
          <AssetTable
            selectedSymbol={selectedSymbol}
            onSymbolSelect={setSelectedSymbol}
          />
        </FullscreenWrapper>
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
