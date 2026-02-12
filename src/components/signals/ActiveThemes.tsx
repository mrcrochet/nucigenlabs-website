/**
 * ActiveThemes - Thematic clustering pills
 *
 * Calls /api/intelligence/cluster and displays
 * 3-5 theme pills with horizontal scroll.
 * Click on a theme to filter the signal list.
 */

import { useState, useEffect } from 'react';
import { apiUrl } from '../../lib/api-base';
import type { EventWithChain } from '../../lib/supabase';

interface Cluster {
  id: string;
  name: string;
  count: number;
  strength: number;
  related_event_ids: string[];
}

interface ActiveThemesProps {
  events: EventWithChain[];
  activeTheme: string | null;
  onThemeSelect: (themeId: string | null) => void;
}

export default function ActiveThemes({ events, activeTheme, onThemeSelect }: ActiveThemesProps) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const fetchClusters = async () => {
      setLoading(true);
      try {
        const url = apiUrl('/api/intelligence/cluster');
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            events: events.slice(0, 50),
            maxClusters: 5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setClusters(Array.isArray(data.data) ? data.data : []);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch clusters:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, [events]);

  if (loading || clusters.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-xs text-slate-500 font-light mb-2 uppercase tracking-wider">Active Themes</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => onThemeSelect(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-light transition-all ${
            activeTheme === null
              ? 'bg-[#E1463E] text-white'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          All
        </button>
        {clusters.map((cluster) => (
          <button
            key={cluster.id || cluster.name}
            onClick={() => onThemeSelect(activeTheme === cluster.id ? null : cluster.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-light transition-all flex items-center gap-2 ${
              activeTheme === cluster.id
                ? 'bg-[#E1463E] text-white'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {cluster.name}
            <span className={`text-xs ${activeTheme === cluster.id ? 'text-white/70' : 'text-slate-600'}`}>
              {cluster.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
