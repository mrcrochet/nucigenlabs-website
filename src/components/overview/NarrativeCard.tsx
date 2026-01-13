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
  bullets: string[];
  linkedEvents: Array<{ id: string; headline: string }>;
  linkedTickers: Array<{ symbol: string; name: string }>;
  linkedSignal: { id: string; title: string } | null;
}

export default function NarrativeCard() {
  const [data, setData] = useState<NarrativeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from GET /overview/narrative?range=24h
    // Placeholder data
    setData({
      bullets: [
        'Multiple geopolitical events detected in key regions.',
        'Market volatility increased across commodities sector.',
        'Supply chain disruptions reported in multiple sectors.',
      ],
      linkedEvents: [
        { id: '1', headline: 'Event 1' },
        { id: '2', headline: 'Event 2' },
        { id: '3', headline: 'Event 3' },
      ],
      linkedTickers: [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corp.' },
      ],
      linkedSignal: { id: '1', title: 'Signal Title' },
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="h-48 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <div className="text-text-secondary text-sm">No narrative available</div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Today's Narrative" />
      
      <div className="space-y-3 mt-4">
        {data.bullets.map((bullet, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-text-secondary mt-1">•</span>
            <p className="text-sm text-text-primary flex-1">{bullet}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-borders-subtle">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-text-secondary mr-2">Events:</span>
            {data.linkedEvents.map((event, idx) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="text-primary-red hover:text-primary-redHover mr-2"
              >
                {event.headline}
                {idx < data.linkedEvents.length - 1 && ','}
              </Link>
            ))}
          </div>
          <div>
            <span className="text-text-secondary mr-2">Tickers:</span>
            {data.linkedTickers.map((ticker, idx) => (
              <Link
                key={ticker.symbol}
                to={`/markets/${ticker.symbol}`}
                className="text-primary-red hover:text-primary-redHover mr-2"
              >
                {ticker.symbol}
                {idx < data.linkedTickers.length - 1 && ','}
              </Link>
            ))}
          </div>
          {data.linkedSignal && (
            <div>
              <span className="text-text-secondary mr-2">Signal:</span>
              <Link
                to={`/signals/${data.linkedSignal.id}`}
                className="text-primary-red hover:text-primary-redHover"
              >
                {data.linkedSignal.title}
              </Link>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
