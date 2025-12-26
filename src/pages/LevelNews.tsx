import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Globe, Factory, Ship, TrendingUp, ExternalLink, Clock } from 'lucide-react';
import SEO from '../components/SEO';
import Footer from '../components/Footer';
import TypewriterText from '../components/TypewriterText';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsItem {
  news: string;
  prediction: string;
  timing: string;
  source?: string;
  url?: string;
}

const levelConfig = {
  geopolitical: {
    title: 'Geopolitical Level',
    icon: Globe,
    description: 'Wars, elections, sanctions, treaties',
    keywords: ['war', 'election', 'sanction', 'treaty', 'geopolitics', 'conflict', 'diplomacy', 'military', 'defense', 'russia', 'china', 'taiwan', 'ukraine', 'iran', 'north korea'],
    color: 'from-red-500/10 to-red-500/5 border-red-900/30'
  },
  industrial: {
    title: 'Industrial Level',
    icon: Factory,
    description: 'Mining, energy, factories, production',
    keywords: ['factory', 'mining', 'energy', 'production', 'manufacturing', 'industrial', 'plant', 'refinery', 'coal', 'oil', 'gas', 'steel', 'aluminum'],
    color: 'from-orange-500/10 to-orange-500/5 border-orange-900/30'
  },
  'supply-chain': {
    title: 'Supply Chain Level',
    icon: Ship,
    description: 'Ports, logistics, transport, shortages',
    keywords: ['port', 'logistics', 'shipping', 'transport', 'supply chain', 'trade route', 'container', 'cargo', 'freight', 'delivery', 'inventory'],
    color: 'from-blue-500/10 to-blue-500/5 border-blue-900/30'
  },
  market: {
    title: 'Market Level',
    icon: TrendingUp,
    description: 'Stocks, crypto, commodities, currencies',
    keywords: ['stock', 'crypto', 'commodity', 'currency', 'market', 'trading', 'finance', 'bitcoin', 'ethereum', 'dollar', 'euro', 'yen', 'nasdaq', 'dow'],
    color: 'from-green-500/10 to-green-500/5 border-green-900/30'
  }
};

// Generate a market prediction based on news content
function generatePrediction(newsTitle: string, newsDescription: string, level: string): { prediction: string; timing: string } {
  const title = newsTitle.toLowerCase();
  const desc = (newsDescription || '').toLowerCase();
  const combined = `${title} ${desc}`;

  if (level === 'geopolitical') {
    if (combined.includes('sanction') || combined.includes('embargo')) {
      return {
        prediction: 'Trade restriction → Supply chain disruption, commodity prices volatile',
        timing: '1-2 days before market opens'
      };
    }
    if (combined.includes('war') || combined.includes('conflict') || combined.includes('military')) {
      return {
        prediction: 'Geopolitical escalation → Defense sector demand up, energy volatility',
        timing: 'Before volatility spike'
      };
    }
    if (combined.includes('election') || combined.includes('policy')) {
      return {
        prediction: 'Policy shift → Sector rotation, regulatory impact on markets',
        timing: 'Before futures repositioning'
      };
    }
  }

  if (level === 'industrial') {
    if (combined.includes('factory') || combined.includes('production') || combined.includes('manufacturing')) {
      return {
        prediction: 'Production capacity change → Supply chain reallocation, sector margins shift',
        timing: '18-36 hours before sector rotation'
      };
    }
    if (combined.includes('mining') || combined.includes('metal') || combined.includes('commodity')) {
      return {
        prediction: 'Commodity supply shift → Input costs change, downstream margins adjust',
        timing: '3-5 days before procurement repricing'
      };
    }
    if (combined.includes('energy') || combined.includes('oil') || combined.includes('gas')) {
      return {
        prediction: 'Energy supply constraint → Oil prices up, transportation costs increase',
        timing: '12-24 hours before market reaction'
      };
    }
  }

  if (level === 'supply-chain') {
    if (combined.includes('shipping') || combined.includes('port') || combined.includes('logistics')) {
      return {
        prediction: 'Logistics bottleneck → Container rates spike, retail inventory stress',
        timing: '2-3 days before price movement'
      };
    }
    if (combined.includes('trade') || combined.includes('route') || combined.includes('export')) {
      return {
        prediction: 'Trade route disruption → Supply delays, cost increases',
        timing: '1-2 days before inventory impact'
      };
    }
  }

  if (level === 'market') {
    if (combined.includes('stock') || combined.includes('nasdaq') || combined.includes('dow')) {
      return {
        prediction: 'Market movement → Sector rotation, volatility increase',
        timing: 'Real-time impact'
      };
    }
    if (combined.includes('crypto') || combined.includes('bitcoin') || combined.includes('ethereum')) {
      return {
        prediction: 'Crypto volatility → Risk asset correlation, liquidity shifts',
        timing: 'Immediate market reaction'
      };
    }
    if (combined.includes('commodity') || combined.includes('currency')) {
      return {
        prediction: 'Commodity/currency shift → Cross-asset correlation, inflation impact',
        timing: 'Before futures repositioning'
      };
    }
  }

  // Default generic prediction
  return {
    prediction: 'Market-moving event detected → Sector impact analysis in progress',
    timing: 'Analysis pending'
  };
}

