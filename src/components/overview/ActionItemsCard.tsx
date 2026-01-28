/**
 * ActionItemsCard - 3 Decision Points clairs
 * 
 * NEW ARCHITECTURE: Command Center component
 * Shows clear action items: Monitor, Prepare, Act
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';

interface ActionItem {
  id: string;
  type: 'monitor' | 'prepare' | 'act';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  relatedSignalId?: string;
  relatedEventId?: string;
  deadline?: string;
}

export default function ActionItemsCard() {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from API
    // For now, placeholder data
    setActionItems([
      {
        id: '1',
        type: 'act',
        title: 'Review supply chain exposure in Eastern Europe',
        description: 'Recent geopolitical events may impact logistics routes',
        priority: 'high',
        relatedSignalId: 'signal-123',
      },
      {
        id: '2',
        type: 'prepare',
        title: 'Monitor energy sector volatility',
        description: 'Price movements suggest increased market sensitivity',
        priority: 'medium',
        relatedSignalId: 'signal-456',
      },
      {
        id: '3',
        type: 'monitor',
        title: 'Track regulatory changes in EU',
        description: 'New policy proposals may affect operations',
        priority: 'low',
        relatedEventId: 'event-789',
      },
    ]);
    setLoading(false);
  }, []);

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
      <SectionHeader title="Decision Points" subtitle="What to do now" />
      
      <div className="mt-4 space-y-3">
        {actionItems.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm">
            <p>No action items at this time</p>
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
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-text-primary">
                        {item.title}
                      </h4>
                      <Badge variant={getPriorityVariant(item.priority)} className="text-xs">
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-2">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-3">
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
                <Badge variant="neutral" className="text-xs capitalize">
                  {item.type}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
