/**
 * Alpha Signals Service
 * 
 * Generates actionable alpha signals by combining:
 * - Technical analysis
 * - Event-market correlations
 * - Price predictions based on events
 * - Sentiment analysis
 */

import { getTechnicalIndicators, generateTradingSignal, type TradingSignal } from './technical-analysis-service.js';
import { getRealTimePrice, getTimeSeries } from './twelvedata-service.js';
import { withCache } from './cache-service.js';
import type { Event } from '../../types/intelligence.js';

export interface AlphaSignal {
  id: string;
  symbol: string;
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0-100
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
    correlation: number; // -1 to 1
    priceImpact: number; // Expected % change
    timeframe: string; // e.g., "6-18 hours"
  };
  pricePrediction: {
    current: number;
    target: number;
    stopLoss: number;
    timeframe: string;
    probability: number; // 0-100
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
}

/**
 * Analyze event-market correlation
 */
export async function analyzeEventMarketCorrelation(
  event: Event,
  symbol: string,
  hoursBefore: number = 24,
  hoursAfter: number = 48
): Promise<{
  correlation: number;
  priceImpact: number;
  timeframe: string;
} | null> {
  try {
    const eventDate = new Date(event.date);
    const beforeDate = new Date(eventDate.getTime() - hoursBefore * 60 * 60 * 1000);
    const afterDate = new Date(eventDate.getTime() + hoursAfter * 60 * 60 * 1000);

    // Get price data around event
    const timeSeries = await getTimeSeries(symbol, {
      interval: '1h',
      start_date: beforeDate.toISOString(),
      end_date: afterDate.toISOString(),
    });

    if (!timeSeries || !timeSeries.values || timeSeries.values.length < 2) {
      return null;
    }

    const prices = timeSeries.values;
    const eventIndex = prices.findIndex((p: any) => {
      const pDate = new Date(p.datetime);
      return pDate >= eventDate;
    });

    if (eventIndex === -1 || eventIndex === 0) {
      return null;
    }

    // Price before event (average of last 5 hours before)
    const beforePrices = prices.slice(Math.max(0, eventIndex - 5), eventIndex);
    const priceBefore = beforePrices.length > 0
      ? beforePrices.reduce((sum: number, p: any) => sum + p.close, 0) / beforePrices.length
      : prices[eventIndex - 1].close;

    // Price after event (average of next 5 hours after)
    const afterPrices = prices.slice(eventIndex, Math.min(prices.length, eventIndex + 5));
    const priceAfter = afterPrices.length > 0
      ? afterPrices.reduce((sum: number, p: any) => sum + p.close, 0) / afterPrices.length
      : prices[eventIndex].close;

    // Calculate impact
    const priceImpact = ((priceAfter - priceBefore) / priceBefore) * 100;

    // Correlation based on impact magnitude and direction
    // Higher impact = stronger correlation
    const correlation = Math.min(1, Math.abs(priceImpact) / 10); // Normalize to 0-1
    const signedCorrelation = priceImpact > 0 ? correlation : -correlation;

    // Determine timeframe based on when impact occurred
    const impactTime = afterPrices.length > 0
      ? Math.round((afterPrices.length * 60) / 60) // hours
      : 24;

    return {
      correlation: Math.round(signedCorrelation * 100) / 100,
      priceImpact: Math.round(priceImpact * 100) / 100,
      timeframe: `${impactTime}-${impactTime + 12} hours`,
    };
  } catch (error: any) {
    console.error('[AlphaSignals] Error analyzing event correlation:', error);
    return null;
  }
}

/**
 * Predict price based on event and technical analysis
 */