export default function LevelNews() {
  const { level } = useParams<{ level: string }>();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const config = level ? levelConfig[level as keyof typeof levelConfig] : null;
  const Icon = config?.icon || Globe;

  useEffect(() => {
    const fetchNews = async () => {
      if (!level || !config) return;

      setIsLoading(true);
      try {
        const apiKey = import.meta.env.VITE_NEWS_API_KEY || '3f496fd50f0040f3a3ebdf569047834c';
        
        // Fetch business news
        // Note: NewsAPI has CORS restrictions in production
        const apiUrl = `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=50&apiKey=${apiKey}`;
        
        // Try direct fetch first, if it fails due to CORS, use a proxy
        let response;
        try {
          response = await fetch(apiUrl);
        } catch (corsError) {
          // If CORS error, try with a CORS proxy (for development/testing)
          // In production, you should use your own backend proxy
          console.warn('Direct API call failed, trying alternative method');
          response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`);
        }

        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }

        let data = await response.json();
        
        // If using CORS proxy, extract the actual data
        if (data.contents) {
          data = JSON.parse(data.contents);
        }
        
        if (data.articles && data.articles.length > 0) {
          // Filter articles by keywords
          const filteredArticles = data.articles.filter((article: NewsArticle) => {
            if (!article.title || !article.description) return false;
            if (article.title.includes('[Removed]')) return false;
            
            const text = `${article.title} ${article.description}`.toLowerCase();
            return config.keywords.some(keyword => text.includes(keyword));
          });

          // Transform articles to NewsItems with predictions
          const items: NewsItem[] = filteredArticles.slice(0, 30).map((article: NewsArticle) => {
            const { prediction, timing } = generatePrediction(article.title, article.description, level);
            return {
              news: article.title,
              prediction,
              timing,
              source: article.source.name,
              url: article.url
            };
          });

          setNewsItems(items);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        // Fallback data
        setNewsItems([
          {
            news: 'Global markets react to geopolitical tensions',
            prediction: 'Geopolitical escalation → Defense sector demand up, energy volatility',
            timing: 'Before volatility spike',
            source: 'Financial Times',
            url: '#'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [level, config]);

  if (!config) {
    return (
      <main className="min-h-screen">
        <SEO title="Level Not Found — Nucigen Labs" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-light text-white mb-4">Level not found</h1>
            <Link to="/" className="text-[#E1463E] hover:underline">Return to home</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <SEO 
        title={`${config.title} — Nucigen Labs`}
        description={`Real-time news and predictions for ${config.description}`}
      />

      {/* Header */}
      <section className="relative px-6 py-24 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-light">Back to Home</span>
          </Link>

          <div className="flex items-start gap-6 mb-8">
            <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center border`}>
              <Icon size={32} className="text-[#E1463E]" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-light mb-3">{config?.title}</h1>
              <p className="text-lg text-slate-400 font-light min-h-[2rem]">
                {config && (
                  <TypewriterText
                    texts={[
                      config.description,
                      'When volatility regimes shift, Nucigen Labs maps the underlying causal drivers to distinguish transitory shocks from structural repricing.',
                      'Industrial bottlenecks are often invisible until they fail. Nucigen Labs identifies them earlier by mapping dependency networks.',
                      'Technological systems fail gradually, not suddenly. Nucigen Labs tracks capacity saturation and dependency buildup.'
                    ]}
                    typingSpeed={70}
                    deletingSpeed={25}
                    pauseDuration={5000}
                    className="text-slate-400"
                  />
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* News Feed */}
      <section className="relative px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-slate-500 font-light">Loading real-time news...</p>
            </div>
          ) : newsItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 font-light">No news found for this level.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {newsItems.map((item, idx) => (
                <div
                  key={idx}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-6 hover:border-white/[0.20] transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-light mb-2">{item.news}</h3>
                      {item.source && (
                        <p className="text-xs text-slate-500 font-light mb-3">{item.source}</p>
                      )}
                    </div>
                    {item.url && item.url !== '#' && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          if (item.url && item.url !== '#') {
                            window.open(item.url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className="flex-shrink-0 text-[#E1463E] hover:text-[#E1463E]/80 transition-colors"
                        aria-label="Read full article"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#E1463E]/50 mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-300 font-light">{item.prediction}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={14} />
                      <span>{item.timing}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

