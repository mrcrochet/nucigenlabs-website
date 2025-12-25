import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export default function LiveNewsTicker() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const apiKey = import.meta.env.VITE_NEWS_API_KEY || '3f496fd50f0040f3a3ebdf569047834c';
        
        // Fetch top headlines about business, finance, technology, and politics
        // Note: NewsAPI has CORS restrictions in production
        const apiUrl = `https://newsapi.org/v2/top-headlines?category=business&language=en&pageSize=20&apiKey=${apiKey}`;
        
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
          // Filter out articles without titles or descriptions
          const validArticles = data.articles.filter(
            (article: NewsArticle) => article.title && article.description && !article.title.includes('[Removed]')
          );
          setArticles(validArticles.slice(0, 15)); // Take first 15 valid articles
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        // Fallback to sample news if API fails
        setArticles([
          {
            title: 'Global markets react to geopolitical tensions',
            description: 'Major indices show volatility as investors assess strategic implications',
            url: '#',
            publishedAt: new Date().toISOString(),
            source: { name: 'Financial Times' }
          },
          {
            title: 'Supply chain disruptions impact commodity prices',
            description: 'Shipping delays and logistics bottlenecks drive price movements',
            url: '#',
            publishedAt: new Date().toISOString(),
            source: { name: 'Reuters' }
          },
          {
            title: 'Technology sector faces regulatory changes',
            description: 'New policies expected to reshape market dynamics',
            url: '#',
            publishedAt: new Date().toISOString(),
            source: { name: 'Bloomberg' }
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (isLoading) {
    return (
      <section className="relative px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-sm text-slate-500 font-light">Loading news...</p>
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  // Duplicate articles for seamless scrolling
  const duplicatedArticles = [...articles, ...articles, ...articles];

  return (
    <section className="relative px-6 py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs text-slate-600 font-light tracking-[0.2em] mb-4 uppercase">
            Live Market Intelligence
          </p>
          <p className="text-sm text-slate-500 font-light italic">
            Real-time news that moves markets. Detected and analyzed by Nucigen Labs.
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="flex gap-4"
            style={{
              animation: 'scrollLeft 60s linear infinite',
            }}
          >
            {duplicatedArticles.map((article, index) => (
              <NewsCard key={`${article.url}-${index}`} article={article} />
            ))}
          </div>

          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0A0A0A] to-transparent pointer-events-none z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0A0A0A] to-transparent pointer-events-none z-10"></div>

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
      </div>
    </section>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 w-[400px] backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] hover:border-white/[0.15] rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-white/[0.05] group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#E1463E]/30 transition-colors">
          <Newspaper size={18} className="text-[#E1463E]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
              {article.source.name}
            </p>
            <span className="text-slate-600">•</span>
            <p className="text-[10px] text-slate-500 font-light">
              {formatTime(article.publishedAt)}
            </p>
          </div>
          <h4 className="text-sm text-white font-light mb-2 leading-snug line-clamp-2 group-hover:text-slate-200 transition-colors">
            {article.title}
          </h4>
          <p className="text-xs text-slate-400 font-light leading-relaxed line-clamp-2">
            {article.description}
          </p>
          <div className="flex items-center gap-1 mt-3 text-[#E1463E] opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-light">Read more</span>
            <ExternalLink size={12} />
          </div>
        </div>
      </div>
    </a>
  );
}

