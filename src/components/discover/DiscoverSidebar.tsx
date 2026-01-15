/**
 * DiscoverSidebar Component
 * 
 * Right sidebar with market outlook and trending companies
 * Similar to Perplexity's sidebar
 */

import MarketOutlook from './MarketOutlook';
import TrendingCompanies from './TrendingCompanies';

export default function DiscoverSidebar() {
  return (
    <div className="w-80 flex-shrink-0 space-y-6">
      <MarketOutlook />
      <TrendingCompanies />
    </div>
  );
}