export async function predictPriceFromEvent(
  event: Event,
  symbol: string,
  currentPrice: number
): Promise<{
  target: number;
  stopLoss: number;
  probability: number;
  timeframe: string;
} | null> {
  try {
    // Analyze correlation
    const correlation = await analyzeEventMarketCorrelation(event, symbol);

    if (!correlation) {
      return null;
    }

    // Base prediction on historical correlation
    const expectedImpact = correlation.priceImpact;
    const target = currentPrice * (1 + expectedImpact / 100);
    
    // Stop loss: opposite direction, 50% of expected move
    const stopLoss = currentPrice * (1 - (Math.abs(expectedImpact) * 0.5) / 100);

    // Probability based on correlation strength
    const probability = Math.min(95, Math.abs(correlation.correlation) * 100);

    return {
      target: Math.round(target * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      probability: Math.round(probability),
      timeframe: correlation.timeframe,
    };
  } catch (error: any) {
    console.error('[AlphaSignals] Error predicting price:', error);
    return null;
  }
}

/**
 * Generate alpha signal for a symbol based on events and technicals
 */
export async function generateAlphaSignal(
  symbol: string,
  relatedEvents: Event[] = []
): Promise<AlphaSignal | null> {
  try {
    // Get current price (with cache)
    const priceData = await getRealTimePrice(symbol);
    if (!priceData || !priceData.price) {
      return null;
    }

    const currentPrice = priceData.price;

    // Get technical indicators (with cache)
    const technicals = await getTechnicalIndicators(symbol);
    if (!technicals) {
      return null;
    }

    // Generate technical trading signal
    const tradingSignal = generateTradingSignal(symbol, technicals, currentPrice);

    // Find most relevant event (highest impact score)
    const relevantEvent = relatedEvents
      .filter(e => e.impact_score && e.impact_score > 50)
      .sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0))[0];

    let eventCorrelation = undefined;
    let pricePrediction = {
      current: currentPrice,
      target: tradingSignal.targetPrice,
      stopLoss: tradingSignal.stopLoss,
      timeframe: '24-48 hours',
      probability: tradingSignal.confidence,
    };

    // If we have a relevant event, analyze correlation
    if (relevantEvent) {
      const correlation = await analyzeEventMarketCorrelation(relevantEvent, symbol);
      if (correlation) {
        eventCorrelation = {
          eventId: relevantEvent.id,
          eventTitle: relevantEvent.headline || relevantEvent.title || 'Event',
          correlation: correlation.correlation,
          priceImpact: correlation.priceImpact,
          timeframe: correlation.timeframe,
        };

        // Enhance prediction with event data
        const eventPrediction = await predictPriceFromEvent(relevantEvent, symbol, currentPrice);
        if (eventPrediction) {
          // Combine technical and event-based predictions
          pricePrediction = {
            current: currentPrice,
            target: (tradingSignal.targetPrice + eventPrediction.target) / 2,
            stopLoss: (tradingSignal.stopLoss + eventPrediction.stopLoss) / 2,
            timeframe: eventPrediction.timeframe,
            probability: Math.min(95, (tradingSignal.confidence + eventPrediction.probability) / 2),
          };
        }
      }
    }

    // Determine overall signal strength
    let signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD';
    let confidence = tradingSignal.confidence;

    if (tradingSignal.action === 'BUY') {
      if (confidence >= 80 || (eventCorrelation && eventCorrelation.correlation > 0.7)) {
        signal = 'STRONG_BUY';
      } else {
        signal = 'BUY';
      }
    } else if (tradingSignal.action === 'SELL') {
      if (confidence >= 80 || (eventCorrelation && eventCorrelation.correlation < -0.7)) {
        signal = 'STRONG_SELL';
      } else {
        signal = 'SELL';
      }
    }

    // Boost confidence if event correlation is strong
    if (eventCorrelation && Math.abs(eventCorrelation.correlation) > 0.6) {
      confidence = Math.min(100, confidence + 15);
    }

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (Math.abs(pricePrediction.target - currentPrice) / currentPrice < 0.02) {
      riskLevel = 'LOW';
    } else if (Math.abs(pricePrediction.target - currentPrice) / currentPrice > 0.1) {
      riskLevel = 'HIGH';
    }

    // Build reasoning
    const reasoning = [...tradingSignal.reasoning];
    if (eventCorrelation) {
      reasoning.push(
        `Event correlation: ${(eventCorrelation.correlation * 100).toFixed(0)}% (${eventCorrelation.priceImpact > 0 ? '+' : ''}${eventCorrelation.priceImpact.toFixed(2)}% impact)`
      );
      reasoning.push(`Historical similar events show ${eventCorrelation.timeframe} timeframe`);
    }

    return {
      id: `alpha-${symbol}-${Date.now()}`,
      symbol,
      signal,
      confidence: Math.round(confidence),
      reasoning,
      technical: {
        rsi: technicals.rsi,
        macd: technicals.macd.macd,
        trend: technicals.trend,
        strength: technicals.strength,
      },
      eventCorrelation,
      pricePrediction,
      riskLevel,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[AlphaSignals] Error generating alpha signal:', error);
    return null;
  }
}

/**
 * Generate alpha signals for multiple symbols
 */
export async function generateAlphaSignalsForSymbols(
  symbols: string[],
  events: Event[] = []
): Promise<AlphaSignal[]> {
  const signals = await Promise.all(
    symbols.map(async (symbol) => {
      // Find events related to this symbol
      const symbolEvents = events.filter(e => {
        // Match by sectors, entities, or market_data symbol
        const eventSymbol = e.market_data?.symbol;
        return eventSymbol === symbol || 
               e.sectors.some(s => symbol.toLowerCase().includes(s.toLowerCase()));
      });

      return await generateAlphaSignal(symbol, symbolEvents);
    })
  );

  return signals.filter((s): s is AlphaSignal => s !== null);
}
