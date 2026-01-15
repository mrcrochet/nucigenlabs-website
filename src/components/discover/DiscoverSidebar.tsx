/**
 * DiscoverSidebar Component
 * 
 * Right sidebar with weather, market outlook, and trending companies
 * Similar to Perplexity's sidebar
 */

import WeatherWidget from './WeatherWidget';
import MarketOutlook from './MarketOutlook';
import TrendingCompanies from './TrendingCompanies';

export default function DiscoverSidebar() {
  return (
    <div className="w-80 flex-shrink-0 space-y-6">
      <WeatherWidget />
      <MarketOutlook />
      <TrendingCompanies />
    </div>
  );
}
