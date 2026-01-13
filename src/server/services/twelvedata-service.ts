/**
 * Twelve Data Service
 * 
 * Technical wrapper for Twelve Data API
 * 
 * Responsibilities:
 * - Wrapper technique ONLY - no business logic
 * - Returns raw normalized data
 * - Handles errors, retries, rate limiting
 * 
 * RULE: This is a SERVICE, not an AGENT
 * - Does NOT decide what's important
 * - Does NOT filter by relevance
 * - Does NOT assign impact/priority
 * 
 * Usage: EventAgent uses this service to fetch market data
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });
dotenv.config();

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;
const TWELVEDATA_BASE_URL = 'https://api.twelvedata.com';

// Debug: Log API key status (without exposing the key)
if (!TWELVEDATA_API_KEY) {
  console.warn('[Twelve Data] ⚠️  TWELVEDATA_API_KEY not found in environment variables');
  console.warn('[Twelve Data] Please add TWELVEDATA_API_KEY to your .env file');
} else {
  console.log(`[Twelve Data] ✅ API key loaded (${TWELVEDATA_API_KEY.substring(0, 8)}...)`);
}

// Rate limiting: 8 requests/second (free tier)
const RATE_LIMIT_DELAY = 125; // ms between requests
let lastRequestTime = 0;

/**
 * Rate limiting helper
 */
async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

/**
 * Make API request with retry logic
 */
async function makeRequest(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<any> {
  if (!TWELVEDATA_API_KEY) {
    throw new Error('TWELVEDATA_API_KEY not configured');
  }

  await rateLimit();

  const url = new URL(endpoint, TWELVEDATA_BASE_URL);
  
  // Ensure API key is added first
  if (!TWELVEDATA_API_KEY || TWELVEDATA_API_KEY.trim() === '') {
    throw new Error('TWELVEDATA_API_KEY is empty or not configured. Please check your .env file.');
  }
  
  url.searchParams.append('apikey', TWELVEDATA_API_KEY.trim());
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  // Debug log (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Twelve Data] Request: ${endpoint} with symbol: ${params.symbol || 'N/A'}`);
  }

  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit hit - wait longer
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(`Twelve Data API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Twelve Data returns error in response body
      if (data.status === 'error') {
        const errorMessage = data.message || 'Unknown error';
        
        // Provide more helpful error messages
        if (errorMessage.includes('apikey') || errorMessage.includes('API key')) {
          throw new Error(`Twelve Data API key error: ${errorMessage}. Please verify TWELVEDATA_API_KEY in your .env file.`);
        }
        
        throw new Error(`Twelve Data API error: ${errorMessage}`);
      }

      return data;
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to fetch from Twelve Data API');
}

/**
 * Get real-time price for a symbol
 */
export async function getRealTimePrice(symbol: string): Promise<{
  symbol: string;
  price: number;
  timestamp: string;
  volume?: number;
  change?: number;
  change_percent?: number;
}> {
  const data = await makeRequest('/price', { symbol });
  
  return {
    symbol: data.symbol || symbol,
    price: parseFloat(data.price || '0'),
    timestamp: data.timestamp || new Date().toISOString(),
    volume: data.volume ? parseInt(data.volume) : undefined,
    change: data.change ? parseFloat(data.change) : undefined,
    change_percent: data.change_percent ? parseFloat(data.change_percent) : undefined,
  };
}

/**
 * Get time series data for a symbol
 */
export async function getTimeSeries(
  symbol: string,
  options: {
    interval?: '1min' | '5min' | '15min' | '30min' | '45min' | '1h' | '2h' | '4h' | '1day' | '1week' | '1month';
    start_date?: string;
    end_date?: string;
    outputsize?: number;
  } = {}
): Promise<{
  symbol: string;
  values: Array<{
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  meta: {
    symbol: string;
    interval: string;
    currency?: string;
    exchange?: string;
  };
}> {
  const data = await makeRequest('/time_series', {
    symbol,
    interval: options.interval || '1day',
    start_date: options.start_date,
    end_date: options.end_date,
    outputsize: options.outputsize || 100,
  });

  const values = (data.values || []).map((v: any) => ({
    datetime: v.datetime,
    open: parseFloat(v.open || '0'),
    high: parseFloat(v.high || '0'),
    low: parseFloat(v.low || '0'),
    close: parseFloat(v.close || '0'),
    volume: parseInt(v.volume || '0'),
  }));

  return {
    symbol: data.meta?.symbol || symbol,
    values,
    meta: {
      symbol: data.meta?.symbol || symbol,
      interval: data.meta?.interval || options.interval || '1day',
      currency: data.meta?.currency,
      exchange: data.meta?.exchange,
    },
  };
}

/**
 * Get forex rates
 */
export async function getForexRates(
  base: string = 'USD',
  symbols?: string[]
): Promise<{
  base: string;
  rates: Record<string, number>;
  timestamp: string;
}> {
  const symbolParam = symbols ? symbols.join(',') : undefined;
  const data = await makeRequest('/exchange_rate', {
    symbol: symbolParam || `${base}/EUR,${base}/GBP,${base}/JPY,${base}/CNY`,
  });

  const rates: Record<string, number> = {};
  if (data.rate) {
    // Single rate
    const pair = data.symbol?.split('/') || [];
    if (pair.length === 2) {
      rates[pair[1]] = parseFloat(data.rate);
    }
  } else if (data.rates) {
    // Multiple rates
    Object.entries(data.rates).forEach(([key, value]) => {
      rates[key] = parseFloat(String(value));
    });
  }

  return {
    base: data.base || base,
    rates,
    timestamp: data.timestamp || new Date().toISOString(),
  };
}

/**
 * Get crypto price
 */
export async function getCryptoPrice(symbol: string): Promise<{
  symbol: string;
  price: number;
  timestamp: string;
  volume?: number;
  market_cap?: number;
}> {
  const data = await makeRequest('/price', { symbol });
  
  return {
    symbol: data.symbol || symbol,
    price: parseFloat(data.price || '0'),
    timestamp: data.timestamp || new Date().toISOString(),
    volume: data.volume ? parseInt(data.volume) : undefined,
    market_cap: data.market_cap ? parseInt(data.market_cap) : undefined,
  };
}

/**
 * Get commodity price
 */
export async function getCommodityPrice(symbol: string): Promise<{
  symbol: string;
  price: number;
  timestamp: string;
  unit?: string;
}> {
  // Commodities use same price endpoint
  const data = await makeRequest('/price', { symbol });
  
  return {
    symbol: data.symbol || symbol,
    price: parseFloat(data.price || '0'),
    timestamp: data.timestamp || new Date().toISOString(),
    unit: data.unit,
  };
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    if (!TWELVEDATA_API_KEY) {
      return false;
    }
    // Try a simple request
    await getRealTimePrice('AAPL');
    return true;
  } catch {
    return false;
  }
}
