/**
 * Technical Analysis Service
 * 
 * Provides technical indicators and analysis for market data
 * Used to generate alpha signals based on technical patterns
 */

import { getTimeSeries } from './twelvedata-service.js';

export interface TechnicalIndicators {
  rsi: number; // Relative Strength Index (0-100)
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    width: number; // Bollinger Band Width
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  support: number;
  resistance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100, confidence in trend
}

export interface PriceDataPoint {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50; // Neutral if not enough data

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }

  // Use last 'period' values
  const recentGains = gains.slice(-period);
  const recentLosses = losses.slice(-period);

  const avgGain = recentGains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = recentLosses.reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return 100; // All gains, overbought

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Math.round(rsi * 100) / 100;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  // EMA12 and EMA26
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  const macd = ema12 - ema26;

  // Signal line (EMA9 of MACD)
  // For simplicity, use last 9 MACD values
  const macdValues: number[] = [];
  for (let i = 26; i < prices.length; i++) {
    const ema12_i = calculateEMA(prices.slice(0, i + 1), 12);
    const ema26_i = calculateEMA(prices.slice(0, i + 1), 26);
    macdValues.push(ema12_i - ema26_i);
  }

  const signal = macdValues.length >= 9 
    ? calculateEMA(macdValues.slice(-9), 9)
    : macd * 0.9; // Approximate

  const histogram = macd - signal;

  return {
    macd: Math.round(macd * 100) / 100,
    signal: Math.round(signal * 100) / 100,
    histogram: Math.round(histogram * 100) / 100,
  };
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    // Fallback to SMA
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }

  return ema;
}

/**
 * Calculate SMA (Simple Moving Average)
 */
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  }
  const recent = prices.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
  upper: number;
  middle: number;
  lower: number;
  width: number;
} {
  if (prices.length < period) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return {
      upper: avg * 1.1,
      middle: avg,
      lower: avg * 0.9,
      width: avg * 0.2,
    };
  }

  const recent = prices.slice(-period);
  const sma = recent.reduce((a, b) => a + b, 0) / period;

  // Calculate standard deviation
  const variance = recent.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const standardDev = Math.sqrt(variance);

  const upper = sma + (standardDev * stdDev);
  const lower = sma - (standardDev * stdDev);
  const width = upper - lower;

  return {
    upper: Math.round(upper * 100) / 100,
    middle: Math.round(sma * 100) / 100,
    lower: Math.round(lower * 100) / 100,
    width: Math.round(width * 100) / 100,
  };
}

/**
 * Calculate support and resistance levels
 */
function calculateSupportResistance(data: PriceDataPoint[]): { support: number; resistance: number } {
  if (data.length === 0) {
    return { support: 0, resistance: 0 };
  }

  // Use recent 20 periods
  const recent = data.slice(-20);
  const lows = recent.map(d => d.low);
  const highs = recent.map(d => d.high);

  const support = Math.min(...lows);
  const resistance = Math.max(...highs);

  return {
    support: Math.round(support * 100) / 100,
    resistance: Math.round(resistance * 100) / 100,
  };
}

/**
 * Determine trend and strength
 */
function determineTrend(
  prices: number[],
  sma20: number,
  sma50: number,
  currentPrice: number
): { trend: 'bullish' | 'bearish' | 'neutral'; strength: number } {
  if (prices.length < 50) {
    return { trend: 'neutral', strength: 50 };
  }

  // Trend based on moving averages
  const sma20AboveSma50 = sma20 > sma50;
  const priceAboveSma20 = currentPrice > sma20;

  let trend: 'bullish' | 'bearish' | 'neutral';
  let strength = 50;

  if (sma20AboveSma50 && priceAboveSma20) {
    trend = 'bullish';
    // Calculate strength based on how far above
    const distance = ((currentPrice - sma20) / sma20) * 100;
    strength = Math.min(100, 50 + (distance * 2));
  } else if (!sma20AboveSma50 && !priceAboveSma20) {
    trend = 'bearish';
    const distance = ((sma20 - currentPrice) / sma20) * 100;
    strength = Math.min(100, 50 + (distance * 2));
  } else {
    trend = 'neutral';
    strength = 50;
  }

  return { trend, strength: Math.round(strength) };
}

/**
 * Get technical indicators for a symbol
 */
