import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Factory, Ship, TrendingUp, ArrowRight, X, ExternalLink } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface LevelConfig {
  keywords: string[];
  icon: typeof Globe;
}

const levelConfig: Record<string, LevelConfig> = {
  geopolitical: {
    keywords: ['war', 'election', 'sanction', 'treaty', 'geopolitics', 'conflict', 'diplomacy', 'military', 'defense', 'russia', 'china', 'taiwan', 'ukraine', 'iran', 'north korea'],
    icon: Globe
  },
  industrial: {
    keywords: ['factory', 'mining', 'energy', 'production', 'manufacturing', 'industrial', 'plant', 'refinery', 'coal', 'oil', 'gas', 'steel', 'aluminum'],
    icon: Factory
  },
  'supply-chain': {
    keywords: ['port', 'logistics', 'shipping', 'transport', 'supply chain', 'trade route', 'container', 'cargo', 'freight', 'delivery', 'inventory'],
    icon: Ship
  },
  market: {
    keywords: ['stock', 'crypto', 'commodity', 'currency', 'market', 'trading', 'finance', 'bitcoin', 'ethereum', 'dollar', 'euro', 'yen', 'nasdaq', 'dow'],
    icon: TrendingUp
  }
};

async function fetchLevelNews(levelSlug: string): Promise<NewsArticle[]> {
  const config = levelConfig[levelSlug];
  if (!config) return [];

  try {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY || '3f496fd50f0040f3a3ebdf569047834c';
    const apiUrl = `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=50&apiKey=${apiKey}`;
    
    let response;
    try {
      response = await fetch(apiUrl);
    } catch (corsError) {
      console.warn('Direct API call failed, trying alternative method');
      response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`);
    }

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    let data = await response.json();
    if (data.contents) {
      data = JSON.parse(data.contents);
    }
    
    if (data.articles && data.articles.length > 0) {
      const filteredArticles = data.articles.filter((article: NewsArticle) => {
        if (!article.title || !article.description) return false;
        if (article.title.includes('[Removed]')) return false;
        
        const text = `${article.title} ${article.description}`.toLowerCase();
        return config.keywords.some(keyword => text.includes(keyword));
      });

      return filteredArticles.slice(0, 5); // Return top 5 for preview
    }
  } catch (error) {
    console.error('Error fetching news:', error);
  }
  
  return [];
}

export default function FourLevels() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredPropagation, setHoveredPropagation] = useState<number | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [newsData, setNewsData] = useState<Record<number, NewsArticle[]>>({});
  const [loadingNews, setLoadingNews] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const levels = [
    {
      number: '01',
      icon: Globe,
      title: 'Geopolitical Level',
      subtitle: 'State decisions that reshape access, risk, and capital flows',
      chains: [
        'Sanctions → Energy access restricted → Industrial cost shock',
        'Elections → Policy shift → Capital reallocation',
        'Treaties → Export controls → Supply realignment'
      ],
      metric: 'Active structural signals',
      metricValue: '847',
      color: 'from-red-500/10 to-red-500/5 border-red-900/30',
      iconColor: 'rgba(239, 68, 68, 0.2)',
      nextLevel: 1,
      slug: 'geopolitical'
    },
    {
      number: '02',
      icon: Factory,
      title: 'Industrial Level',
      subtitle: 'Production capacity under political and energy constraints',
      chains: [
        'Factory closures → Production gaps → Supply chain stress',
        'Energy shortages → Manufacturing delays → Cost inflation',
        'Mining disruptions → Material scarcity → Downstream repricing'
      ],
      metric: 'Facilities under constraint',
      metricValue: '1,203',
      color: 'from-orange-500/10 to-orange-500/5 border-orange-900/30',
      iconColor: 'rgba(245, 158, 11, 0.2)',
      nextLevel: 2,
      slug: 'industrial'
    },
    {
      number: '03',
      icon: Ship,
      title: 'Supply Chain Level',
      subtitle: 'Physical bottlenecks translating disruption into costs',
      chains: [
        'Port closures → Shipping delays → Inventory gaps',
        'Trade route changes → Cost increases → Margin compression',
        'Logistics bottlenecks → Inventory gaps → Price volatility'
      ],
      metric: 'Routes under stress',
      metricValue: '312',
      color: 'from-blue-500/10 to-blue-500/5 border-blue-900/30',
      iconColor: 'rgba(59, 130, 246, 0.2)',
      nextLevel: 3,
      slug: 'supply-chain'
    },
    {
      number: '04',
      icon: TrendingUp,
      title: 'Market Level',
      subtitle: 'Financial repricing once constraints become visible',
      chains: [
        'Supply disruptions → Price volatility → Sector rotation',
        'Demand shifts → Asset repricing → Portfolio reallocation',
        'Risk events → Market corrections → Liquidity shifts'
      ],
      metric: 'Markets exposed',
      metricValue: '47',
      color: 'from-green-500/10 to-green-500/5 border-green-900/30',
      iconColor: 'rgba(16, 185, 129, 0.2)',
      nextLevel: null,
      slug: 'market'
    }
  ];

  const handleCardHover = async (idx: number, slug: string, isEntering: boolean) => {
    if (isEntering) {
      // Flip to show news on hover
      setFlippedCards(prev => new Set(prev).add(idx));
      
      // Fetch news if not already loaded
      if (!newsData[idx] && !loadingNews[idx]) {
        setLoadingNews(prev => ({ ...prev, [idx]: true }));
        const news = await fetchLevelNews(slug);
        setNewsData(prev => ({ ...prev, [idx]: news }));
        setLoadingNews(prev => ({ ...prev, [idx]: false }));
      }
    } else {
      // Flip back when mouse leaves
      setFlippedCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(idx);
        return newSet;
      });
    }
  };

  return (
    <section className="relative px-6 py-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light mb-6 text-white">
            Every news moves markets at four levels.
          </h2>
          <p className="text-lg text-slate-300 font-light mb-4 max-w-3xl mx-auto">
            Nucigen Labs models how one decision propagates through four economic levers in real-time.
          </p>
          <p className="text-base text-slate-400 font-light italic max-w-2xl mx-auto mb-8">
            Markets react at the last level.<br />
            <span className="text-white">Nucigen operates across all four — in real time.</span>
          </p>
          
          {/* Directional indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <span className="text-xs text-slate-600 font-light tracking-wider uppercase">Upstream</span>
            <ArrowRight size={14} className="text-slate-600" />
            <span className="text-xs text-slate-600 font-light tracking-wider uppercase">Downstream</span>
            <span className="text-xs text-slate-700 font-light ml-4 italic">Shock propagates in sequence</span>
          </div>
        </div>

        {/* Dashboard-style Grid */}
        <div className="grid md:grid-cols-2 gap-6 relative">
          {levels.map((level, idx) => {
            const Icon = level.icon;
            const isHovered = hoveredIndex === idx;
            const isPropagationHovered = hoveredPropagation === idx;
            const hasNextLevel = level.nextLevel !== null;
            const isFlipped = flippedCards.has(idx);
            const news = newsData[idx] || [];
            const isLoading = loadingNews[idx];

            return (
              <div key={idx} className="relative group" style={{ perspective: '1000px' }}>
                {/* Propagation Arrow - Between cards */}
                {hasNextLevel && !isFlipped && (
                  <div 
                    className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 hidden md:block"
                    onMouseEnter={() => setHoveredPropagation(idx)}
                    onMouseLeave={() => setHoveredPropagation(null)}
                  >
                    <div className={`flex items-center gap-2 transition-all duration-500 ${
                      isPropagationHovered ? 'translate-x-2' : ''
                    }`}>
                      <div className={`w-10 h-0.5 bg-gradient-to-r transition-all duration-500 ${
                        isPropagationHovered 
                          ? 'from-[#E1463E] to-[#E1463E]/50 w-16' 
                          : 'from-white/30 to-transparent'
                      }`}></div>
                      <ArrowRight 
                        size={18} 
                        className={`transition-all duration-500 ${
                          isPropagationHovered 
                            ? 'text-[#E1463E] scale-125 drop-shadow-[0_0_8px_rgba(225,70,62,0.5)]' 
                            : 'text-white/40'
                        }`} 
                      />
                    </div>
                    <div className={`absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-light transition-all duration-500 ${
                      isPropagationHovered 
                        ? 'opacity-100 text-[#E1463E] translate-x-0' 
                        : 'opacity-0 text-slate-500 -translate-x-2'
                    }`}>
                      Propagates to → {levels[level.nextLevel!].title}
                    </div>
                  </div>
                )}

                {/* Card Container with 3D Flip */}
                <div
                  className="relative w-full h-full"
                  style={{
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* Front of Card */}
                  <div
                    onMouseEnter={() => {
                      setHoveredIndex(idx);
                      handleCardHover(idx, level.slug, true);
                    }}
                    onMouseLeave={() => {
                      setHoveredIndex(null);
                      handleCardHover(idx, level.slug, false);
                    }}
                    onClick={() => navigate(`/level/${level.slug}`)}
                    className={`backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border rounded-xl p-8 transition-all duration-300 cursor-pointer relative w-full ${
                      isHovered && !isFlipped
                        ? 'border-white/[0.25] -translate-y-1 shadow-lg shadow-[#E1463E]/10' 
                        : 'border-white/[0.12]'
                    }`}
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(0deg)'
                    }}
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`}
                    ></div>

                    <div className="relative z-10">
                      {/* Header Row - Dashboard Style */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Icon - Dashboard Style */}
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${level.iconColor}, transparent)`,
                              border: `1px solid ${level.iconColor.replace('0.2', '0.3')}`,
                            }}
                          >
                            <Icon size={24} className="text-white" />
                          </div>
                          
                          <div className="flex-1 pt-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-light text-white tracking-tight">{level.title}</h3>
                              {/* LIVE Badge */}
                              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#E1463E]/10 border border-[#E1463E]/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#E1463E] animate-pulse"></div>
                                <span className="text-[10px] text-[#E1463E] font-light tracking-wider uppercase">
                                  Live
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-400 font-light leading-relaxed">
                              {level.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Number - Dashboard Style */}
                        <div className="absolute top-6 right-6">
                          <span className="text-2xl font-extralight text-white/10 tracking-tight">{level.number}</span>
                        </div>
                      </div>

                      {/* Metric - Dashboard Style (Prominent) */}
                      <div className="mb-6 pb-6 border-b border-white/[0.08]">
                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl font-light text-white tracking-tight">{level.metricValue}</span>
                          <span className="text-xs text-slate-500 font-light tracking-wider uppercase">
                            {level.metric}
                          </span>
                        </div>
                      </div>

                      {/* Causal Chains - Dashboard List Style */}
                      <div className="space-y-3 mb-6">
                        {level.chains.map((chain, chainIdx) => (
                          <div key={chainIdx} className="flex items-start gap-3">
                            <div 
                              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                              style={{
                                background: level.iconColor.replace('0.2', '0.6'),
                                boxShadow: `0 0 6px ${level.iconColor}`,
                              }}
                            ></div>
                            <p className="text-sm text-slate-300 font-light leading-relaxed flex-1">
                              {chain}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Hover entry indicator */}
                      <div className={`transition-all duration-300 ${
                        isHovered && !isFlipped
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 translate-y-2 pointer-events-none'
                      }`}>
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-light pt-4 border-t border-white/[0.08]">
                          <span>Hover to view live intelligence →</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back of Card - News Preview */}
                  <div
                    onMouseEnter={() => {
                      setHoveredIndex(idx);
                      handleCardHover(idx, level.slug, true);
                    }}
                    onMouseLeave={() => {
                      setHoveredIndex(null);
                      handleCardHover(idx, level.slug, false);
                    }}
                    onClick={() => navigate(`/level/${level.slug}`)}
                    className={`absolute inset-0 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.12] rounded-xl p-8 cursor-pointer w-full h-full overflow-y-auto`}
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >

                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${level.iconColor}, transparent)`,
                            border: `1px solid ${level.iconColor.replace('0.2', '0.3')}`,
                          }}
                        >
                          <Icon size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-light text-white tracking-tight">{level.title}</h3>
                          <p className="text-xs text-slate-500 font-light">Live intelligence stream</p>
                        </div>
                      </div>
                    </div>

                    {/* News List */}
                    <div className="space-y-4">
                      {isLoading ? (
                        <div className="text-center py-8">
                          <div className="w-8 h-8 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
                          <p className="text-sm text-slate-500 font-light">Loading live signals...</p>
                        </div>
                      ) : news.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-slate-500 font-light">No signals detected at this level.</p>
                        </div>
                      ) : (
                        news.map((article, articleIdx) => (
                          <div
                            key={articleIdx}
                            className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-lg p-4 hover:border-white/[0.15] transition-all"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className="text-sm font-light text-white leading-snug flex-1">
                                {article.title}
                              </h4>
                              {article.url && article.url !== '#' && (
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-shrink-0 text-[#E1463E] hover:text-[#E1463E]/80 transition-colors"
                                  aria-label="Read full article"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              )}
                            </div>
                            {article.description && (
                              <p className="text-xs text-slate-400 font-light leading-relaxed mb-2 line-clamp-2">
                                {article.description}
                              </p>
                            )}
                            {article.source && (
                              <p className="text-[10px] text-slate-600 font-light">
                                {article.source.name}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* View Full Page Link */}
                    {news.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-white/[0.08]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/level/${level.slug}`);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#E1463E]/10 hover:bg-[#E1463E]/20 border border-[#E1463E]/20 rounded-lg text-[#E1463E] text-sm font-light transition-all"
                        >
                          <span>View full intelligence stream</span>
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                    
                    {/* Hover hint */}
                    <div className="mt-4 text-center">
                      <p className="text-xs text-slate-600 font-light">
                        Move mouse away to return
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom propagation chain indicator */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    hoveredIndex !== null || hoveredPropagation !== null
                      ? 'bg-[#E1463E]'
                      : 'bg-white/20'
                  }`}
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animation: hoveredIndex !== null || hoveredPropagation !== null
                      ? 'pulse 1.5s ease-in-out infinite'
                      : 'none'
                  }}
                ></div>
              ))}
            </div>
            <span className="text-xs text-slate-500 font-light tracking-wider">
              Real-time propagation chain
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
