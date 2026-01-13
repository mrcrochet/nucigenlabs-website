/**
 * SignalPreviewDrawer - Preview drawer for signal
 * 
 * Shows:
 * - Description courte
 * - Liste 5 events clés
 * - Mini chart: "signal strength over time"
 * - Assets affected (sparklines)
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import Sparkline from '../charts/Sparkline';
import { X } from 'lucide-react';
import { getSignalsFromEvents, getNormalizedEventById } from '../../lib/supabase';
import type { Signal } from '../../types/intelligence';
import type { Event } from '../../types/intelligence';

interface SignalPreviewDrawerProps {
  signalId: string;
  onClose: () => void;
}

export default function SignalPreviewDrawer({ signalId, onClose }: SignalPreviewDrawerProps) {
  const [signal, setSignal] = useState<Signal | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSignal = async () => {
      try {
        // Find signal by ID
        const allSignals = await getSignalsFromEvents({});
        const foundSignal = allSignals.find(s => s.id === signalId);
        
        if (foundSignal) {
          setSignal(foundSignal);
          
          // Load related events
          if (foundSignal.related_event_ids && foundSignal.related_event_ids.length > 0) {
            const events = await Promise.all(
              foundSignal.related_event_ids.slice(0, 5).map(id => getNormalizedEventById(id))
            );
            setRelatedEvents(events);
          }
        }
      } catch (error) {
        console.error('Error loading signal preview:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSignal();
  }, [signalId]);

  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-background-overlay backdrop-blur-xl border-l border-borders-subtle z-50 overflow-y-auto">
        <div className="p-6">
          <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
        </div>
      </div>
    );
  }

  if (!signal) {
    return null;
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background-overlay backdrop-blur-xl border-l border-borders-subtle z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Signal Preview</h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Card>
          <h3 className="text-lg font-medium text-text-primary mb-2">{signal.title}</h3>
          <p className="text-sm text-text-secondary mb-4">{signal.summary}</p>
          
          <div className="flex items-center gap-4 mb-4">
            <Badge variant="neutral">Strength: {signal.impact_score || 0}%</Badge>
            <Badge variant="neutral">Confidence: {signal.confidence_score || 0}%</Badge>
          </div>

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <div className="mt-6">
              <SectionHeader title="Key Events" />
              <div className="mt-4 space-y-2">
                {relatedEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block p-2 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
                  >
                    <p className="text-sm text-text-primary line-clamp-2">{event.headline}</p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Signal Strength Over Time (placeholder) */}
          <div className="mt-6">
            <SectionHeader title="Signal Strength Over Time" />
            <div className="mt-4 h-16">
              <Sparkline
                data={Array.from({ length: 10 }, () => Math.random() * 100)}
                width={300}
                height={60}
              />
            </div>
          </div>

          {/* Assets Affected (placeholder) */}
          <div className="mt-6">
            <SectionHeader title="Assets Affected" />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-2 bg-background-glass-subtle rounded-lg">
                <span className="text-sm text-text-primary">AAPL</span>
                <div className="w-24 h-6">
                  <Sparkline data={Array.from({ length: 10 }, () => Math.random() * 100)} />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
