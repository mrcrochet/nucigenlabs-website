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

  // ——— Input view (aligné Market Researcher Tavily: titre, carte, toggle Mini/Pro, 3 feature cards)
  return (
    <div className="space-y-8">
      {/* Titre + sous-titre centrés (comme Tavily) */}
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Stock Portfolio Researcher</h2>
        <p className="text-slate-400 text-sm sm:text-base">
          Get comprehensive market insights and analysis for your favorite stocks.
        </p>
      </div>

      {/* Carte principale Enter Stock Tickers */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6 max-w-2xl mx-auto shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-1">Enter Stock Tickers</h3>
        <p className="text-sm text-slate-500 mb-4">
          Add the stock symbols you want to analyze (e.g., AAPL, GOOGL, MSFT). Up to {MAX_TICKERS}.
        </p>

        {/* Input + Add */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter ticker symbol (e.g., AAPL)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg bg-black/30 border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#E1463E]/50 text-base"
          />
          <button
            type="button"
            onClick={addTicker}
            disabled={!inputValue.trim() || loading || tickers.length >= MAX_TICKERS}
            className="px-4 py-3 rounded-lg border border-white/[0.1] text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-colors"
            aria-label="Add ticker"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Popular stocks */}
        <p className="text-xs text-slate-500 mb-2">Popular stocks:</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {POPULAR_TICKERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addPopular(t)}
              disabled={tickers.includes(t) || tickers.length >= MAX_TICKERS || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-50 border border-white/[0.06] transition-colors"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Selected tickers */}
        {tickers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Selected ({tickers.length}/{MAX_TICKERS})</p>
            <div className="flex flex-wrap gap-2">
              {tickers.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E1463E]/20 text-[#E1463E] text-sm font-medium border border-[#E1463E]/30"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTicker(t)}
                    disabled={loading}
                    className="hover:text-white disabled:opacity-50"
                    aria-label={`Remove ${t}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Research Model (Mini / Pro) — comme Tavily */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 py-3 border-t border-white/[0.06]">
          <div>
            <p className="text-sm font-medium text-white">Research Model</p>
            <p className="text-xs text-slate-500">
              {researchModel === 'mini' ? 'Mini: Fast analysis' : 'Pro: Deeper analysis'}
            </p>
          </div>
          <div className="flex rounded-lg p-0.5 bg-white/[0.06] border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setResearchModel('mini')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                researchModel === 'mini'
                  ? 'bg-[#E1463E] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mini
            </button>
            <button
              type="button"
              onClick={() => setResearchModel('pro')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                researchModel === 'pro'
                  ? 'bg-[#E1463E] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pro
            </button>
          </div>
        </div>

        {/* Get Daily Digest */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={tickers.length === 0 || loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-[#E1463E] hover:bg-[#E1463E]/90 disabled:opacity-50 text-white font-medium transition-colors text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating report…
            </>
          ) : (
            <>
              <BarChart3 className="w-5 h-5" />
              Get Daily Digest ({tickers.length} {tickers.length === 1 ? 'ticker' : 'tickers'})
            </>
          )}
        </button>
      </div>

      {/* Trois feature cards (Market Analysis, Performance Metrics, Trend Insights) */}
      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2">
          <div className="p-2 rounded-lg bg-[#E1463E]/20 w-fit">
            <BarChart3 className="w-5 h-5 text-[#E1463E]" />
          </div>
          <h4 className="font-semibold text-white">Market Analysis</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Price movements, volume analysis, and trend indicators
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20 w-fit">
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <h4 className="font-semibold text-white">Performance Metrics</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Daily returns, volatility, and key performance indicators
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/20 w-fit">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h4 className="font-semibold text-white">Trend Insights</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Market trends and actionable insights for your portfolio
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#E1463E]/30 bg-[#E1463E]/10 p-4 flex items-start gap-3 max-w-2xl mx-auto">
          <AlertTriangle className="w-5 h-5 text-[#E1463E] shrink-0 mt-0.5" />
          <p className="text-sm text-slate-200">{error}</p>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center max-w-xl mx-auto">
          <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" aria-hidden />
          <p className="text-slate-500 text-sm">Powered by Tavily & OpenAI. Add tickers and click &quot;Get Daily Digest&quot; to generate your report.</p>
        </div>
      )}
    </div>
  );
}
