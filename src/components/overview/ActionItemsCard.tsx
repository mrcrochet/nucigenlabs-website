/**
 * ActionItemsCard - 3 Decision Points clairs
 * 
 * NEW ARCHITECTURE: Command Center component
 * Shows clear action items: Monitor, Prepare, Act
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { AlertCircle, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { getSignalsFromEvents, getOrCreateSupabaseUserId } from '../../lib/supabase';

interface ActionItem {
  id: string;
  type: 'monitor' | 'prepare' | 'act';
  title: string;
  description: string;
  why?: string; // WHY - 1 line explanation
  source?: 'signal' | 'event' | 'scenario'; // SOURCE type
  sourceId?: string; // SOURCE ID
  sourceTitle?: string; // SOURCE title for display
  priority: 'low' | 'medium' | 'high';
  relatedSignalId?: string;
  relatedEventId?: string;
  deadline?: string;
  roleContext?: string; // Role-based context (e.g., "For portfolio exposure", "For supply chain risk management")
}

export default function ActionItemsCard() {
  const { user } = useUser();
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDecisionPoints = async () => {
      try {
        setLoading(true);

        // Fetch decision points from API (top 3, ordered by priority)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/decision-points?limit=3&status=pending', {
          headers: {
            'x-clerk-user-id': user?.id || '',
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data && data.data.length > 0) {
            // Get user ID for fetching signal/event details
            const userId = user ? await getOrCreateSupabaseUserId(user.id) : undefined;
            
            // Fetch all signals to get titles
            const allSignals = await getSignalsFromEvents({ limit: 1000 }, userId);
            
            // Sort by priority (high > medium > low) then by created_at
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const sortedData = [...data.data].sort((a: any, b: any) => {
              const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                                   (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
              if (priorityDiff !== 0) return priorityDiff;
              return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            });
            
            // Map API response to ActionItem format
            const mappedItems: ActionItem[] = await Promise.all(
              sortedData.slice(0, 3).map(async (dp: any) => {
                // Determine source type and fetch title
                let source: 'signal' | 'event' | 'scenario' | undefined;
                let sourceId: string | undefined;
                let sourceTitle: string | undefined;
                
                if (dp.signal_id) {
                  source = 'signal';
                  sourceId = dp.signal_id;
                  const signal = allSignals.find((s: any) => s.id === dp.signal_id);
                  sourceTitle = signal?.title || 'Signal';
                } else if (dp.event_id) {
                  source = 'event';
                  sourceId = dp.event_id;
                  sourceTitle = 'Event'; // TODO: Fetch event title if needed
                } else if (dp.scenario_id) {
                  source = 'scenario';
                  sourceId = dp.scenario_id;
                  sourceTitle = 'Scenario'; // TODO: Fetch scenario title if needed
                }

                // Extract WHY from description or metadata
                const why = dp.metadata?.why || dp.description?.split('.')[0] || dp.description;
                
                // Extract role context from metadata or infer from signal/event
                let roleContext: string | undefined = dp.metadata?.role_context;
                if (!roleContext && source === 'signal') {
                  const signal = allSignals.find((s: any) => s.id === dp.signal_id);
                  if (signal) {
                    // Infer role context from signal scope
                    if (signal.scope === 'sectorial' || signal.scope === 'asset') {
                      roleContext = dp.type === 'act' ? 'For portfolio exposure' : dp.type === 'prepare' ? 'For capital allocation' : 'For policy monitoring';
                    } else if (signal.scope === 'regional' || signal.scope === 'global') {
                      roleContext = dp.type === 'act' ? 'For supply chain risk management' : dp.type === 'prepare' ? 'For operational readiness' : 'For strategic planning';
                    }
                  }
                }

                return {
                  id: dp.id,
                  type: dp.type as 'monitor' | 'prepare' | 'act',
                  title: dp.title,
                  description: dp.description,
                  why: why,
                  source: source,
                  sourceId: sourceId,
                  sourceTitle: sourceTitle,
                  priority: dp.priority as 'low' | 'medium' | 'high',
                  relatedSignalId: dp.signal_id,
                  relatedEventId: dp.event_id,
                  deadline: dp.deadline,
                  roleContext: roleContext,
                };
              })
            );

            setActionItems(mappedItems);
          } else {
            // Fallback to placeholder data if no decision points found
            setActionItems([
              {
                id: '1',
                type: 'act',
                title: 'Review supply chain exposure in Eastern Europe',
                description: 'Recent geopolitical events may impact logistics routes',
                why: 'Escalating geopolitical risks may disrupt logistics routes',
                source: 'signal',
                sourceId: 'signal-123',
                sourceTitle: 'Energy Market Volatility',
                priority: 'high',
                relatedSignalId: 'signal-123',
              },
              {
                id: '2',
                type: 'prepare',
                title: 'Monitor energy sector volatility',
                description: 'Price movements suggest increased market sensitivity',
                why: 'Price movements suggest increased market sensitivity',
                source: 'signal',
                sourceId: 'signal-456',
                sourceTitle: 'Energy Sector Analysis',
                priority: 'medium',
                relatedSignalId: 'signal-456',
              },
              {
                id: '3',
                type: 'monitor',
                title: 'Track regulatory changes in EU',
                description: 'New policy proposals may affect operations',
                why: 'New policy proposals may affect operations',
                source: 'event',
                sourceId: 'event-789',
                sourceTitle: 'EU Regulatory Update',
                priority: 'low',
                relatedEventId: 'event-789',
              },
            ]);
          }
        } else {
          // Fallback on API error
          throw new Error('Failed to fetch decision points');
        }
      } catch (error: any) {
        // Silently handle network errors - server not available
        if (error.name === 'AbortError' || error.name === 'TypeError' || error.message?.includes('fetch')) {
          console.debug('[ActionItemsCard] API server not available, using fallback data');
        } else {
          console.error('Error loading decision points:', error);
        }
        // Fallback to placeholder data on error
        setActionItems([
          {
            id: '1',
            type: 'act',
            title: 'Review supply chain exposure in Eastern Europe',
            description: 'Recent geopolitical events may impact logistics routes',
            why: 'Escalating geopolitical risks may disrupt logistics routes',
            source: 'signal',
            sourceId: 'signal-123',
            sourceTitle: 'Energy Market Volatility',
            priority: 'high',
            relatedSignalId: 'signal-123',
          },
          {
            id: '2',
            type: 'prepare',
            title: 'Monitor energy sector volatility',
            description: 'Price movements suggest increased market sensitivity',
            why: 'Price movements suggest increased market sensitivity',
            source: 'signal',
            sourceId: 'signal-456',
            sourceTitle: 'Energy Sector Analysis',
            priority: 'medium',
            relatedSignalId: 'signal-456',
          },
          {
            id: '3',
            type: 'monitor',
            title: 'Track regulatory changes in EU',
            description: 'New policy proposals may affect operations',
            why: 'New policy proposals may affect operations',
            source: 'event',
            sourceId: 'event-789',
            sourceTitle: 'EU Regulatory Update',
            priority: 'low',
            relatedEventId: 'event-789',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadDecisionPoints();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const getTypeIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'act':
        return <Zap className="w-4 h-4" />;
      case 'prepare':
        return <TrendingUp className="w-4 h-4" />;
      case 'monitor':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: ActionItem['type']) => {
    switch (type) {
      case 'act':
        return 'text-[#E1463E]';
      case 'prepare':
        return 'text-yellow-400';
      case 'monitor':
        return 'text-blue-400';
    }
  };

  const getTypeBadgeColor = (type: ActionItem['type']) => {
    switch (type) {
      case 'act':
        return 'bg-[#E1463E]/20 text-[#E1463E] border-[#E1463E]/30';
      case 'prepare':
        return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30';
      case 'monitor':
        return 'bg-blue-400/20 text-blue-400 border-blue-400/30';
    }
  };

  const getPriorityVariant = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'critical';
      case 'medium':
        return 'level';
      default:
        return 'neutral';
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
      <div className="mb-3">
        <SectionHeader title="Decision Points" subtitle="Recommended actions based on current signals" />
      </div>
      
      <div className="mt-4 space-y-3">
        {actionItems.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.15] rounded-xl p-6 max-w-md mx-auto">
              <div className="w-12 h-12 mx-auto mb-4 backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-sm font-semibold text-text-primary mb-2">No decision points right now</h4>
              <p className="text-xs text-text-secondary leading-relaxed mb-3">
                System is monitoring scenarios and signals for threshold breaches. Decision points appear when actionable exposure is detected.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-text-tertiary pt-3 border-t border-borders-subtle">
                <span>Monitoring active</span>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              </div>
            </div>
          </div>
        ) : (
          actionItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle hover:border-borders-medium transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 ${getTypeColor(item.type)}`}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-text-primary">
                        {item.title}
                      </h4>
                      <Badge variant={getPriorityVariant(item.priority)} className="text-xs">
                        {item.priority}
                      </Badge>
                    </div>
                    {item.roleContext && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                          {item.roleContext}
                        </span>
                      </div>
                    )}
                    {item.why && (
                      <p className="text-xs text-text-secondary italic leading-relaxed mb-2">
                        {item.why}
                      </p>
                    )}
                    <p className="text-xs text-text-secondary leading-relaxed mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.source && item.sourceTitle && (
                        <span className="text-xs text-text-tertiary">
                          🔗 {item.source === 'signal' ? 'Signal' : item.source === 'event' ? 'Event' : 'Scenario'}: {item.sourceTitle}
                        </span>
                      )}
                      {item.relatedSignalId && (
                        <Link
                          to={`/signals/${item.relatedSignalId}`}
                          className="text-xs text-[#E1463E] hover:text-[#E1463E]/80 flex items-center gap-1 transition-colors"
                        >
                          View Signal
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      {item.relatedEventId && (
                        <Link
                          to={`/events/${item.relatedEventId}`}
                          className="text-xs text-[#E1463E] hover:text-[#E1463E]/80 flex items-center gap-1 transition-colors"
                        >
                          View Event
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                <Badge className={`text-xs font-semibold capitalize border ${getTypeBadgeColor(item.type)}`}>
                  {item.type.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
