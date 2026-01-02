/**
 * PHASE 2D: Event Detail Page
 * 
 * THE SOURCE OF TRUTH - Core page of the product
 * Displays a single event with its complete causal chain
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById } from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Timeline from '../components/ui/Timeline';
import { ArrowLeft, MapPin, Building2, TrendingUp, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface CausalChain {
  id: string;
  cause: string;
  first_order_effect: string;
  second_order_effect: string | null;
  affected_sectors: string[];
  affected_regions: string[];
  time_horizon: 'hours' | 'days' | 'weeks';
  confidence: number;
}

interface EventDetail {
  id: string;
  event_type: string;
  event_subtype: string | null;
  summary: string;
  country: string | null;
  region: string | null;
  sector: string | null;
  actors: string[];
  why_it_matters: string;
  first_order_effect: string | null;
  second_order_effect: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
  nucigen_causal_chains: CausalChain[];
}

function EventDetailContent() {
  const { event_id } = useParams<{ event_id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [whyExpanded, setWhyExpanded] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (!event_id) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getEventById(event_id);
        setEvent(data);
      } catch (err: any) {
        console.error('Error loading event:', err);
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [event_id]);

  const getTimeHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'hours': return 'Hours';
      case 'days': return 'Days';
      case 'weeks': return 'Weeks';
      default: return horizon;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500/80';
    if (confidence >= 0.6) return 'text-yellow-500/80';
    return 'text-orange-500/80';
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 0.8) return 'text-red-500/80';
    if (impact >= 0.6) return 'text-orange-500/80';
    return 'text-yellow-500/80';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error || 'Event not found'}</p>
          </div>
          <button
            onClick={() => navigate('/events')}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const chain = event.nucigen_causal_chains[0];
  const whyItMattersText = event.why_it_matters || '';
  const shouldTruncate = whyItMattersText.length > 200;
  const displayText = whyExpanded || !shouldTruncate 
    ? whyItMattersText 
    : whyItMattersText.substring(0, 200) + '...';

  // Build timeline items
  const timelineItems = [
    { label: 'Cause', content: chain.cause },
    { label: 'First-Order Effect', content: chain.first_order_effect },
  ];

  if (chain.second_order_effect) {
    timelineItems.push({ label: 'Second-Order Effect', content: chain.second_order_effect });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title={`${event.summary.substring(0, 60)}... — Nucigen Labs`}
        description={event.summary}
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/events')}
                className="p-2 text-slate-600 hover:text-white hover:bg-white/[0.02] rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-light text-white leading-tight mb-2">
                  Event Detail
                </h1>
                <p className="text-sm text-slate-600 font-light">
                  Published {formatDate(event.created_at)}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
        <Card className="p-8">
          {/* Event Header */}
          <div className="mb-8 pb-8 border-b border-white/[0.02]">
            <h2 className="text-2xl font-light text-white mb-4 leading-snug">
              {event.summary}
            </h2>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {event.sector && (
                <Badge variant="sector">
                  <Building2 className="w-3 h-3 mr-1.5" />
                  {event.sector}
                </Badge>
              )}
              {event.region && (
                <Badge variant="region">
                  <MapPin className="w-3 h-3 mr-1.5" />
                  {event.region}
                </Badge>
              )}
              {event.event_type && (
                <Badge variant="level">
                  <TrendingUp className="w-3 h-3 mr-1.5" />
                  {event.event_type}
                </Badge>
              )}
            </div>

            {/* Confidence & Impact */}
            <div className="flex items-center gap-6">
              {event.confidence !== null && (
                <div>
                  <div className="text-xs text-slate-600 mb-1 font-light">Confidence</div>
                  <div className={`text-lg font-light ${getConfidenceColor(event.confidence)}`}>
                    {(event.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              )}
              {event.impact_score !== null && (
                <div>
                  <div className="text-xs text-slate-600 mb-1 font-light">Impact</div>
                  <div className={`text-lg font-light ${getImpactColor(event.impact_score)}`}>
                    {(event.impact_score * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Why It Matters */}
          <div className="mb-8 pb-8 border-b border-white/[0.02]">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                Why It Matters
              </h3>
              {shouldTruncate && (
                <button
                  onClick={() => setWhyExpanded(!whyExpanded)}
                  className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                >
                  {whyExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Show more
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-base text-slate-300 font-light leading-relaxed">
              {displayText}
            </p>
          </div>

          {/* Causal Chain */}
          <div className="mb-8 pb-8 border-b border-white/[0.02]">
            <h3 className="text-sm font-medium text-slate-400 mb-6 uppercase tracking-wide">
              Causal Chain
            </h3>
            <Timeline items={timelineItems} />

            {/* Chain Metadata */}
            <div className="pt-6 mt-6 border-t border-white/[0.02]">
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-light">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Time horizon: {getTimeHorizonLabel(chain.time_horizon)}</span>
                </div>
                {chain.affected_sectors.length > 0 && (
                  <div>
                    <span className="text-slate-600">Affected sectors: </span>
                    <span>{chain.affected_sectors.join(', ')}</span>
                  </div>
                )}
                {chain.affected_regions.length > 0 && (
                  <div>
                    <span className="text-slate-600">Affected regions: </span>
                    <span>{chain.affected_regions.join(', ')}</span>
                  </div>
                )}
                <div className="ml-auto">
                  <span className="text-slate-600">Chain confidence: </span>
                  <span className={getConfidenceColor(chain.confidence)}>
                    {(chain.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Exposure (v1 simple) */}
          <div className="mb-8 pb-8 border-b border-white/[0.02]">
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">
              Exposure
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-slate-600 mb-2 font-light">Most exposed sectors</div>
                <div className="flex flex-wrap gap-2">
                  {chain.affected_sectors.map(sector => (
                    <Badge key={sector} variant="sector">{sector}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600 mb-2 font-light">Potentially affected regions</div>
                <div className="flex flex-wrap gap-2">
                  {chain.affected_regions.map(region => (
                    <Badge key={region} variant="region">{region}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sources & Evidence */}
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wide">
              Sources & Evidence
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-slate-500 font-light">
                Source data is collected from verified news and intelligence feeds.
              </p>
              <p className="text-xs text-slate-600 font-light italic">
                External source links and credibility scoring will be available in a future update.
              </p>
            </div>
          </div>
        </Card>
        </main>
      </div>
    </div>
  );
}

export default function EventDetail() {
  return (
    <ProtectedRoute>
      <EventDetailContent />
    </ProtectedRoute>
  );
}

