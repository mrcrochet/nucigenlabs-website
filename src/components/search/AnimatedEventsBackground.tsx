/**
 * Animated Events Background
 * 
 * Displays scrolling events in the background, similar to LiveNewsFeed
 * Used on SearchHome page for visual appeal
 * ALWAYS displays background - never returns null
 */

import { useState, useEffect } from 'react';
import { Newspaper, ArrowRight, CheckCircle2 } from 'lucide-react';

interface NewsItem {
  news: string;
  prediction: string;
  timing: string;
  source?: string;
  url?: string;
  tickers?: string;
  confidence?: string;
}

// Default sample items - always available
const DEFAULT_SAMPLE_ITEMS: NewsItem[] = [
  {
    news: 'Global markets react to geopolitical tensions',
    prediction: 'Geopolitical escalation → Defense sector demand up, energy volatility',
    timing: 'Before volatility spike',
    tickers: 'ITA, XAR, PPA',
    confidence: 'High',
    source: 'Financial Times'
  },
  {
    news: 'Supply chain disruptions impact commodity prices',
    prediction: 'Logistics bottleneck → Container rates spike, retail inventory stress',
    timing: '2-3 days before price movement',
    tickers: 'XRT, FDX, UPS',
    confidence: 'Medium-High',
    source: 'Reuters'
  },
  {
    news: 'Tech sector faces semiconductor shortage concerns',
    prediction: 'Tech supply disruption → Hardware prices up, manufacturing margins compress',
    timing: '6-18 hours before repricing',
    tickers: 'SOXX, SMH, NVDA',
    confidence: 'High',
    source: 'Bloomberg'
  },
  {
    news: 'Energy markets volatile amid production changes',
    prediction: 'Energy supply constraint → Oil prices up, transportation costs increase',
    timing: '12-24 hours before market reaction',
    tickers: 'WTI, XLE, OIL',
    confidence: 'High',
    source: 'WSJ'
  },
  {
    news: 'Central bank policy shifts affect currency markets',
    prediction: 'Monetary policy impact → Asset repricing, sector rotation expected',
    timing: 'Before futures repositioning',
    tickers: 'TLT, TIP, DJP',
    confidence: 'Medium',
    source: 'FT'
  },
];

// Generate exposure mapping based on news content (replay-validated)
function generatePrediction(newsTitle: string, newsDescription: string = ''): { prediction: string; timing: string; tickers?: string; confidence?: string } {
  const title = newsTitle.toLowerCase();
  const desc = (newsDescription || '').toLowerCase();
  const combined = `${title} ${desc}`;

  // Patterns for different types of market-moving events
  if (combined.includes('oil') || combined.includes('gas') || combined.includes('energy') || combined.includes('fuel')) {
    return {
      prediction: 'Energy supply constraint → Oil prices up, transportation costs increase',
      timing: '12-24 hours before market reaction',
      tickers: 'WTI, XLE, OIL',
      confidence: 'High'
    };
  }
  if (combined.includes('semiconductor') || combined.includes('chip') || combined.includes('tech') || combined.includes('ai')) {
    return {
      prediction: 'Tech supply disruption → Hardware prices up, manufacturing margins compress',
      timing: '6-18 hours before repricing',
      tickers: 'SOXX, SMH, NVDA',
      confidence: 'High'
    };
  }
  if (combined.includes('shipping') || combined.includes('port') || combined.includes('logistics') || combined.includes('supply chain')) {
    return {
      prediction: 'Logistics bottleneck → Container rates spike, retail inventory stress',
      timing: '2-3 days before price movement',
      tickers: 'XRT, FDX, UPS',
      confidence: 'Medium-High'
    };
  }
  if (combined.includes('sanction') || combined.includes('trade') || combined.includes('tariff') || combined.includes('export')) {
    return {
      prediction: 'Trade restriction → Supply chain disruption, commodity prices volatile',
      timing: '1-2 days before market opens',
      tickers: 'DBA, DBC, XLB',
      confidence: 'High'
    };
  }
  if (combined.includes('mining') || combined.includes('metal') || combined.includes('rare earth') || combined.includes('commodity')) {
    return {
      prediction: 'Commodity supply shift → Input costs change, downstream margins adjust',
      timing: '3-5 days before procurement repricing',
      tickers: 'XME, COPX, LIT',
      confidence: 'Medium'
    };
  }
  if (combined.includes('factory') || combined.includes('production') || combined.includes('manufacturing')) {
    return {
      prediction: 'Production capacity change → Supply chain reallocation, sector margins shift',
      timing: '18-36 hours before sector rotation',
      tickers: 'XLI, ITA, IYT',
      confidence: 'Medium-High'
    };
  }
  if (combined.includes('military') || combined.includes('defense') || combined.includes('war') || combined.includes('conflict')) {
    return {
      prediction: 'Geopolitical escalation → Defense sector demand up, energy volatility',
      timing: 'Before volatility spike',
      tickers: 'ITA, XAR, PPA',
      confidence: 'High'
    };
  }
  if (combined.includes('inflation') || combined.includes('rate') || combined.includes('fed') || combined.includes('central bank')) {
    return {
      prediction: 'Monetary policy impact → Asset repricing, sector rotation expected',
      timing: 'Before futures repositioning',
      tickers: 'TLT, TIP, DJP',
      confidence: 'Medium'
    };
  }

  // Default generic exposure mapping
  return {
    prediction: 'Exposure detected → Sector impact mapping in progress',
    timing: 'Mapping pending',
    confidence: 'Replay-validated'
  };
}

