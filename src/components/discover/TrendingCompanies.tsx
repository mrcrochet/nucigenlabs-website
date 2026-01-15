/**
 * TrendingCompanies Component
 * 
 * Displays trending stock companies
 * Similar to Perplexity's trending companies widget
 */

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

interface Company {
  symbol: string;
  name: string;
  price: string;
  changePercent: number;
}

export default function TrendingCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/trending-companies');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCompanies(data.data || []);
          }
        }
      } catch (error) {
        console.error('[TrendingCompanies] Error fetching data:', error);
        // Fallback to empty array
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCompanies, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && companies.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <h3 className="text-sm font-light text-white mb-4">Trending Companies</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <h3 className="text-sm font-light text-white mb-4">Trending Companies</h3>
      <div className="space-y-3">
        {companies.map((company) => (
          <div key={company.symbol} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-light truncate">{company.name}</div>
              <div className="text-[10px] text-slate-600 font-light">{company.symbol}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white font-light">{company.price}</div>
              <div className="text-xs text-green-400 font-light flex items-center gap-1 justify-end">
                <TrendingUp className="w-3 h-3" />
                <span>+{company.changePercent.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
