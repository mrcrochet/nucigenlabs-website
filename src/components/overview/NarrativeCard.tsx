/**
 * NarrativeCard - Today's narrative
 * 
 * Output: 3-5 bullet points max
 * Links: 3 events + 2 tickers + 1 signal
 * 
 * FORBIDDEN: predict here (stays "story of the present")
 * 
 * Data: GET /overview/narrative?range=24h
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';

interface NarrativeData {
  narrative: string;
  what_changed?: string;
  why_it_matters?: string;
  what_to_watch_next?: string;
  key_themes: string[];
  confidence_level: 'low' | 'medium' | 'high';
}

export default function NarrativeCard() {
  const [data, setData] = useState<NarrativeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    async function fetchNarrative() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/overview/narrative?timeframe=${timeframe}`, {
          headers: {
            'x-clerk-user-id': (window as any).Clerk?.user?.id || '',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch narrative');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'No narrative data');
        }
      } catch (err: any) {
        console.error('[NarrativeCard] Error:', err);
        setError(err.message || 'Failed to load narrative');
      } finally {
        setLoading(false);
      }
    }

    fetchNarrative();
  }, [timeframe]);

  if (loading) {
    return (
      <Card>
        <SectionHeader title="Today's Narrative" />
        <div className="h-48 animate-pulse bg-background-glass-subtle rounded-lg mt-4" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <SectionHeader title="Today's Narrative" />
        <div className="text-text-secondary text-sm mt-4">
          {error || 'No narrative available'}
        </div>
      </Card>
    );
  }

  const confidenceColor = {
    low: 'text-yellow-500',
    medium: 'text-blue-500',
    high: 'text-green-500',
  }[data.confidence_level];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Today's Narrative" />
        <div className="flex gap-2">
          <button
            onClick={() => setTimeframe('24h')}
            className={`px-3 py-1 text-xs rounded ${
              timeframe === '24h'
                ? 'bg-primary-red/20 text-primary-red'
                : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            24h
          </button>
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-3 py-1 text-xs rounded ${
              timeframe === '7d'
                ? 'bg-primary-red/20 text-primary-red'
                : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            7d
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1 text-xs rounded ${
              timeframe === '30d'
                ? 'bg-primary-red/20 text-primary-red'
                : 'bg-background-glass-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            30d
          </button>
        </div>
      </div>
      
      <div className="space-y-4 mt-4">
        {/* Executive Narrative Format */}
        {data.what_changed || data.why_it_matters || data.what_to_watch_next ? (
          <div className="space-y-4">
            {data.what_changed && (
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                  What Changed
                </h4>
                <p className="text-sm text-text-primary leading-relaxed">
                  {data.what_changed}
                </p>
              </div>
            )}
            {data.why_it_matters && (
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                  Why It Matters
                </h4>
                <p className="text-sm text-text-primary leading-relaxed">
                  {data.why_it_matters}
                </p>
              </div>
            )}
            {data.what_to_watch_next && (
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                  What to Watch Next
                </h4>
                <p className="text-sm text-text-primary leading-relaxed">
                  {data.what_to_watch_next}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Fallback to full narrative */
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">
            {data.narrative}
          </p>
        )}

        {data.key_themes && data.key_themes.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-borders-subtle">
            {data.key_themes.map((theme, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-background-glass-subtle rounded text-text-secondary"
              >
                {theme}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 text-xs text-text-secondary">
          <span>Confidence:</span>
          <span className={confidenceColor}>
            {data.confidence_level.toUpperCase()}
          </span>
        </div>
      </div>
    </Card>
  );
}
