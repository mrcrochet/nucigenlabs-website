/**
 * Prediction Page
 * 
 * Premium UI for Nucigen Prediction Engine
 * Displays scenario outlooks with probabilities, evidence, and watch indicators
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import Card from '../components/ui/Card';
import SkeletonCard from '../components/ui/SkeletonCard';
import EventHeader from '../components/prediction/EventHeader';
import ProbabilityOverview from '../components/prediction/ProbabilityOverview';
import ScenarioCard from '../components/prediction/ScenarioCard';
import WatchIndicators from '../components/prediction/WatchIndicators';
import MethodologySection from '../components/prediction/MethodologySection';
import ExportPDF from '../components/prediction/ExportPDF';
import ScenarioTimeline from '../components/prediction/ScenarioTimeline';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { EventPrediction, PredictionResponse } from '../types/prediction';

export default function PredictionPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  
  const [prediction, setPrediction] = useState<EventPrediction | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setError('Event ID required');
      setLoading(false);
      return;
    }

    loadPrediction();
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      // Try to load event data for header
      const { getNormalizedEventById } = await import('../lib/supabase');
      const event = await getNormalizedEventById(eventId!);
      setEventData(event);
    } catch (err) {
      console.error('Error loading event data:', err);
      // Continue without event data
    }
  };

  const loadPrediction = async (forceRefresh = false) => {
    if (!eventId) return;

    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const tier = 'standard'; // Can be made configurable
      const url = forceRefresh
        ? `/api/events/${eventId}/predictions`
        : `/api/events/${eventId}/predictions?tier=${tier}`;

      const method = forceRefresh ? 'POST' : 'GET';
      const body = forceRefresh ? JSON.stringify({ tier, force_refresh: true }) : undefined;

      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body,
      });

      if (!response.ok) {
        throw new Error(`Failed to load prediction: ${response.status}`);
      }

      const data: PredictionResponse = await response.json();

      if (!data.success || !data.prediction) {
        throw new Error(data.error || 'Failed to generate prediction');
      }

      setPrediction(data.prediction);
      setFromCache(data.from_cache || false);

      if (forceRefresh) {
        toast.success('Prediction refreshed successfully');
      }
    } catch (err: any) {
      console.error('Error loading prediction:', err);
      setError(err.message || 'Failed to load prediction');
      toast.error(err.message || 'Failed to load prediction');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadPrediction(true);
  };

  const handleScenarioClick = (outlookId: string) => {
    const element = document.getElementById(`scenario-${outlookId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleViewSources = () => {
    // Scroll to methodology section or open sources modal
    const element = document.getElementById('methodology-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </AppShell>
    );
  }

  if (error || !prediction) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-light text-text-primary mb-2">
              {error || 'Prediction not available'}
            </h2>
            <p className="text-sm text-text-secondary mb-6">
              {error || 'Unable to generate prediction for this event'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.15] rounded-lg text-sm font-light text-text-primary transition-colors"
              >
                Go Back
              </button>
              {error && (
                <button
                  onClick={() => loadPrediction(true)}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-light text-blue-300 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Sort outlooks by probability (highest first)
  const sortedOutlooks = [...prediction.outlooks].sort(
    (a, b) => b.probability - a.probability
  );

  // Calculate overall confidence
  const overallConfidence = prediction.confidence_score
    ? prediction.confidence_score >= 0.7
      ? 'high'
      : prediction.confidence_score >= 0.4
      ? 'medium'
      : 'low'
    : 'medium';

  return (
    <AppShell>
      <SEO
        title={`Scenario Outlook — ${eventData?.headline || 'Event'} | Nucigen`}
        description={`Probabilistic scenario analysis with ${prediction.outlooks.length} outlooks and ${prediction.evidence_count || 0} verified sources`}
      />

      <div className="col-span-1 sm:col-span-12 space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Event Header */}
        <EventHeader
          eventTitle={eventData?.headline || 'Event Analysis'}
          eventRegion={eventData?.region}
          eventSectors={eventData?.sectors}
          lastUpdated={prediction.generated_at}
          confidence={overallConfidence}
          sourceCount={prediction.evidence_count}
          prediction={{ from_cache }}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <ExportPDF 
            prediction={prediction} 
            eventTitle={eventData?.headline || eventTitle}
          />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.15] rounded-lg text-sm font-light text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Prediction'}</span>
          </button>
        </div>

        {/* Probability Overview */}
        <Card className="p-6">
          <h2 className="text-lg font-light text-text-primary mb-4">
            Probability Distribution
          </h2>
          <ProbabilityOverview
            outlooks={prediction.outlooks}
            onScenarioClick={handleScenarioClick}
          />
        </Card>

        {/* Scenarios / Outlooks */}
        <div className="space-y-6">
          <h2 className="text-xl font-light text-text-primary">
            Scenario Outlooks
          </h2>
          {sortedOutlooks.map((outlook, idx) => (
            <ScenarioCard
              key={outlook.id}
              outlook={outlook}
              rank={idx + 1}
              totalScenarios={sortedOutlooks.length}
              eventId={eventId}
            />
          ))}
        </div>

        {/* Global Watch Indicators */}
        <WatchIndicators outlooks={prediction.outlooks} />

        {/* Scenario Timeline (if history available) */}
        {eventId && (
          <ScenarioTimeline eventId={eventId} currentPrediction={prediction} />
        )}

        {/* Methodology & Transparency */}
        <div id="methodology-section">
          <MethodologySection
            prediction={prediction}
            onViewSources={handleViewSources}
          />
        </div>
      </div>
    </AppShell>
  );
}
