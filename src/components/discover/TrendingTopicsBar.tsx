/**
 * TrendingTopicsBar — Horizontal scroller of trending topic pills.
 * Fetches from /api/discover/trending-topics. Click → sets search query.
 */

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import { apiUrl } from '../../lib/api-base';

interface Topic {
  name: string;
  count: number;
}

interface TrendingTopicsBarProps {
  onTopicClick: (topic: string) => void;
  className?: string;
}

export default function TrendingTopicsBar({ onTopicClick, className }: TrendingTopicsBarProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchTopics = async () => {
      try {
        const res = await fetch(apiUrl('/api/discover/trending-topics'));
        const data = await res.json();
        if (!cancelled && data.success && Array.isArray(data.topics)) {
          setTopics(data.topics);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTopics();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-slate-500 ${className ?? ''}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="font-light">Trending topics...</span>
      </div>
    );
  }

  if (topics.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="font-medium uppercase tracking-wider">Trending</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {topics.map((topic) => (
          <button
            key={topic.name}
            type="button"
            onClick={() => onTopicClick(topic.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-slate-300 font-light hover:bg-white/10 hover:text-white hover:border-white/20 transition-all whitespace-nowrap shrink-0"
          >
            {topic.name}
            {topic.count > 1 && (
              <span className="text-[10px] text-slate-500">{topic.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
