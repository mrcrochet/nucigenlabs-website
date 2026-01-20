/**
 * Alpha Signals Panel
 * 
 * Displays actionable alpha signals with technical analysis and event correlations
 */

import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { TrendingUp, TrendingDown, Activity, Target, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import type { Event } from '../../types/intelligence';

interface AlphaSignal {
  id: string;
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  reasoning: string[];
  technical: {
    rsi: number;
    macd: number;
    trend: string;
    strength: number;
  };
  eventCorrelation?: {
    eventId: string;
    eventTitle: string;
    correlation: number;
    priceImpact: number;
    timeframe: string;
  };
  pricePrediction: {
    current: number;
    target: number;
    stopLoss: number;
    timeframe: string;
    probability: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
}

interface AlphaSignalsPanelProps {
  symbol?: string;
  events?: Event[];
  autoRefresh?: boolean;
  refreshInterval?: number; // seconds
}

export default function AlphaSignalsPanel({ 
  symbol, 
  events = [], 
  autoRefresh = false,
  refreshInterval = 300 
}: AlphaSignalsPanelProps) {
  const [signals, setSignals] = useState<AlphaSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlphaSignals = async () => {
    if (!symbol) {
      setError('Symbol is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.DEV ? '/api' : '/api';
      const eventIds = events.map(e => e.id).join(',');
      const url = `${API_BASE}/alpha/signal/${symbol}${eventIds ? `?events=${eventIds}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch alpha signal: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSignals([result.data]);
      } else {
        throw new Error(result.error || 'Failed to generate alpha signal');
      }
    } catch (err: any) {
      console.error('[AlphaSignalsPanel] Error:', err);
      setError(err.message || 'Failed to load alpha signals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchAlphaSignals();
    }
  }, [symbol, events]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !symbol) return;

    const interval = setInterval(() => {
      fetchAlphaSignals();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, symbol, events]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'BUY':
        return 'text-green-300 bg-green-300/10 border-green-300/20';
      case 'HOLD':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'SELL':
        return 'text-red-300 bg-red-300/10 border-red-300/20';
      case 'STRONG_SELL':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'HIGH':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  if (!symbol) {
    return (
      <Card>
        <SectionHeader title="Alpha Signals" />
        <div className="text-sm text-text-secondary text-center py-8">
          Select a symbol to view alpha signals
        </div>
      </Card>
    );
  }

  if (loading && signals.length === 0) {
    return (
      <Card>
        <SectionHeader title="Alpha Signals" />
        <div className="flex items-center justify-center gap-2 py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary-red" />
          <span className="text-sm text-text-secondary">Generating alpha signal...</span>
        </div>
      </Card>
    );
  }

  if (error && signals.length === 0) {
    return (
      <Card>
        <SectionHeader title="Alpha Signals" />
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400 mb-2">Failed to load alpha signal</p>
          <p className="text-xs text-red-300/70 mb-3">{error}</p>
          <button
            onClick={fetchAlphaSignals}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-xs text-red-400 transition-colors"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (signals.length === 0) {
    return (
      <Card>
        <SectionHeader title="Alpha Signals" />
        <div className="text-sm text-text-secondary text-center py-8">
          No alpha signals available for {symbol}
        </div>
      </Card>
    );
  }

  const signal = signals[0];
  const priceChange = ((signal.pricePrediction.target - signal.pricePrediction.current) / signal.pricePrediction.current) * 100;
  const stopLossChange = ((signal.pricePrediction.stopLoss - signal.pricePrediction.current) / signal.pricePrediction.current) * 100;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="Alpha Signal" />
        <div className="flex items-center gap-2">
          {autoRefresh && (
            <Badge variant="neutral" className="text-xs">
              Auto-refresh: {refreshInterval}s
            </Badge>
          )}
          <button
            onClick={fetchAlphaSignals}
            disabled={loading}
            className="p-1.5 hover:bg-background-glass-medium rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Signal Header */}
        <div className="flex items-center justify-between p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-text-primary">{signal.symbol}</div>
            <Badge className={getSignalColor(signal.signal)}>
              {signal.signal.replace('_', ' ')}
            </Badge>
            <Badge variant="level">
              {signal.confidence}% confidence
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-tertiary mb-1">Risk Level</div>
            <div className={`text-sm font-semibold ${getRiskColor(signal.riskLevel)}`}>
              {signal.riskLevel}
            </div>
          </div>
        </div>

        {/* Price Prediction */}
        <div className="p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">Price Prediction</h3>
            <Badge variant="neutral" className="ml-auto">
              {signal.pricePrediction.probability}% probability
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-text-tertiary mb-1">Current</div>
              <div className="text-sm font-semibold text-text-primary">
                ${signal.pricePrediction.current.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary mb-1">Target</div>
              <div className={`text-sm font-semibold flex items-center gap-1 ${
                priceChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                ${signal.pricePrediction.target.toFixed(2)}
                <span className="text-xs">({priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%)</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary mb-1">Stop Loss</div>
              <div className={`text-sm font-semibold flex items-center gap-1 ${
                stopLossChange > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {stopLossChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                ${signal.pricePrediction.stopLoss.toFixed(2)}
                <span className="text-xs">({stopLossChange > 0 ? '+' : ''}{stopLossChange.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-text-tertiary">
            Timeframe: {signal.pricePrediction.timeframe}
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-text-secondary" />
            <h3 className="text-sm font-semibold text-text-primary">Technical Indicators</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-tertiary mb-1">RSI</div>
              <div className={`text-sm font-semibold ${
                signal.technical.rsi < 30 ? 'text-green-400' :
                signal.technical.rsi > 70 ? 'text-red-400' :
                'text-text-primary'
              }`}>
                {signal.technical.rsi.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary mb-1">MACD</div>
              <div className={`text-sm font-semibold ${
                signal.technical.macd > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {signal.technical.macd > 0 ? '+' : ''}{signal.technical.macd.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary mb-1">Trend</div>
              <div className="text-sm font-semibold text-text-primary capitalize">
                {signal.technical.trend}
              </div>
            </div>
            <div>
              <div className="text-xs text-text-tertiary mb-1">Strength</div>
              <div className="text-sm font-semibold text-text-primary">
                {signal.technical.strength}%
              </div>
            </div>
          </div>
        </div>

        {/* Event Correlation */}
        {signal.eventCorrelation && (
          <div className="p-4 bg-[#E1463E]/10 border border-[#E1463E]/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[#E1463E]" />
              <h3 className="text-sm font-semibold text-text-primary">Event Correlation</h3>
            </div>
            <p className="text-xs text-text-secondary mb-2 line-clamp-2">
              {signal.eventCorrelation.eventTitle}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-text-tertiary">
                Correlation: <span className={`font-semibold ${
                  signal.eventCorrelation.correlation > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(signal.eventCorrelation.correlation * 100).toFixed(0)}%
                </span>
              </span>
              <span className="text-text-tertiary">
                Impact: <span className={`font-semibold ${
                  signal.eventCorrelation.priceImpact > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {signal.eventCorrelation.priceImpact > 0 ? '+' : ''}{signal.eventCorrelation.priceImpact.toFixed(2)}%
                </span>
              </span>
              <span className="text-text-tertiary">
                {signal.eventCorrelation.timeframe}
              </span>
            </div>
          </div>
        )}

        {/* Reasoning */}
        <div className="p-4 bg-background-glass-subtle rounded-lg border border-borders-subtle">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Reasoning</h3>
          <ul className="space-y-1">
            {signal.reasoning.map((reason, index) => (
              <li key={index} className="text-xs text-text-secondary flex items-start gap-2">
                <span className="text-text-tertiary mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
