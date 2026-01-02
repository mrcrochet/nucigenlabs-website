import { Clock, Heart, MoreVertical, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface IntelligenceItem {
  id: string;
  title: string;
  summary: string;
  timestamp: string;
  sources: number;
  level: 'Geopolitical' | 'Industrial' | 'Supply Chain' | 'Market';
  impact: 'Critical' | 'High' | 'Medium' | 'Low';
  imageUrl?: string;
}

interface IntelligenceFeedProps {
  items?: IntelligenceItem[];
  showFilters?: boolean;
}

export default function IntelligenceFeed({ items, showFilters = true }: IntelligenceFeedProps) {
  const [activeFilter, setActiveFilter] = useState<'Top' | 'Recent' | 'Critical'>('Top');
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Mock data
  const defaultItems: IntelligenceItem[] = [
    {
      id: '1',
      title: 'Taiwan Semiconductor Factory Closure',
      summary: 'Major TSMC facility halts operations due to power grid instability. Supply chain disruption expected across consumer electronics and automotive sectors within 12-24 hours.',
      timestamp: '2 hours ago',
      sources: 47,
      level: 'Industrial',
      impact: 'High',
    },
    {
      id: '2',
      title: 'New Sanctions on Russian Energy Exports',
      summary: 'EU announces expanded sanctions targeting refined petroleum products. Energy prices expected to adjust within 6-12 hours as markets price in reduced supply.',
      timestamp: '4 hours ago',
      sources: 62,
      level: 'Geopolitical',
      impact: 'Critical',
    },
    {
      id: '3',
      title: 'Shanghai Port Capacity Reduction',
      summary: 'Port authorities announce 30% capacity reduction due to infrastructure maintenance. Logistics delays expected to ripple through global supply chains within 24-48 hours.',
      timestamp: '6 hours ago',
      sources: 38,
      level: 'Supply Chain',
      impact: 'Medium',
    },
  ];

  const displayItems = items || defaultItems;

  const toggleLike = (id: string) => {
    setLikedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div>
      {showFilters && (
        <div className="flex items-center gap-2 mb-10">
          <button
            onClick={() => setActiveFilter('Top')}
            className={`px-4 py-2 rounded-xl text-sm font-light transition-all ${
              activeFilter === 'Top'
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            Top
          </button>
          <button
            onClick={() => setActiveFilter('Recent')}
            className={`px-4 py-2 rounded-xl text-sm font-light transition-all ${
              activeFilter === 'Recent'
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveFilter('Critical')}
            className={`px-4 py-2 rounded-xl text-sm font-light transition-all ${
              activeFilter === 'Critical'
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            Critical
          </button>
        </div>
      )}

      <div className="space-y-8">
        {displayItems.map((item, index) => (
          <article
            key={item.id}
            className="bg-white/[0.02] rounded-2xl p-8 hover:bg-white/[0.025] transition-all"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-light text-white mb-4 leading-snug">{item.title}</h3>
              <p className="text-base text-slate-500 font-light leading-relaxed">
                {item.summary}
              </p>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-white/[0.02]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-600 font-light">Published {item.timestamp}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-600 font-light">{item.sources} sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-3 py-1.5 bg-white/[0.03] rounded-lg text-slate-600">
                    {item.level}
                  </span>
                  <span
                    className={`text-xs px-3 py-1.5 rounded-lg font-light ${
                      item.impact === 'Critical'
                        ? 'bg-[#E1463E]/12 text-[#E1463E]'
                        : item.impact === 'High'
                        ? 'bg-orange-500/12 text-orange-500/70'
                        : item.impact === 'Medium'
                        ? 'bg-yellow-500/12 text-yellow-500/70'
                        : 'bg-slate-500/12 text-slate-500/70'
                    }`}
                  >
                    {item.impact}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleLike(item.id)}
                  className={`p-2 rounded-xl transition-all ${
                    likedItems.has(item.id)
                      ? 'text-[#E1463E] bg-[#E1463E]/10'
                      : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedItems.has(item.id) ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 rounded-xl text-slate-600 hover:text-white hover:bg-white/[0.02] transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