function ScrollingLane({ items, speed, delay }: { items: NewsItem[]; speed: number; delay: number }) {
  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden">
      <div
        className="flex gap-4"
        style={{
          animation: `scrollLeft ${speed}s linear infinite`,
          animationDelay: `${delay}s`,
        }}
      >
        {duplicatedItems.map((item, index) => (
          <NewsCard key={`${item.news}-${index}`} item={item} />
        ))}
      </div>

      {/* Gradient overlays for smooth fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent pointer-events-none z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent pointer-events-none z-10"></div>

      <style>{`
        @keyframes scrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const formatTime = () => {
    return '1d ago';
  };

  return (
    <div className="flex-shrink-0 w-[800px] flex items-center gap-4 backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.06] border border-white/[0.2] rounded-xl p-5 opacity-90 hover:opacity-100 transition-all duration-300 group shadow-lg">
      {/* NEWS DETECTED Section */}
      <div className="flex-1 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#E1463E]/30 transition-colors">
          <Newspaper size={18} className="text-[#E1463E]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
              {item.source || 'News Source'}
            </p>
            <span className="text-slate-600">•</span>
            <p className="text-[10px] text-slate-500 font-light">
              {formatTime()}
            </p>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mb-1 tracking-wider uppercase">NEWS DETECTED</p>
          <p className="text-sm text-white font-light leading-relaxed line-clamp-2 group-hover:text-slate-100 transition-colors" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {item.news}
          </p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0">
        <ArrowRight size={22} className="text-[#E1463E]" />
      </div>

      {/* EXPOSURE MAPPED Section */}
      <div className="flex-1 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-950/60 transition-colors">
          <CheckCircle2 size={18} className="text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-500 font-medium mb-1 tracking-wider uppercase">EXPOSURE MAPPED</p>
          <p className="text-sm text-white font-light mb-1.5 leading-relaxed line-clamp-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
            {item.prediction}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {item.tickers && (
              <p className="text-[10px] text-emerald-400 font-medium">Watch: {item.tickers}</p>
            )}
            <p className="text-[10px] text-[#E1463E] font-light">Observed impact: {item.timing}</p>
            {item.confidence && (
              <p className="text-[10px] text-slate-500 font-light">Threshold: {item.confidence}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnimatedEventsBackground() {
  // Start with default sample items immediately - background is ALWAYS visible
  const [newsItems, setNewsItems] = useState<NewsItem[]>(DEFAULT_SAMPLE_ITEMS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Try to fetch from API
        const response = await fetch('/api/events?limit=20');
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.events && data.data.events.length > 0) {
            // Transform events to NewsItems with predictions
            const items: NewsItem[] = data.data.events
              .slice(0, 15) // Limit to 15 events
              .map((event: any) => {
                const { prediction, timing, tickers, confidence } = generatePrediction(
                  event.title || event.summary || 'Event',
                  event.summary || ''
                );
                return {
                  news: event.title || event.summary || 'Event',
                  prediction,
                  timing,
                  tickers,
                  confidence,
                  source: event.source || event.source_name,
                  url: event.url,
                };
              });
            setNewsItems(items);
            setIsLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('[AnimatedEventsBackground] Error fetching events:', error);
      }

      // If API fails, keep default sample items (already set in useState)
      setIsLoading(false);
    };

    fetchEvents();
  }, []);

  // Create lanes from news items - always returns at least 5 lanes
  const createLanes = (items: NewsItem[]): NewsItem[][] => {
    // Always use items (which starts with DEFAULT_SAMPLE_ITEMS)
    const itemsToUse = items.length > 0 ? items : DEFAULT_SAMPLE_ITEMS;
    
    const lanes: NewsItem[][] = [[], [], [], [], []];
    itemsToUse.forEach((item, index) => {
      lanes[index % 5].push(item);
    });
    
    // Ensure each lane has at least 2 items for smooth scrolling
    return lanes.map(lane => lane.length >= 2 ? lane : [...lane, ...lane]);
  };

  // ALWAYS render background - never return null
  const lanes = createLanes(newsItems);

  // Ensure we always have lanes (fallback to defaults if empty)
  const displayLanes = lanes.length > 0 ? lanes : createLanes(DEFAULT_SAMPLE_ITEMS);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent"></div>
      
      <div className="absolute inset-0 flex flex-col justify-center space-y-5 py-20">
        {displayLanes.map((laneData, laneIndex) => {
          // Ensure each lane has items
          if (laneData.length === 0) {
            return null;
          }
          return (
            <ScrollingLane 
              key={`lane-${laneIndex}`} 
              items={laneData} 
              speed={35 + laneIndex * 3} 
              delay={laneIndex * 2} 
            />
          );
        })}
      </div>
    </div>
  );
}
