/**
 * DecisionPointsCard Component
 * 
 * NEW ARCHITECTURE: Decision Points for Scenarios page
 * Shows clear action items: Monitor, Prepare, Act
 * 
 * This is THE page to convince a pro to pay
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { AlertCircle, TrendingUp, Zap, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';

interface DecisionPoint {
  id: string;
  type: 'monitor' | 'prepare' | 'act';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  relatedScenarioId?: string;
  relatedSignalId?: string;
  deadline?: string;
  status?: 'pending' | 'in-progress' | 'completed';
}

interface DecisionPointsCardProps {
  scenarioId?: string;
  signalId?: string;
}

export default function DecisionPointsCard({ scenarioId, signalId }: DecisionPointsCardProps) {
  const { user } = useUser();
  const [decisionPoints, setDecisionPoints] = useState<DecisionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDecisionPoints = async () => {
      try {
        setLoading(true);
        
        // Build query params
        const params = new URLSearchParams();
        if (scenarioId) params.append('scenario_id', scenarioId);
        if (signalId) params.append('signal_id', signalId);

        const response = await fetch(`/api/decision-points?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch decision points');
        }

        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Map API response to DecisionPoint interface
          const mappedPoints: DecisionPoint[] = data.data.map((dp: any) => ({
            id: dp.id,
            type: dp.type,
            title: dp.title,
            description: dp.description,
            priority: dp.priority,
            relatedScenarioId: dp.scenario_id,
            relatedSignalId: dp.signal_id,
            deadline: dp.deadline,
            status: dp.status || 'pending',
          }));
          setDecisionPoints(mappedPoints);
        } else {
          // Fallback to placeholder data if no decision points found
          setDecisionPoints([
            {
              id: '1',
              type: 'act',
              title: 'Review supply chain exposure in affected regions',
              description: 'Recent geopolitical events may impact logistics routes. Consider alternative suppliers.',
              priority: 'high',
              relatedScenarioId: scenarioId,
              relatedSignalId: signalId,
              status: 'pending',
            },
            {
              id: '2',
              type: 'prepare',
              title: 'Monitor energy sector volatility',
              description: 'Price movements suggest increased market sensitivity. Prepare hedging strategies.',
              priority: 'medium',
              relatedScenarioId: scenarioId,
              status: 'pending',
            },
            {
              id: '3',
              type: 'monitor',
              title: 'Track regulatory changes in EU',
              description: 'New policy proposals may affect operations. Stay informed on developments.',
              priority: 'low',
              relatedSignalId: signalId,
              status: 'pending',
            },
          ]);
        }
      } catch (error) {
        console.error('Error loading decision points:', error);
        // Keep empty array on error
        setDecisionPoints([]);
      } finally {
        setLoading(false);
      }
    };

    loadDecisionPoints();
  }, [scenarioId, signalId]);

  const getTypeIcon = (type: DecisionPoint['type']) => {
    switch (type) {
      case 'act':
        return <Zap className="w-4 h-4" />;
      case 'prepare':
        return <TrendingUp className="w-4 h-4" />;
      case 'monitor':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: DecisionPoint['type']) => {
    switch (type) {
      case 'act':
        return 'text-[#E1463E]';
      case 'prepare':
        return 'text-yellow-400';
      case 'monitor':
        return 'text-blue-400';
    }
  };

  const getPriorityVariant = (priority: DecisionPoint['priority']) => {
    switch (priority) {
      case 'high':
        return 'critical';
      case 'medium':
        return 'level';
      default:
        return 'neutral';
    }
  };

  const getStatusIcon = (status?: DecisionPoint['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
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
        {decisionPoints.length === 0 ? (
          <div className="text-center py-8 text-text-secondary text-sm">
            <p>No decision points for this scenario</p>
          </div>
        ) : (
          decisionPoints.map((point) => (
            <div
              key={point.id}
              className="p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle hover:border-borders-medium transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 ${getTypeColor(point.type)}`}>
                    {getTypeIcon(point.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-text-primary">
                        {point.title}
                      </h4>
                      <Badge variant={getPriorityVariant(point.priority)} className="text-xs">
                        {point.priority}
                      </Badge>
                      {point.status && getStatusIcon(point.status)}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed mb-2">
                      {point.description}
                    </p>
                    <div className="flex items-center gap-3">
                      {point.relatedSignalId && (
                        <Link
                          to={`/signals/${point.relatedSignalId}`}
                          className="text-xs text-[#E1463E] hover:text-[#E1463E]/80 flex items-center gap-1 transition-colors"
                        >
                          View Signal
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      {point.relatedScenarioId && (
                        <Link
                          to={`/scenarios/${point.relatedScenarioId}`}
                          className="text-xs text-[#E1463E] hover:text-[#E1463E]/80 flex items-center gap-1 transition-colors"
                        >
                          View Scenario
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                      {point.deadline && (
                        <span className="text-xs text-text-tertiary">
                          Deadline: {new Date(point.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="neutral" className="text-xs capitalize">
                  {point.type}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