export async function getTechnicalIndicators(
  symbol: string,
  interval: string = '1h',
  days: number = 30
): Promise<TechnicalIndicators | null> {
  try {
    // Get time series data
    const timeSeries = await getTimeSeries(symbol, {
      interval,
      outputsize: Math.min(500, days * 24), // Limit to reasonable size
    });

    if (!timeSeries || !timeSeries.values || timeSeries.values.length === 0) {
      return null;
    }

    const data = timeSeries.values;
    const prices = data.map((d: any) => d.close);
    const currentPrice = prices[prices.length - 1];

    // Calculate indicators
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const bollinger = calculateBollingerBands(prices);
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const { support, resistance } = calculateSupportResistance(data);
    const { trend, strength } = determineTrend(prices, sma20, sma50, currentPrice);

    return {
      rsi,
      macd,
      bollinger,
      movingAverages: {
        sma20,
        sma50,
        ema12,
        ema26,
      },
      support,
      resistance,
      trend,
      strength,
    };
  } catch (error: any) {
    console.error('[TechnicalAnalysis] Error calculating indicators:', error);
    return null;
  }
}

/**
 * Generate trading signal based on technical analysis
 */
export interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  reasoning: string[];
  indicators: {
    rsi: number;
    macd: number;
    trend: string;
  };
}

export function generateTradingSignal(
  symbol: string,
  indicators: TechnicalIndicators,
  currentPrice: number
): TradingSignal {
  const signals: string[] = [];
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 50;
  let targetPrice = currentPrice;
  let stopLoss = currentPrice;

  // RSI signals
  if (indicators.rsi < 30) {
    signals.push('RSI oversold - potential buy opportunity');
    if (indicators.trend === 'bullish') {
      action = 'BUY';
      confidence += 20;
    }
  } else if (indicators.rsi > 70) {
    signals.push('RSI overbought - potential sell opportunity');
    if (indicators.trend === 'bearish') {
      action = 'SELL';
      confidence += 20;
    }
  }

  // MACD signals
  if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
    signals.push('MACD bullish crossover');
    if (action === 'HOLD') {
      action = 'BUY';
      confidence += 15;
    } else if (action === 'BUY') {
      confidence += 10;
    }
  } else if (indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal) {
    signals.push('MACD bearish crossover');
    if (action === 'HOLD') {
      action = 'SELL';
      confidence += 15;
    } else if (action === 'SELL') {
      confidence += 10;
    }
  }

  // Trend signals
  if (indicators.trend === 'bullish' && indicators.strength > 70) {
    signals.push(`Strong bullish trend (${indicators.strength}% strength)`);
    if (action === 'BUY') confidence += 10;
  } else if (indicators.trend === 'bearish' && indicators.strength > 70) {
    signals.push(`Strong bearish trend (${indicators.strength}% strength)`);
    if (action === 'SELL') confidence += 10;
  }

  // Bollinger Bands
  if (currentPrice < indicators.bollinger.lower) {
    signals.push('Price below lower Bollinger Band - potential bounce');
    if (action === 'BUY') confidence += 5;
  } else if (currentPrice > indicators.bollinger.upper) {
    signals.push('Price above upper Bollinger Band - potential pullback');
    if (action === 'SELL') confidence += 5;
  }

  // Calculate target and stop loss
  if (action === 'BUY') {
    targetPrice = indicators.resistance;
    stopLoss = Math.min(indicators.support, currentPrice * 0.95); // 5% stop loss or support
  } else if (action === 'SELL') {
    targetPrice = indicators.support;
    stopLoss = Math.max(indicators.resistance, currentPrice * 1.05); // 5% stop loss or resistance
  }

  // Cap confidence
  confidence = Math.min(100, confidence);

  // If confidence is too low, default to HOLD
  if (confidence < 60) {
    action = 'HOLD';
    signals.push('Insufficient signal strength - holding recommended');
  }

  return {
    symbol,
    action,
    confidence: Math.round(confidence),
    entryPrice: currentPrice,
    targetPrice: Math.round(targetPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    reasoning: signals.length > 0 ? signals : ['No clear signals detected'],
    indicators: {
      rsi: indicators.rsi,
      macd: indicators.macd.macd,
      trend: indicators.trend,
    },
  };
}
