/**
 * Research Page
 * 
 * UI CONTRACT: Consumes ONLY analysis (not events or signals directly)
 * Analysis is long-form, multi-event content
 * Focus on medium-to-long-term implications
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { 
  getEventsWithCausalChainsSearch,
  getUserPreferences,
} from '../lib/supabase';
import { eventsToSignals } from '../lib/adapters/intelligence-adapters';
import { eventWithChainToEvent } from '../lib/adapters/intelligence-adapters';
import { generateAnalysisFromEvents } from '../lib/adapters/analysis-adapters';
import type { Analysis } from '../types/intelligence';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppShell from '../components/layout/AppShell';
import SkeletonCard from '../components/ui/SkeletonCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import Tooltip from '../components/ui/Tooltip';
import { BookOpen, Clock, ArrowRight, TrendingUp, Search, Sparkles, Loader2, ExternalLink, FileText } from 'lucide-react';
import ResearchTemplates from '../components/research/ResearchTemplates';
import { apiUrl } from '../lib/api-base';

function ResearchContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  const isFullyLoaded = userLoaded && authLoaded;
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'medium' | 'long'>('medium');
  
  // Deep Research state
  const [deepResearchQuery, setDeepResearchQuery] = useState('');
  const [isDeepResearching, setIsDeepResearching] = useState(false);
  const [deepResearchResult, setDeepResearchResult] = useState<Analysis | null>(null);
  const [deepResearchError, setDeepResearchError] = useState('');
  const [deepResearchProgress, setDeepResearchProgress] = useState<string>('');

  // Meeting brief state
  const [meetingCompany, setMeetingCompany] = useState('');
  const [meetingTicker, setMeetingTicker] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingBrief, setMeetingBrief] = useState<{ brief: string; sources: { title: string; url: string }[]; generatedAt: string } | null>(null);
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [meetingError, setMeetingError] = useState('');

  // ESG extract from document
  const [esgDocText, setEsgDocText] = useState('');
  const [esgPdfFile, setEsgPdfFile] = useState<File | null>(null);
  const [esgResult, setEsgResult] = useState<{
    companyName?: string;
    environmental: string[];
    social: string[];
    governance: string[];
    summary?: string;
    generatedAt: string;
  } | null>(null);
  const [esgLoading, setEsgLoading] = useState(false);
  const [esgError, setEsgError] = useState('');

  // Load preferences
  useEffect(() => {
    async function fetchPreferences() {
      if (!user?.id) return;
      try {
        const preferencesData = await getUserPreferences(user.id).catch(() => null);
        setPreferences(preferencesData);
      } catch (err) {
        console.error('Error loading preferences:', err);
      }
    }
    fetchPreferences();
  }, [user?.id]);

  // Fetch analysis (generated from events + signals)
  const fetchAnalysis = useCallback(async () => {
    if (!isFullyLoaded) return;

    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      setAnalyses([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch events
      const searchOptions: any = {
        limit: 200, // Get more events for analysis
      };

      if (preferences) {
        if (preferences.preferred_sectors && preferences.preferred_sectors.length > 0) {
          searchOptions.sectorFilter = preferences.preferred_sectors;
        }
        if (preferences.preferred_regions && preferences.preferred_regions.length > 0) {
          searchOptions.regionFilter = preferences.preferred_regions;
        }
      }

      const eventsData = await getEventsWithCausalChainsSearch(searchOptions, user.id);
      
      // Convert to normalized events
      const normalizedEvents = (eventsData || []).map(eventWithChainToEvent);
      
      // Generate signals from events
      const signals = eventsToSignals(eventsData || []);
      
      // Generate analysis from events + signals
      const allAnalyses = generateAnalysisFromEvents(
        normalizedEvents,
        signals,
        undefined, // topic
        activeTab
      );

      setAnalyses(allAnalyses);
      setError('');
    } catch (err: any) {
      console.error('Error loading analysis:', err);
      setError(err.message || 'Failed to load analysis');
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isFullyLoaded, preferences, activeTab]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  // Deep Research handler
  const handleDeepResearch = async () => {
    if (!deepResearchQuery.trim() || isDeepResearching) return;

    setIsDeepResearching(true);
    setDeepResearchError('');
    setDeepResearchResult(null);
    setDeepResearchProgress('Searching with Perplexity…');

    try {
      setTimeout(() => setDeepResearchProgress('Analyzing information…'), 2000);
      setTimeout(() => setDeepResearchProgress('Synthesizing analysis…'), 4000);

      const apiUrl = '/api/deep-research';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: deepResearchQuery.trim(),
          focus_areas: preferences?.focus_areas || [],
          time_horizon: activeTab,
          max_sources: 10,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.analysis) {
        setDeepResearchProgress('Complete!');
        setDeepResearchResult(result.analysis);
        // Add to analyses list
        setAnalyses(prev => [result.analysis, ...prev]);
        setDeepResearchQuery('');
      } else {
        throw new Error(result.error || 'Failed to generate analysis');
      }
    } catch (err: any) {
      console.error('Deep research error:', err);
      setDeepResearchError(err.message || 'Failed to conduct deep research');
      setDeepResearchProgress('');
    } finally {
      setTimeout(() => {
        setIsDeepResearching(false);
        setDeepResearchProgress('');
      }, 500);
    }
  };

  const handleMeetingBrief = async () => {
    if (!meetingCompany.trim() || meetingLoading) return;
    setMeetingLoading(true);
    setMeetingError('');
    setMeetingBrief(null);
    try {
      const res = await fetch(apiUrl('/api/meeting-brief'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: meetingCompany.trim(),
          ticker: meetingTicker.trim() || undefined,
          meetingType: meetingType.trim() || undefined,
          date: meetingDate.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      if (json.success && json.brief != null) {
        setMeetingBrief({ brief: json.brief, sources: json.sources || [], generatedAt: json.generatedAt || new Date().toISOString() });
      } else {
        throw new Error(json.error || 'Failed to generate brief');
      }
    } catch (err: any) {
      setMeetingError(err.message || 'Failed to generate meeting brief');
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleESGExtract = async () => {
    if ((!esgDocText.trim() && !esgPdfFile) || esgLoading) return;
    setEsgLoading(true);
    setEsgError('');
    setEsgResult(null);
    try {
      let text = esgDocText.trim();
      let pdfBase64: string | undefined;
      if (esgPdfFile) {
        const buf = await esgPdfFile.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
        pdfBase64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(buf).toString('base64');
      }
      const res = await fetch(apiUrl('/api/esg/extract-from-document'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfBase64 ? { pdfBase64 } : { text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || res.statusText);
      if (json.success) {
        setEsgResult({
          companyName: json.companyName,
          environmental: json.environmental || [],
          social: json.social || [],
          governance: json.governance || [],
          summary: json.summary,
          generatedAt: json.generatedAt || new Date().toISOString(),
        });
      } else throw new Error(json.error || 'Extraction failed');
    } catch (err: any) {
      setEsgError(err.message || 'Failed to extract ESG');
    } finally {
      setEsgLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 font-light">Loading research analysis...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="col-span-1 sm:col-span-12 flex items-center justify-center min-h-[400px]">
          <div className="max-w-2xl w-full text-center">
            <div className="mb-6 p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-base text-red-400 font-light mb-2">Unable to load analysis</p>
              <p className="text-sm text-slate-400 font-light">{error}</p>
            </div>
            <button
              onClick={() => navigate('/overview')}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-light"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO 
        title="Research — Nucigen Labs"
        description="Long-form intelligence analysis and case studies"
      />

      <div className="col-span-1 sm:col-span-12">
        <header className="mb-6">
          <SectionHeader
            title="Research"
            subtitle={`Thematic analysis · ${analyses.length} analysis${analyses.length !== 1 ? 'es' : ''} available`}
          />
        </header>
          {/* Research Templates */}
          <div className="mb-8">
            <ResearchTemplates
              onSelectTemplate={(query) => {
                setDeepResearchQuery(query);
                // Auto-focus the search input
                setTimeout(() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input) {
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 100);
              }}
            />
          </div>

          {/* Deep Research Search */}
          <div className="mb-8">
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-light text-white">Deep Research</h3>
                </div>
                <p className="text-sm text-slate-400 font-light">
                  Get comprehensive analysis in seconds. Powered by Perplexity for web search and citations, with synthesis tailored to your focus and time horizon.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Enter your research query (e.g., 'China trade policy impact on global supply chains')..."
                    value={deepResearchQuery}
                    onChange={(e) => setDeepResearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && deepResearchQuery.trim() && !isDeepResearching) {
                        handleDeepResearch();
                      }
                    }}
                    disabled={isDeepResearching}
                    className="w-full pl-12 pr-32 py-3 bg-white/[0.02] border border-purple-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.03] transition-all font-light disabled:opacity-50"
                  />
                  <button
                    onClick={handleDeepResearch}
                    disabled={!deepResearchQuery.trim() || isDeepResearching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30 rounded-lg text-purple-300 text-sm font-light transition-all flex items-center gap-2"
                  >
                    {isDeepResearching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{deepResearchProgress || 'Searching with Perplexity…'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Start Research</span>
                      </>
                    )}
                  </button>
                </div>
                
                {deepResearchError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm font-light">{deepResearchError}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Meeting brief */}
          <div className="mb-8">
            <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-light text-white">Meeting brief</h3>
                </div>
                <p className="text-sm text-slate-400 font-light">
                  One-page briefing for a company or meeting. Powered by Tavily and OpenAI.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Company name *"
                  value={meetingCompany}
                  onChange={(e) => setMeetingCompany(e.target.value)}
                  disabled={meetingLoading}
                  className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                />
                <input
                  type="text"
                  placeholder="Ticker (e.g. AAPL)"
                  value={meetingTicker}
                  onChange={(e) => setMeetingTicker(e.target.value)}
                  disabled={meetingLoading}
                  className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                />
                <input
                  type="text"
                  placeholder="Meeting type (e.g. earnings call)"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  disabled={meetingLoading}
                  className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                />
                <input
                  type="text"
                  placeholder="Date (optional)"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  disabled={meetingLoading}
                  className="px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                />
              </div>
              <button
                onClick={handleMeetingBrief}
                disabled={!meetingCompany.trim() || meetingLoading}
                className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-50 border border-amber-500/30 rounded-lg text-amber-200 text-sm font-light flex items-center gap-2"
              >
                {meetingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Generate brief
              </button>
              {meetingError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{meetingError}</p>
                </div>
              )}
              {meetingBrief && (
                <div className="mt-6 pt-6 border-t border-white/[0.06]">
                  <p className="text-xs text-slate-500 mb-2">
                    Generated {new Date(meetingBrief.generatedAt).toLocaleString()}
                  </p>
                  <div className="p-4 rounded-lg bg-black/20 border border-white/[0.06] max-h-[480px] overflow-y-auto">
                    <pre className="text-sm text-slate-300 font-light whitespace-pre-wrap font-sans">
                      {meetingBrief.brief}
                    </pre>
                  </div>
                  {meetingBrief.sources.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-2">Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {meetingBrief.sources.map((s, i) => (
                          <a
                            key={i}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] text-slate-400 hover:text-amber-400 text-xs"
                          >
                            {s.title}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* ESG extract from document */}
          <div className="mb-8">
            <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-light text-white">Analyse ESG d&apos;un document</h3>
                </div>
                <p className="text-sm text-slate-400 font-light">
                  Collez le texte d&apos;un rapport RSE ou uploadez un PDF pour extraire les indicateurs E, S, G.
                </p>
              </div>
              <div className="space-y-3 mb-4">
                <textarea
                  placeholder="Collez ici le texte du rapport (ou uploadez un PDF ci-dessous)"
                  value={esgDocText}
                  onChange={(e) => setEsgDocText(e.target.value)}
                  disabled={esgLoading}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 text-sm resize-y"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setEsgPdfFile(e.target.files?.[0] || null)}
                    disabled={esgLoading}
                    className="text-sm text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-emerald-500/20 file:text-emerald-200"
                  />
                  {esgPdfFile && (
                    <span className="text-xs text-slate-500">{esgPdfFile.name}</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleESGExtract}
                disabled={(!esgDocText.trim() && !esgPdfFile) || esgLoading}
                className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 border border-emerald-500/30 rounded-lg text-emerald-200 text-sm font-light flex items-center gap-2"
              >
                {esgLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                Extraire les indicateurs ESG
              </button>
              {esgError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{esgError}</p>
                </div>
              )}
              {esgResult && (
                <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-4">
                  {esgResult.companyName && (
                    <p className="text-sm text-slate-400">Company: <span className="text-white">{esgResult.companyName}</span></p>
                  )}
                  {esgResult.summary && (
                    <p className="text-sm text-slate-300">{esgResult.summary}</p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs text-emerald-400 font-medium mb-2">Environmental</p>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {esgResult.environmental.length ? esgResult.environmental.map((s, i) => <li key={i}>• {s}</li>) : <li>—</li>}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-blue-400 font-medium mb-2">Social</p>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {esgResult.social.length ? esgResult.social.map((s, i) => <li key={i}>• {s}</li>) : <li>—</li>}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-400 font-medium mb-2">Governance</p>
                      <ul className="text-xs text-slate-300 space-y-1">
                        {esgResult.governance.length ? esgResult.governance.map((s, i) => <li key={i}>• {s}</li>) : <li>—</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-8 border-b border-white/[0.02]">
            {(['medium', 'long'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-light transition-all border-b-2 ${
                  activeTab === tab
                    ? 'text-white border-[#E1463E]'
                    : 'text-slate-500 border-transparent hover:text-white'
                }`}
              >
                {tab === 'long' ? 'Long-term' : 'Medium-term'}
              </button>
            ))}
          </div>

          {/* Analysis List */}
          {analyses.length === 0 && !deepResearchResult ? (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg text-white font-light mb-2">No analysis yet</h3>
                <p className="text-sm text-slate-400 font-light mb-6">
                  Use Deep Research above to generate comprehensive analysis on any topic. Analysis will also appear here automatically once we have enough events to identify patterns and trends.
                </p>
                <button
                  onClick={() => {
                    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                    if (input) {
                      input.focus();
                      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg transition-colors text-sm font-light flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="w-4 h-4" />
                  Try Deep Research
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="p-8">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="level">
                            {analysis.time_horizon}-term
                          </Badge>
                          <Badge variant="neutral">
                            {analysis.confidence}% confidence
                          </Badge>
                          <Badge variant="level">
                            {analysis.impact}% impact
                          </Badge>
                        </div>
                        <h2 className="text-2xl font-light text-white mb-2">
                          {analysis.title}
                        </h2>
                        <p className="text-sm text-slate-400 font-light">
                          {formatTimeAgo(analysis.last_updated)} · {analysis.source_count} events analyzed
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-light text-slate-400 mb-2 uppercase tracking-wide">
                        Executive Summary
                      </h3>
                      <p className="text-base text-slate-300 font-light leading-relaxed">
                        {analysis.executive_summary}
                      </p>
                    </div>

                    {analysis.key_trends && analysis.key_trends.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-light text-slate-400 mb-3 uppercase tracking-wide">
                          Key Trends
                        </h3>
                        <ul className="space-y-2">
                          {analysis.key_trends.map((trend, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300 font-light">
                              <TrendingUp className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                              <span>{trend}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.implications && analysis.implications.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-light text-slate-400 mb-3 uppercase tracking-wide">
                          Implications
                        </h3>
                        <ul className="space-y-2">
                          {analysis.implications.map((implication, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300 font-light">
                              <span className="text-slate-500 mt-0.5">•</span>
                              <span>{implication}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.sources && analysis.sources.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-light text-slate-400 mb-3 uppercase tracking-wide">
                          Perplexity Research · Sources
                        </h3>
                        <ul className="space-y-2">
                          {analysis.sources.map((src, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm">
                              {src.url ? (
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 font-light flex items-center gap-1.5"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{src.title || src.url}</span>
                                </a>
                              ) : (
                                <span className="text-slate-500 font-light">{src.title}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.related_questions && analysis.related_questions.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-light text-slate-400 mb-3 uppercase tracking-wide">
                          Related questions
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.related_questions.map((q, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setDeepResearchQuery(q);
                                setTimeout(() => {
                                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                                  if (input) {
                                    input.focus();
                                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }
                                }, 100);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-slate-300 hover:bg-purple-500/20 hover:border-purple-500/30 text-sm font-light transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.referenced_event_ids && analysis.referenced_event_ids.length > 0 && (
                      <div className="pt-6 border-t border-white/[0.02]">
                        <button
                          onClick={() => navigate(`/events-feed?event_ids=${analysis.referenced_event_ids?.join(',')}`)}
                          className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors"
                        >
                          View {analysis.referenced_event_ids.length} referenced event{analysis.referenced_event_ids.length !== 1 ? 's' : ''}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
      </div>
    </AppShell>
  );
}

export default function Research() {
  return (
    <ProtectedRoute>
      <ResearchContent />
    </ProtectedRoute>
  );
}
