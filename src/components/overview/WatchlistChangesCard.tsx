/**
 * WatchlistChangesCard - Impacts sur MA watchlist
 * 
 * NEW ARCHITECTURE: Command Center component
 * Shows what changed for entities in user's watchlist
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Eye, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';

interface WatchlistChange {
  id: string;
  entityType: 'company' | 'country' | 'sector' | 'supply-chain';
  entityName: string;
  changeType: 'positive' | 'negative' | 'neutral';
  changeDescription: string;
  impactScore: number;
  relatedSignalId?: string;
  relatedEventId?: string;
}

export default function WatchlistChangesCard() {
  const { user } = useUser();
  const [changes, setChanges] = useState<WatchlistChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWatchlistChanges = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch watchlist changes analysis from API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/watchlists/changes?limit=5&hours_back=24', {
          headers: {
            'x-clerk-user-id': user.id,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('Failed to fetch watchlist changes');
        }

        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Map API response to WatchlistChange interface
          const mappedChanges: WatchlistChange[] = data.data.map((change: any) => ({
            id: change.id,
            entityType: change.entity_type,
            entityName: change.entity_name,
            changeType: change.change_type,
            changeDescription: change.change_description,
            impactScore: change.impact_score,
            relatedSignalId: change.related_signal_id,
            relatedEventId: change.related_event_id,
          }));
          setChanges(mappedChanges);
        } else {
          setChanges([]);
        }
      } catch (error: any) {
        // Silently handle network errors - server not available
        if (error.name === 'AbortError' || error.name === 'TypeError' || error.message?.includes('fetch')) {
          console.debug('[WatchlistChangesCard] API server not available');
        } else {
          console.error('Error loading watchlist changes:', error);
        }
        setChanges([]);
      } finally {
        setLoading(false);
      }
    };

    loadWatchlistChanges();
  }, [user?.id]);

  const getChangeIcon = (changeType: WatchlistChange['changeType']) => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-[#E1463E]" />;
      case 'neutral':
        return <Eye className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEntityTypeLabel = (type: WatchlistChange['entityType']) => {
    switch (type) {
      case 'company':
        return 'Company';
      case 'country':
        return 'Country';
      case 'sector':
        return 'Sector';
      case 'supply-chain':
        return 'Supply Chain';
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Watchlist Changes" subtitle="What changed for you" />
      
      <div className="mt-4 space-y-3">
        {changes.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm p-4 bg-background-glass-subtle rounded-lg">
            <Eye className="w-5 h-5 mx-auto mb-2 text-slate-400" />
            <p className="font-medium mb-1">No material changes detected</p>
            <p className="text-xs text-text-tertiary">in your watchlist in the last 24h</p>
          </div>
        ) : (
          changes.map((change) => (
            <div
              key={change.id}
              className="p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle hover:border-borders-medium transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3 flex-1">
                  {getChangeIcon(change.changeType)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-text-primary">
                        {change.entityName}
                      </h4>
                      <Badge variant="neutral" className="text-xs">
                        {getEntityTypeLabel(change.entityType)}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-2">
                      {change.changeDescription}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-tertiary">
                        Impact: {change.impactScore}/100
                      </span>
                      {change.relatedSignalId && (
                        <Link
                          to={`/signals/${change.relatedSignalId}`}
                          className="text-xs text-[#E1463E] hover:text-[#E1463E]/80 flex items-center gap-1 transition-colors"
                        >
                          View Signal
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      {change.relatedEventId && (
                        <Link
                          to={`/events/${change.relatedEventId}`}
                          className="text-xs text-[#E1463E] hover:text-[#E1463E]/80 flex items-center gap-1 transition-colors"
                        >
                          View Event
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
