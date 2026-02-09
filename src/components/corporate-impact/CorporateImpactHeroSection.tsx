/**
 * Corporate Impact Hero Section — v1 (Palantir / Intel)
 * Hero title, ticker input (up to 5), CTA "Generate Impact Brief", Track & Alert button, Mini/Pro toggle.
 */

import { useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const MAX_TICKERS = 5;
const TICKER_REGEX = /^[A-Za-z]{1,5}$/;

export type BriefType = 'mini' | 'pro';

interface CorporateImpactHeroSectionProps {
  onGenerate?: (tickers: string[], briefType: BriefType) => void;
  initialTickers?: string[];
  initialBriefType?: BriefType;
}

export default function CorporateImpactHeroSection({
  onGenerate,
  initialTickers = [],
  initialBriefType = 'mini',
}: CorporateImpactHeroSectionProps) {
  const [tickerInput, setTickerInput] = useState('');
  const [tickers, setTickers] = useState<string[]>(initialTickers);
  const [briefType, setBriefType] = useState<BriefType>(initialBriefType);
  const [error, setError] = useState<string | null>(null);

  const addTicker = useCallback(() => {
    const raw = tickerInput.trim().toUpperCase();
    if (!raw) return;
    setError(null);
    if (!TICKER_REGEX.test(raw)) {
      setError('Use 1–5 letter ticker (e.g. AAPL)');
      return;
    }
    if (tickers.includes(raw)) {
      setTickerInput('');
      return;
    }
    if (tickers.length >= MAX_TICKERS) {
      setError(`Maximum ${MAX_TICKERS} tickers.`);
      return;
    }
    setTickers((prev) => [...prev, raw].slice(0, MAX_TICKERS));
    setTickerInput('');
  }, [tickerInput, tickers]);

  const removeTicker = useCallback((t: string) => {
    setTickers((prev) => prev.filter((x) => x !== t));
    setError(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTicker();
    }
  };

  const handleGenerate = () => {
    if (tickers.length === 0) {
      setError('Add at least one ticker.');
      return;
    }
    setError(null);
    onGenerate?.(tickers, briefType);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-light text-white mb-3">
          Event-to-Impact Intelligence for Your Portfolio
        </h2>
        <p className="text-gray-400 text-sm sm:text-base font-light max-w-2xl mx-auto leading-relaxed">
          Track real-world events (geopolitics, regulation, supply chain, earnings, litigation) and see how they
          reshape corporate risk and opportunity — in plain language, with sources.
        </p>
      </div>

      {/* Add Companies to Monitor */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Add Companies to Monitor
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Enter up to 5 tickers. We&apos;ll map what changed, quantify pressure, and surface decision points.
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
                className="text-gray-500 hover:text-white ml-1"
                aria-label={`Remove ${t}`}
              >
                ×
              </button>
            </span>
          ))}
          {tickers.length < MAX_TICKERS && (
            <input
              type="text"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              onBlur={() => tickerInput.trim() && addTicker()}
              placeholder="Enter ticker (e.g., AAPL)"
              className="px-3 py-2 w-40 min-w-0 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 font-mono"
              maxLength={5}
              aria-label="Ticker symbol"
            />
          )}
        </div>
        <p className="text-xs text-gray-500">
          We generate an impact brief + action options for each ticker.
        </p>
        {error && (
          <p className="text-xs text-[#E1463E] mt-2" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* CTA row: Generate + Track & Alert */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="px-6 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Generate Impact Brief
          </button>
          <p className="text-xs text-gray-500 self-center sm:self-auto">
            Daily digest + alerts when pressure shifts.
          </p>
        </div>
        <Link
          to="/alerts"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-700 text-gray-300 text-sm hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" aria-hidden />
          Track & Alert on Pressure Shifts
        </Link>
      </div>

      {/* Mini / Pro toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium shrink-0">Brief type</span>
          <div className="flex p-0.5 bg-gray-900 border border-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setBriefType('mini')}
              className={`px-4 py-2 rounded-md text-sm font-light transition-colors ${
                briefType === 'mini'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Mini
            </button>
            <button
              type="button"
              onClick={() => setBriefType('pro')}
              className={`px-4 py-2 rounded-md text-sm font-light transition-colors ${
                briefType === 'pro'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Pro
            </button>
          </div>
        </div>
        <span className="text-xs text-gray-500 sm:ml-2">
          {briefType === 'mini'
            ? 'Fast brief (top events + impact score + 3 actions)'
            : 'Full causal map (drivers, second-order effects, scenarios, watchlist triggers)'}
        </span>
      </div>
    </section>
  );
}
