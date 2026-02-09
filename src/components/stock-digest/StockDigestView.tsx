/**
 * Stock Portfolio Researcher — General view (Tavily + OpenAI)
 * UI inspirée de https://github.com/tavily-ai/market-researcher/tree/main/UI
 */

import { useState, KeyboardEvent } from 'react';
import {
  Loader2,
  Sparkles,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  Plus,
  X,
  BarChart3,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Circle,
} from 'lucide-react';
import { apiUrl } from '../../lib/api-base';
import type { StockReport, StockDigestResponse } from '../../types/stock-digest';

const MAX_TICKERS = 5;
const TICKER_REGEX = /^[A-Za-z]{1,10}$/;
const POPULAR_TICKERS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];

type ResearchModel = 'mini' | 'pro';

function formatUrlDisplay(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.split('/').filter(Boolean).slice(0, 2).join('/');
    return path ? `${host}/${path}` : host;
  } catch {
    return url.replace(/^https?:\/\//, '').slice(0, 40);
  }
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

export default function StockDigestView() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StockDigestResponse | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [researchModel, setResearchModel] = useState<ResearchModel>('mini');

  const addTicker = () => {
    const t = inputValue.trim().toUpperCase();
    if (!t || !TICKER_REGEX.test(t)) return;
    if (tickers.includes(t) || tickers.length >= MAX_TICKERS) return;
    setTickers([...tickers, t]);
    setInputValue('');
  };

  const removeTicker = (t: string) => setTickers(tickers.filter((x) => x !== t));

  const addPopular = (t: string) => {
    if (!tickers.includes(t) && tickers.length < MAX_TICKERS) setTickers([...tickers, t]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTicker();
    }
  };

  const handleGenerate = async () => {
    if (tickers.length === 0 || loading) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(apiUrl('/api/stock-digest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers, research_model: researchModel }),
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        if (text.trimStart().startsWith('<!') || text.trimStart().startsWith('<')) {
          setError(
            'Le serveur API ne répond pas (réponse HTML). En développement, lancez « npm run dev:all » pour démarrer le front et l’API.'
          );
        } else {
          setError(`Réponse inattendue (${res.status}). Vérifiez que l’API est bien démarrée.`);
        }
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || res.statusText);
        return;
      }
      setData(json);
      setSelectedTicker(tickers[0]);
    } catch (e: any) {
      const msg = e?.message ?? 'Request failed';
      if (msg.includes('JSON') || msg.includes('<!DOCTYPE')) {
        setError(
          'L’API est injoignable (réponse non-JSON). En dev, utilisez « npm run dev:all » pour lancer le backend sur le port 3001.'
        );
      } else if (msg === 'Failed to fetch' || msg.includes('fetch')) {
        setError(
          'Impossible de joindre l’API (connexion refusée). Démarrez le backend : npm run dev:all ou npm run api:server.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setTickers([]);
    setSelectedTicker(null);
    setShowSources(false);
  };

  // ——— Report view (inspiré DailyDigestReport)
  if (data?.reports && Object.keys(data.reports).length > 0) {
    const reportTickers = Object.keys(data.reports);
    const current = selectedTicker && data.reports[selectedTicker] ? selectedTicker : reportTickers[0];
    const report = data.reports[current]!;

    return (
      <div className="space-y-6">
        {/* Header: Back + titre + date */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.1] text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to input
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#E1463E]/20">
              <BarChart3 className="w-5 h-5 text-[#E1463E]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Portfolio digest
              </h2>
              <p className="text-xs text-slate-500">
                {new Date(data.generated_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Ticker selector */}
        <div className="flex flex-wrap gap-2">
          {reportTickers.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTicker(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                t === current
                  ? 'bg-[#E1463E] text-white'
                  : 'bg-white/[0.06] text-slate-400 hover:bg-white/10 hover:text-white border border-white/[0.08]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Selected stock report */}
        <div className="space-y-6">
          {/* Stock header */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6">
            <h3 className="text-xl font-bold text-white">{report.ticker}</h3>
            <p className="text-slate-400">{report.company_name}</p>
            {(report.market_cap != null || report.pe_ratio != null) && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {report.market_cap != null && (
                  <div className="p-3 rounded-lg bg-[#E1463E]/10 border border-[#E1463E]/20">
                    <p className="text-xs text-slate-500">Market cap</p>
                    <p className="text-sm font-semibold text-white">{formatMarketCap(report.market_cap)}</p>
                  </div>
                )}
                {report.pe_ratio != null && (
                  <div className="p-3 rounded-lg bg-[#E1463E]/10 border border-[#E1463E]/20">
                    <p className="text-xs text-slate-500">P/E ratio</p>
                    <p className="text-sm font-semibold text-white">{report.pe_ratio.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          {report.summary && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6">
              <h4 className="text-sm font-semibold text-white mb-2">Summary</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
            </div>
          )}

          {/* Key Insights */}
          {report.key_insights.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#E1463E]" />
                Key insights
              </h4>
              <ul className="space-y-2">
                {report.key_insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <Circle className="w-4 h-4 text-[#E1463E] shrink-0 mt-0.5" fill="currentColor" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Analysis grid: Performance, Risk, Outlook */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#E1463E]" />
                Current performance
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{report.current_performance || '—'}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Risk assessment
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{report.risk_assessment || '—'}</p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Price outlook
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{report.price_outlook || '—'}</p>
            </div>
          </div>

          {/* Recommendation */}
          {report.recommendation && (
            <div className="rounded-xl border border-[#E1463E]/20 bg-[#E1463E]/5 p-4 sm:p-6">
              <h4 className="text-sm font-semibold text-white mb-2">Recommendation</h4>
              <p className="text-sm text-slate-300 leading-relaxed">{report.recommendation}</p>
            </div>
          )}

          {/* Sources (collapsible) */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSources(!showSources)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <ExternalLink className="w-4 h-4 text-[#E1463E]" />
                Research sources ({report.sources?.length || 0})
              </span>
              {showSources ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            {showSources && report.sources && report.sources.length > 0 && (
              <div className="border-t border-white/[0.06] p-4 space-y-3">
                {report.sources.map((src, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-black/20 border border-white/[0.04]">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500 truncate">{src.published_date}</p>
                      <p className="text-sm text-slate-300 line-clamp-2">{src.title}</p>
                      <p className="text-xs text-[#E1463E] truncate mt-1">{formatUrlDisplay(src.url)}</p>
                    </div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-2 text-[#E1463E] hover:bg-[#E1463E]/10 rounded-lg transition-colors"
                      aria-label="Open source"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ——— Input view: aligned with Corporate Impact — typography, colors, juxtaposition.
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Hero — same as Corporate Impact: font-light title, gray-400 description */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-light text-white mb-3">
          Stock Portfolio Researcher
        </h2>
        <p className="text-gray-400 text-sm sm:text-base font-light max-w-2xl mx-auto leading-relaxed">
          Events → pressure → actions. One digest per ticker, with sources. Not price forecasts.
        </p>
      </div>

      {/* Add tickers block — same structure as Corporate Impact "Add Companies to Monitor" */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Add Companies to Analyze
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Enter up to {MAX_TICKERS} tickers. We&apos;ll map events and pressure, then suggest next steps.
        </p>
        <div className="flex flex-wrap gap-2 mb-2">
          {tickers.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 font-mono"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTicker(t)}
                disabled={loading}
                className="text-gray-500 hover:text-white ml-1"
                aria-label={`Remove ${t}`}
              >
                ×
              </button>
            </span>
          ))}
          {tickers.length < MAX_TICKERS && (
            <>
              <input
                type="text"
                placeholder="Enter ticker (e.g., AAPL)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                disabled={loading}
                className="px-3 py-2 w-36 min-w-0 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 font-mono"
                maxLength={10}
                aria-label="Ticker symbol"
              />
              <button
                type="button"
                onClick={addTicker}
                disabled={!inputValue.trim() || loading}
                className="px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300 text-sm font-light transition-colors"
                aria-label="Add ticker"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-2">Popular: </p>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TICKERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addPopular(t)}
              disabled={tickers.includes(t) || tickers.length >= MAX_TICKERS || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200 disabled:opacity-50 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* CTA row — same juxtaposition as Corporate Impact: button + subtext */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={tickers.length === 0 || loading}
            className="px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Get Daily Digest ({tickers.length} {tickers.length === 1 ? 'ticker' : 'tickers'})
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 self-center sm:self-auto">
            Daily digest + alerts when pressure shifts.
          </p>
        </div>
      </div>

      {/* Research Model — same as Corporate Impact toggle: uppercase label, bg-gray-900 border-gray-800, font-light */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium shrink-0">Brief type</span>
          <div className="flex p-0.5 bg-gray-900 border border-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setResearchModel('mini')}
              className={`px-4 py-2 rounded-md text-sm font-light transition-colors ${
                researchModel === 'mini'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Mini
            </button>
            <button
              type="button"
              onClick={() => setResearchModel('pro')}
              className={`px-4 py-2 rounded-md text-sm font-light transition-colors ${
                researchModel === 'pro'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Pro
            </button>
          </div>
        </div>
        <span className="text-xs text-gray-500 sm:ml-2 font-light">
          {researchModel === 'mini'
            ? 'Fast brief (top events + impact score + 3 actions)'
            : 'Full causal map (drivers, second-order effects, scenarios)'}
        </span>
      </div>

      {/* Micro-text — same tone as Corporate Impact footer */}
      <div className="pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 font-light text-center">
          Events & pressure drivers · Causal links, not predictions · Sources cited.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-[#E1463E]/30 bg-[#E1463E]/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#E1463E] shrink-0 mt-0.5" />
          <p className="text-sm text-gray-200">{error}</p>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/30 py-4 px-5 text-center">
          <p className="text-gray-600 text-xs font-light">Event-driven digest. Add tickers and click Get Daily Digest. Sources cited.</p>
        </div>
      )}
    </div>
  );
}
