/**
 * Market Data API Wrapper
 * 
 * Robust fetch wrapper for Twelve Data market data endpoints
 * Handles errors, retries, and provides standardized error responses
 */

export interface MarketDataError {
  code: string;
  message: string;
  provider: string;
  status?: number;
  retryable?: boolean;
}

export interface MarketDataResponse<T> {
  data: T | null;
  error: MarketDataError | null;
}

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '/api';

/**
 * Fetch real-time price for a symbol
 */
export async function fetchMarketPrice(symbol: string): Promise<MarketDataResponse<{
  symbol: string;
  price: number;
  timestamp: string;
  volume?: number;
  change?: number;
  change_percent?: number;
}>> {
  try {
    const response = await fetch(`${API_BASE}/api/market-data/${symbol}`);
    const result = await response.json();

    if (!response.ok) {
      // Use standardized error code from backend if available
      const errorCode = result.error || 'MARKET_DATA_ERROR';
      
      return {
        data: null,
        error: {
          code: errorCode,
          message: result.message || result.error || `Failed to fetch market data: ${response.statusText}`,
          provider: result.provider || 'twelvedata',
          status: result.status || response.status,
          retryable: response.status >= 500 || response.status === 429,
        },
      };
    }

    if (!result.success) {
      return {
        data: null,
        error: {
          code: 'MARKET_DATA_ERROR',
          message: result.error || 'Failed to fetch market data',
          provider: 'twelvedata',
          status: response.status,
          retryable: true,
        },
      };
    }

    return {
      data: result.data,
      error: null,
    };
  } catch (error: any) {
    // Network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network unavailable. Please check your connection.',
          provider: 'twelvedata',
          retryable: true,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Failed to fetch market data',
        provider: 'twelvedata',
        retryable: true,
      },
    };
  }
}

/**
 * Fetch time series data for a symbol
 */
export async function fetchMarketTimeSeries(
  symbol: string,
  options: {
    interval?: string;
    days?: number;
  } = {}
): Promise<MarketDataResponse<{
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
}>> {
  try {
    const { interval = '1h', days = 7 } = options;
    const response = await fetch(
      `${API_BASE}/api/market-data/${symbol}/timeseries?interval=${interval}&days=${days}`
    );
    const result = await response.json();

    if (!response.ok) {
      // Use standardized error code from backend if available
      const errorCode = result.error || 'MARKET_DATA_ERROR';
      
      return {
        data: null,
        error: {
          code: errorCode,
          message: result.message || result.error || `Failed to fetch time series: ${response.statusText}`,
          provider: result.provider || 'twelvedata',
          status: result.status || response.status,
          retryable: response.status >= 500 || response.status === 429,
        },
      };
    }

    if (!result.success) {
      return {
        data: null,
        error: {
          code: 'MARKET_DATA_ERROR',
          message: result.error || 'Failed to fetch time series',
          provider: 'twelvedata',
          status: response.status,
          retryable: true,
        },
      };
    }

    if (!result.data || !result.data.values || result.data.values.length === 0) {
      return {
        data: null,
        error: {
          code: 'NO_DATA',
          message: `No time series data available for ${symbol}`,
          provider: 'twelvedata',
          retryable: false,
        },
      };
    }

    return {
      data: result.data,
      error: null,
    };
  } catch (error: any) {
    // Network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        data: null,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network unavailable. Please check your connection.',
          provider: 'twelvedata',
          retryable: true,
        },
      };
    }

    return {
      data: null,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Failed to fetch time series',
        provider: 'twelvedata',
        retryable: true,
      },
    };
  }
}

/**
 * Get error message for UI display
 * Provides user-friendly messages instead of raw API errors
 */
export function getMarketErrorDisplay(error: MarketDataError): {
  title: string;
  message: string;
  actionLabel?: string;
} {
  switch (error.code) {
    case 'TWELVE_DATA_API_ERROR':
    case 'INVALID_API_KEY':
      // Always show user-friendly message, never the raw API error
      return {
        title: 'API Configuration Error',
        message: 'Twelve Data API key is missing or invalid. Please check your server configuration.',
        actionLabel: 'Check Setup',
      };
    case 'NETWORK_ERROR':
      return {
        title: 'Network Unavailable',
        message: 'Unable to connect to the market data service. Please check your internet connection.',
        actionLabel: 'Retry',
      };
    case 'NO_DATA':
      return {
        title: 'No Data Available',
        message: error.message,
      };
    case 'RATE_LIMIT_ERROR':
      return {
        title: 'Rate Limit Exceeded',
        message: 'Too many requests to the market data service. Please try again in a few minutes.',
        actionLabel: 'Retry Later',
      };
    case 'MARKET_DATA_ERROR':
      if (error.status === 429) {
        return {
          title: 'Rate Limit Exceeded',
          message: 'Too many requests. Please try again in a few minutes.',
          actionLabel: 'Retry Later',
        };
      }
      return {
        title: 'Market Data Error',
        message: 'Unable to fetch market data. Please try again later.',
        actionLabel: error.retryable ? 'Retry' : undefined,
      };
    default:
      return {
        title: 'Error',
        message: 'An error occurred while fetching market data.',
        actionLabel: error.retryable ? 'Retry' : undefined,
      };
  }
}
